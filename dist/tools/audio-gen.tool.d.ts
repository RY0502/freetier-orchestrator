import { DynamicStructuredTool } from "@langchain/core/tools";
import type { Logger } from "../types.js";
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
export declare function createAudioGenTool(options?: {
    logger?: Logger;
    requestTimeoutMs?: number;
    /** Override API keys instead of reading from env. */
    apiKeys?: string[];
}): DynamicStructuredTool;
//# sourceMappingURL=audio-gen.tool.d.ts.map