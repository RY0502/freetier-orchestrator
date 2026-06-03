import { type NodeAdapterOptions, type OrchestratorOptions, type Provider, type ProviderStatus } from "./types.js";
/**
 * A provider-agnostic, LangGraph-native orchestrator that maximizes free-tier
 * usage. It tries providers in priority order; retries transient failures; and
 * on rate-limit/quota errors it cools the provider down and seamlessly switches
 * to the next one, carrying the exact same input (context) across the switch.
 */
export declare class FreeTierOrchestrator<TInput = unknown, TOutput = unknown> {
    private readonly registry;
    private readonly retry;
    private readonly cooldown;
    private readonly logger;
    private readonly graph;
    constructor(providers: Provider<TInput, TOutput>[], options?: OrchestratorOptions);
    private buildGraph;
    /** Run the providers for a single call, returning the first successful output. */
    invoke(input: TInput): Promise<TOutput>;
    /**
     * Wrap this orchestrator as a LangGraph node so a parent agent can route its
     * model calls through the free-tier framework. The parent's state is mapped to
     * the provider input via `buildInput`, and the result is merged back via
     * `applyOutput` — keeping the parent graph's context intact.
     */
    asNode<TState>(options: NodeAdapterOptions<TState, TInput, TOutput>): (state: TState) => Promise<Partial<TState>>;
    /** Current sticky-default provider name. */
    getCurrentProvider(): string;
    /** Snapshot of every provider's cooldown state. */
    getStatus(): ProviderStatus[];
}
//# sourceMappingURL=orchestrator.d.ts.map