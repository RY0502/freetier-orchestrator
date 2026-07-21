import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { classifyError } from "./errors.js";
import { defaultLogger } from "./logger.js";
import { ProviderRegistry } from "./registry.js";
import { ErrorKind } from "./types.js";
const DEFAULT_RETRY = { maxRetries: 2, retryDelayMs: 10_000 };
const DEFAULT_COOLDOWN = { cooldownMs: 120_000 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Internal graph state. `input` is carried unchanged across every provider attempt,
 * which is what guarantees that context/progress is preserved when switching providers.
 */
const OrchestratorState = Annotation.Root({
    input: Annotation(),
    index: Annotation(),
    tried: Annotation(),
    attempt: Annotation(),
    route: Annotation(),
    outcome: Annotation(),
    output: Annotation(),
    providerName: Annotation(),
    lastError: Annotation()
});
/**
 * A provider-agnostic, LangGraph-native orchestrator that maximizes free-tier
 * usage. It tries providers in priority order; retries transient failures; and
 * on rate-limit/quota errors it cools the provider down and seamlessly switches
 * to the next one, carrying the exact same input (context) across the switch.
 */
export class FreeTierOrchestrator {
    registry;
    retry;
    cooldown;
    logger;
    graph;
    constructor(providers, options = {}) {
        this.registry = new ProviderRegistry(providers);
        this.retry = { ...DEFAULT_RETRY, ...(options.retry ?? {}) };
        this.cooldown = { ...DEFAULT_COOLDOWN, ...(options.cooldown ?? {}) };
        this.logger = options.logger ?? defaultLogger;
        this.graph = this.buildGraph();
        this.logger.info(`[FreeTier-Orchestrator] Initialized with ${this.registry.size()} provider(s): ${this.registry.describe().join(", ")}`);
    }
    buildGraph() {
        const selectNode = (state) => {
            const total = this.registry.size();
            let index = state.index;
            let tried = state.tried;
            while (tried < total) {
                if (!this.registry.isInCooldown(index)) {
                    return { index, tried, attempt: 0, route: "call", providerName: this.registry.at(index).name };
                }
                this.logger.info(`[FreeTier-Orchestrator] Provider "${this.registry.at(index).name}" is in cooldown, skipping.`);
                index = (index + 1) % total;
                tried += 1;
            }
            return { outcome: "exhausted", route: "done" };
        };
        const callNode = async (state) => {
            const provider = this.registry.at(state.index);
            this.logger.info(`[FreeTier-Orchestrator] Calling "${provider.name}" (provider ${state.tried + 1}/${this.registry.size()}, attempt ${state.attempt + 1}/${this.retry.maxRetries + 1}).`);
            try {
                const output = await provider.invoke(state.input);
                this.registry.clearCooldown(state.index);
                this.registry.setCurrent(state.index);
                this.logger.info(`[FreeTier-Orchestrator] Provider "${provider.name}" succeeded.`);
                return { output, outcome: "success", route: "success" };
            }
            catch (error) {
                const kind = classifyError(error, provider);
                const message = error instanceof Error ? error.message : String(error);
                if (kind === ErrorKind.Retryable) {
                    if (state.attempt < this.retry.maxRetries) {
                        this.logger.warn(`[FreeTier-Orchestrator] Provider "${provider.name}" transient error, will retry: ${message}`);
                        return { route: "retry", lastError: message };
                    }
                    this.logger.warn(`[FreeTier-Orchestrator] Provider "${provider.name}" transient error, retries exhausted, advancing: ${message}`);
                    return { route: "advance-transient", lastError: message };
                }
                if (kind === ErrorKind.Quota) {
                    this.logger.warn(`[FreeTier-Orchestrator] Provider "${provider.name}" quota/rate-limit error, advancing: ${message}`);
                    return { route: "advance-quota", lastError: message };
                }
                this.logger.error(`[FreeTier-Orchestrator] Provider "${provider.name}" fatal error: ${message}`);
                return { outcome: "fatal", route: "fatal", lastError: message };
            }
        };
        const waitNode = async (state) => {
            this.logger.info(`[FreeTier-Orchestrator] Waiting ${this.retry.retryDelayMs}ms before retry.`);
            await sleep(this.retry.retryDelayMs);
            return { attempt: state.attempt + 1, route: "call" };
        };
        const advanceNode = (state) => {
            if (state.route === "advance-quota") {
                this.registry.setCooldown(state.index, this.cooldown.cooldownMs);
                this.logger.info(`[FreeTier-Orchestrator] Provider "${this.registry.at(state.index).name}" cooling down for ${this.cooldown.cooldownMs / 1000}s.`);
            }
            const total = this.registry.size();
            const nextIndex = (state.index + 1) % total;
            this.registry.setCurrent(nextIndex);
            this.logger.info(`[FreeTier-Orchestrator] Switching from "${this.registry.at(state.index).name}" to "${this.registry.at(nextIndex).name}".`);
            return { index: nextIndex, tried: state.tried + 1, attempt: 0, route: "select" };
        };
        return new StateGraph(OrchestratorState)
            .addNode("select", selectNode)
            .addNode("call", callNode)
            .addNode("wait", waitNode)
            .addNode("advance", advanceNode)
            .addEdge(START, "select")
            .addConditionalEdges("select", (state) => state.route, { call: "call", done: END })
            .addConditionalEdges("call", (state) => state.route, {
            success: END,
            fatal: END,
            retry: "wait",
            "advance-quota": "advance",
            "advance-transient": "advance"
        })
            .addEdge("wait", "call")
            .addEdge("advance", "select")
            .compile();
    }
    /** Run the providers for a single call, returning the first successful output. */
    async invoke(input) {
        const final = await this.graph.invoke({
            input,
            index: this.registry.current(),
            tried: 0,
            attempt: 0,
            route: "",
            outcome: "pending",
            output: undefined,
            providerName: undefined,
            lastError: undefined
        });
        if (final.outcome === "success") {
            return final.output;
        }
        if (final.outcome === "fatal") {
            throw new Error(`[FreeTier-Orchestrator] Provider "${final.providerName}" failed with a non-recoverable error: ${final.lastError}`);
        }
        throw new Error(`[FreeTier-Orchestrator] All ${this.registry.size()} provider(s) exhausted (${this.registry.names().join(", ")}). Last error: ${final.lastError ?? "unknown"}`);
    }
    /**
     * Wrap this orchestrator as a LangGraph node so a parent agent can route its
     * model calls through the free-tier framework. The parent's state is mapped to
     * the provider input via `buildInput`, and the result is merged back via
     * `applyOutput` — keeping the parent graph's context intact.
     */
    asNode(options) {
        return async (state) => {
            const output = await this.invoke(options.buildInput(state));
            return options.applyOutput(state, output);
        };
    }
    /** Current sticky-default provider name. */
    getCurrentProvider() {
        return this.registry.at(this.registry.current()).name;
    }
    /** Snapshot of every provider's cooldown state. */
    getStatus() {
        return this.registry.status();
    }
}
