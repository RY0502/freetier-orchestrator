import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { HttpError } from "../errors.js";
import { defaultLogger } from "../logger.js";
const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const DEFAULT_MODEL = "canopylabs/orpheus-v1-english";
const DEFAULT_VOICE = "hannah";
const DEFAULT_FORMAT = "wav";
/** Retry policy for transient / network / model-busy errors. */
const TRANSIENT_MAX_RETRIES = 2;
const TRANSIENT_RETRY_DELAY_MS = 10_000;
/** Default timeout for the TTS HTTP request (2 minutes). */
const DEFAULT_REQUEST_TIMEOUT_MS = 120_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/**
 * Load all Groq API keys from environment variables.
 * Reads GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3, … in order.
 */
function loadGroqApiKeys() {
    const keys = [];
    for (let i = 1;; i++) {
        const key = process.env[`GROQ_API_KEY_${i}`];
        if (!key)
            break;
        keys.push(key);
    }
    return keys;
}
/** Check if the error is a rate-limit / quota error. */
function isQuotaError(error) {
    if (error instanceof HttpError && error.status === 429)
        return true;
    const message = error instanceof Error ? error.message : String(error);
    return /rate.?limit|too many requests|quota|429/i.test(message);
}
/** Check if the error is transient (network / model busy). */
function isTransientError(error) {
    if (error instanceof HttpError) {
        return [408, 500, 502, 503, 504, 529].includes(error.status);
    }
    const message = error instanceof Error ? error.message : String(error);
    return /timeout|timed out|network|fetch failed|econnreset|econnrefused|socket hang up|under load|overload|model.*(busy|loading)|service unavailable|502|503|504/i.test(message);
}
/**
 * Call the Groq TTS API with the given API key and input. Returns raw audio bytes.
 */
async function callGroqTTS(apiKey, input, model, voice, responseFormat, timeoutMs) {
    const response = await fetch(GROQ_TTS_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "*/*"
        },
        body: JSON.stringify({
            model,
            input,
            voice,
            response_format: responseFormat
        }),
        signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
        const errorText = await response.text().catch(() => "unable to read response body");
        throw new HttpError(response.status, `Groq TTS API error (${response.status}): ${errorText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
        throw new Error("Groq TTS returned an empty response body (0 bytes).");
    }
    return Buffer.from(arrayBuffer);
}
/**
 * Creates a LangChain tool for text-to-speech audio generation via the Groq API.
 *
 * Supports multi-key rotation: reads `GROQ_API_KEY_1`, `GROQ_API_KEY_2`, etc.
 * from environment variables. On quota exhaustion (429), switches to the next key.
 * On transient/network errors, retries 2 more times with 10s intervals.
 *
 * @param options Optional logger, timeout, and API keys overrides.
 * @returns A `DynamicStructuredTool` that generates audio from text.
 *
 * @example
 * ```ts
 * import { createAudioGenTool } from "@freetier/orchestrator";
 *
 * const tool = createAudioGenTool();
 * const result = await tool.invoke({
 *   input: "Hello, welcome to our presentation.",
 *   outputPath: "./output/speech.wav"
 * });
 * ```
 */
export function createAudioGenTool(options) {
    const logger = options?.logger ?? defaultLogger;
    const timeoutMs = options?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const apiKeys = options?.apiKeys ?? loadGroqApiKeys();
    if (apiKeys.length === 0) {
        throw new Error("[GroqAudio] No Groq API keys found. Set GROQ_API_KEY_1, GROQ_API_KEY_2, etc. in your environment.");
    }
    logger.info(`[GroqAudio] Initialized with ${apiKeys.length} API key(s).`);
    return new DynamicStructuredTool({
        name: "generate_audio",
        description: "Generate speech audio from text using the Groq TTS API. " +
            "Saves the audio file to the specified output path and returns the file path. " +
            'Supports configurable voice (default: "hannah"), model, and output format (default: "wav").',
        schema: z.object({
            input: z.string().describe("The text to convert to speech"),
            outputPath: z.string().describe("File path where the generated audio will be saved"),
            voice: z.string().optional().describe('Voice to use (default: "hannah")'),
            model: z.string().optional().describe('TTS model (default: "canopylabs/orpheus-v1-english")'),
            responseFormat: z.string().optional().describe('Audio format: "wav", "mp3", "opus", etc. (default: "wav")')
        }),
        func: async (toolInput) => {
            const model = toolInput.model ?? DEFAULT_MODEL;
            const voice = toolInput.voice ?? DEFAULT_VOICE;
            const responseFormat = toolInput.responseFormat ?? DEFAULT_FORMAT;
            const outputPath = resolve(toolInput.outputPath);
            logger.info(`[GroqAudio] Generating audio — model="${model}", voice="${voice}", format="${responseFormat}"`);
            logger.info(`[GroqAudio] Text: "${toolInput.input.slice(0, 100)}${toolInput.input.length > 100 ? "…" : ""}"`);
            logger.info(`[GroqAudio] Output: ${outputPath}`);
            let lastError;
            // ── Key rotation loop: try each API key on quota exhaustion ──
            for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
                const apiKey = apiKeys[keyIndex];
                logger.info(`[GroqAudio] Using API key ${keyIndex + 1}/${apiKeys.length}.`);
                // ── Attempt loop per key (1 initial + up to TRANSIENT_MAX_RETRIES retries) ──
                for (let attempt = 0; attempt <= TRANSIENT_MAX_RETRIES; attempt++) {
                    try {
                        logger.info(`[GroqAudio] Attempt ${attempt + 1}/${TRANSIENT_MAX_RETRIES + 1} with key ${keyIndex + 1}.`);
                        const audioBuffer = await callGroqTTS(apiKey, toolInput.input, model, voice, responseFormat, timeoutMs);
                        // Save to disk
                        const dir = dirname(outputPath);
                        await mkdir(dir, { recursive: true });
                        await writeFile(outputPath, audioBuffer);
                        logger.info(`[GroqAudio] Audio saved successfully to "${outputPath}".`);
                        return outputPath;
                    }
                    catch (error) {
                        lastError = error instanceof Error ? error : new Error(String(error));
                        // ── Quota exhaustion (429): switch to next key ──
                        if (isQuotaError(error)) {
                            logger.warn(`[GroqAudio] Quota exhausted on key ${keyIndex + 1}/${apiKeys.length}: ${lastError.message}. ` +
                                (keyIndex < apiKeys.length - 1 ? "Switching to next key." : "All keys exhausted."));
                            break; // break inner retry loop, advance to next key
                        }
                        // ── Transient / network error: retry if attempts remain ──
                        if (isTransientError(error) && attempt < TRANSIENT_MAX_RETRIES) {
                            logger.warn(`[GroqAudio] Transient error on attempt ${attempt + 1}/${TRANSIENT_MAX_RETRIES + 1}: ${lastError.message}. ` +
                                `Retrying in ${TRANSIENT_RETRY_DELAY_MS / 1000}s...`);
                            await sleep(TRANSIENT_RETRY_DELAY_MS);
                            continue;
                        }
                        // ── Fatal or retries exhausted: if transient and retries done, try next key ──
                        if (isTransientError(error) && attempt >= TRANSIENT_MAX_RETRIES) {
                            logger.warn(`[GroqAudio] Transient retries exhausted on key ${keyIndex + 1}. ` +
                                (keyIndex < apiKeys.length - 1 ? "Switching to next key." : "All keys exhausted."));
                            break;
                        }
                        // ── Fatal error: throw immediately ──
                        logger.error(`[GroqAudio] Fatal error: ${lastError.message}`);
                        return `Error generating audio: ${lastError.message}`;
                    }
                }
            }
            const message = `[GroqAudio] Audio generation failed. All ${apiKeys.length} API key(s) exhausted. ` +
                `Last error: ${lastError?.message ?? "unknown"}`;
            logger.error(message);
            return `Error generating audio: ${message}`;
        }
    });
}
