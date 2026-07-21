/**
 * How an error should be handled by the orchestrator.
 */
export declare enum ErrorKind {
    /** Transient issue (network, timeout, model busy/loading/under load, unreachable). Retry the same provider. */
    Retryable = "retryable",
    /** Free-tier / rate-limit / quota issue. Stop using this provider for a cooldown and switch to the next one. */
    Quota = "quota",
    /** Any other error. Not recoverable by switching providers; bubble up immediately. */
    Fatal = "fatal"
}
/**
 * A single free-tier option the orchestrator can call.
 *
 * The framework is intentionally agnostic about what the provider does. `TInput`
 * is the immutable call payload (e.g. chat messages, a prompt + image, etc.) and
 * `TOutput` is whatever the provider returns. The SAME `TInput` instance is handed
 * to every provider that is tried, so conversation/context is never lost on a switch.
 */
export interface Provider<TInput = unknown, TOutput = unknown> {
    /** Unique, human-readable provider name used for logging and status. */
    readonly name: string;
    /** Perform the actual call. Throw on failure. */
    invoke(input: TInput): Promise<TOutput>;
    /**
     * Optional model metadata used for logging and observability.
     */
    getModelConfig?(): {
        textModel: string;
        visionModel: string;
    };
    /**
     * Optional custom error classification. Return an {@link ErrorKind} to override
     * the built-in classifier, or `undefined` to defer to the default behavior.
     */
    classifyError?(error: unknown): ErrorKind | undefined;
}
export interface RetryPolicy {
    /** Additional attempts after the first call, for {@link ErrorKind.Retryable} errors. */
    maxRetries: number;
    /** Delay between retries, in milliseconds. */
    retryDelayMs: number;
}
export interface CooldownPolicy {
    /** How long a provider is skipped after a {@link ErrorKind.Quota} error, in milliseconds. */
    cooldownMs: number;
}
export interface Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
export interface OrchestratorOptions {
    retry?: Partial<RetryPolicy>;
    cooldown?: Partial<CooldownPolicy>;
    logger?: Logger;
}
export interface ProviderStatus {
    provider: string;
    inCooldown: boolean;
    cooldownMsRemaining: number;
}
export interface NodeAdapterOptions<TState, TInput, TOutput> {
    /** Build the immutable provider input from the current graph state. */
    buildInput: (state: TState) => TInput;
    /** Merge the provider output back into the graph state. */
    applyOutput: (state: TState, output: TOutput) => Partial<TState>;
}
//# sourceMappingURL=types.d.ts.map