import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { HttpError } from "../errors.js";
import { defaultLogger } from "../logger.js";
import { ErrorKind, type Logger, type Provider } from "../types.js";
import type { ImageGenInput } from "./types.js";

const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";

/** Retry policy for transient / network / model-busy errors. */
const TRANSIENT_MAX_RETRIES = 2;
const TRANSIENT_RETRY_DELAY_MS = 15_000;

/** Cooldown policy for rate-limit (429) errors. */
const RATE_LIMIT_COOLDOWN_MS = 60_000;

/** Default timeout for the image generation HTTP request (5 minutes). */
const DEFAULT_REQUEST_TIMEOUT_MS = 300_000;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

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
export class PollinationsImageProvider implements Provider<ImageGenInput, string> {
  readonly name = "Pollinations";
  private readonly logger: Logger;
  private readonly requestTimeoutMs: number;

  constructor(options?: { logger?: Logger; requestTimeoutMs?: number }) {
    this.logger = options?.logger ?? defaultLogger;
    this.requestTimeoutMs = options?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  getModelConfig() {
    return { textModel: "N/A", visionModel: "N/A" };
  }

  /**
   * Classify an error for the orchestrator's retry/failover logic.
   * This allows the provider to work seamlessly inside `FreeTierOrchestrator`.
   */
  classifyError(error: unknown): ErrorKind | undefined {
    if (error instanceof HttpError) {
      if (error.status === 429) return ErrorKind.Quota;
      if ([408, 500, 502, 503, 504, 529].includes(error.status)) return ErrorKind.Retryable;
      return ErrorKind.Fatal;
    }

    const message = error instanceof Error ? error.message : String(error);

    if (/rate.?limit|too many requests|quota|429/i.test(message)) return ErrorKind.Quota;
    if (/timeout|timed out|network|fetch failed|econnreset|econnrefused|socket hang up|under load|overload|model.*(busy|loading)|service unavailable|502|503|504/i.test(message)) {
      return ErrorKind.Retryable;
    }

    return undefined; // defer to default classifier
  }

  /**
   * Generate an image from a text prompt and save it to the specified output path.
   *
   * Includes self-contained retry and rate-limit cooldown logic:
   * - Transient / network / model-busy errors: retry up to 2 more times, 15s apart.
   * - Rate-limit (429): wait 1 minute, then retry once.
   * - Fatal errors (other 4xx): throw immediately.
   */
  async invoke(input: ImageGenInput): Promise<string> {
    const encodedPrompt = encodeURIComponent(input.prompt);
    const url = this.buildUrl(encodedPrompt, input);
    const outputPath = resolve(input.outputPath);

    this.logger.info(`[Pollinations] Generating image — model="${input.model}", prompt="${input.prompt}"`);
    this.logger.info(`[Pollinations] URL: ${url}`);
    this.logger.info(`[Pollinations] Output: ${outputPath}`);

    let lastError: Error | undefined;

    // ── Attempt loop (1 initial + up to TRANSIENT_MAX_RETRIES retries) ──
    for (let attempt = 0; attempt <= TRANSIENT_MAX_RETRIES; attempt++) {
      try {
        const imageBuffer = await this.fetchImage(url, attempt);
        await this.saveImage(outputPath, imageBuffer);

        this.logger.info(`[Pollinations] Image saved successfully to "${outputPath}" (attempt ${attempt + 1}/${TRANSIENT_MAX_RETRIES + 1}).`);
        return outputPath;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // ── Rate-limit (429): cooldown and retry once ──
        if (this.isRateLimitError(error)) {
          this.logger.warn(`[Pollinations] Rate-limited (429) on attempt ${attempt + 1}. Cooling down for ${RATE_LIMIT_COOLDOWN_MS / 1000}s before retrying.`);
          await sleep(RATE_LIMIT_COOLDOWN_MS);
          // After cooldown, let the loop continue to the next attempt
          continue;
        }

        // ── Fatal (non-retryable) errors: throw immediately ──
        if (this.isFatalError(error)) {
          this.logger.error(`[Pollinations] Fatal error on attempt ${attempt + 1}: ${lastError.message}`);
          throw lastError;
        }

        // ── Transient / network error: retry if attempts remain ──
        if (attempt < TRANSIENT_MAX_RETRIES) {
          this.logger.warn(
            `[Pollinations] Transient error on attempt ${attempt + 1}/${TRANSIENT_MAX_RETRIES + 1}: ${lastError.message}. ` +
              `Retrying in ${TRANSIENT_RETRY_DELAY_MS / 1000}s...`
          );
          await sleep(TRANSIENT_RETRY_DELAY_MS);
        } else {
          this.logger.error(
            `[Pollinations] All ${TRANSIENT_MAX_RETRIES + 1} attempts exhausted. Last error: ${lastError.message}`
          );
        }
      }
    }

    throw new Error(
      `[Pollinations] Image generation failed after ${TRANSIENT_MAX_RETRIES + 1} attempts. ` +
        `Model="${input.model}", prompt="${input.prompt}". Last error: ${lastError?.message ?? "unknown"}`
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────

  /** Build the full Pollinations API URL with all supplied query parameters. */
  private buildUrl(encodedPrompt: string, input: ImageGenInput): string {
    const params = new URLSearchParams();
    params.set("model", input.model);

    if (input.width !== undefined) params.set("width", String(input.width));
    if (input.height !== undefined) params.set("height", String(input.height));
    if (input.seed !== undefined) params.set("seed", String(input.seed));
    if (input.safe !== undefined) params.set("safe", String(input.safe));
    if (input.quality !== undefined) params.set("quality", input.quality);
    if (input.image !== undefined) params.set("image", input.image);
    if (input.transparent !== undefined) params.set("transparent", String(input.transparent));
    if (input.duration !== undefined) params.set("duration", String(input.duration));
    if (input.aspectRatio !== undefined) params.set("aspectRatio", input.aspectRatio);
    if (input.audio !== undefined) params.set("audio", String(input.audio));

    return `${POLLINATIONS_BASE_URL}/${encodedPrompt}?${params.toString()}`;
  }

  /** Perform the HTTP GET to the Pollinations API and return the raw image bytes. */
  private async fetchImage(url: string, attempt: number): Promise<Buffer> {
    this.logger.info(`[Pollinations] Fetching image (attempt ${attempt + 1}/${TRANSIENT_MAX_RETRIES + 1})...`);

    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(this.requestTimeoutMs)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unable to read response body");
      throw new HttpError(response.status, `Pollinations API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      throw new Error("Pollinations returned an empty response body (0 bytes).");
    }

    return Buffer.from(arrayBuffer);
  }

  /** Write image bytes to disk, creating parent directories if needed. */
  private async saveImage(outputPath: string, imageBuffer: Buffer): Promise<void> {
    const dir = dirname(outputPath);
    await mkdir(dir, { recursive: true });
    await writeFile(outputPath, imageBuffer);
  }

  /** Check if the error is a rate-limit / quota error. */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof HttpError && error.status === 429) return true;
    const message = error instanceof Error ? error.message : String(error);
    return /rate.?limit|too many requests|quota|429/i.test(message);
  }

  /** Check if the error is fatal (non-recoverable, non-retryable). */
  private isFatalError(error: unknown): boolean {
    if (error instanceof HttpError) {
      // 4xx (except 429 rate-limit and 408 timeout) are fatal
      return error.status >= 400 && error.status < 500 && error.status !== 429 && error.status !== 408;
    }
    return false;
  }
}
