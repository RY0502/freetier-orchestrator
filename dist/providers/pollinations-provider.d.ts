import { ErrorKind, type Logger, type Provider } from "../types.js";
import type { ImageGenInput } from "./types.js";
/**
 * A self-contained text-to-image provider that calls the Pollinations API.
 *
 * - Accepts a text prompt, model name, and output file path.
 * - URL-encodes the prompt and calls `GET https://gen.pollinations.ai/image/{prompt}?model={model}`.
 * - Saves the image bytes to the given output path and returns the resolved path.
 * - Includes built-in retry logic (2 retries, 15s apart for transient errors)
 *   and rate-limit cooldown (1 min for 429 errors).
 *
 * Also implements `classifyError()` so it works correctly when wrapped in a
 * `FreeTierOrchestrator` for future multi-provider failover.
 */
export declare class PollinationsImageProvider implements Provider<ImageGenInput, string> {
    readonly name = "Pollinations";
    private readonly logger;
    private readonly requestTimeoutMs;
    constructor(options?: {
        logger?: Logger;
        requestTimeoutMs?: number;
    });
    getModelConfig(): {
        textModel: string;
        visionModel: string;
    };
    /**
     * Classify an error for the orchestrator's retry/failover logic.
     * This allows the provider to work seamlessly inside `FreeTierOrchestrator`.
     */
    classifyError(error: unknown): ErrorKind | undefined;
    /**
     * Generate an image from a text prompt and save it to the specified output path.
     *
     * Includes self-contained retry and rate-limit cooldown logic:
     * - Transient / network / model-busy errors: retry up to 2 more times, 15s apart.
     * - Rate-limit (429): wait 1 minute, then retry once.
     * - Fatal errors (other 4xx): throw immediately.
     */
    invoke(input: ImageGenInput): Promise<string>;
    /** Build the full Pollinations API URL with all supplied query parameters. */
    private buildUrl;
    /** Perform the HTTP GET to the Pollinations API and return the raw image bytes. */
    private fetchImage;
    /** Write image bytes to disk, creating parent directories if needed. */
    private saveImage;
    /** Check if the error is a rate-limit / quota error. */
    private isRateLimitError;
    /** Check if the error is fatal (non-recoverable, non-retryable). */
    private isFatalError;
}
//# sourceMappingURL=pollinations-provider.d.ts.map