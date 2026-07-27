import { DynamicStructuredTool } from "@langchain/core/tools";
import type { Logger } from "../types.js";
/**
 * Creates a LangChain tool for image generation via the Pollinations API.
 *
 * Any LangChain agent can discover and invoke this tool. It wraps the
 * `PollinationsImageProvider` internally, inheriting its self-contained
 * retry (2×, 15s) and rate-limit cooldown (1 min) logic.
 *
 * @param options Optional logger and request timeout overrides.
 * @returns A `DynamicStructuredTool` that generates images from text prompts.
 *
 * @example
 * ```ts
 * import { createImageGenTool } from "@freetier/orchestrator";
 *
 * const tool = createImageGenTool();
 * const result = await tool.invoke({
 *   prompt: "a cat in space",
 *   model: "flux",
 *   outputPath: "./output/cat.png"
 * });
 * ```
 */
export declare function createImageGenTool(options?: {
    logger?: Logger;
    requestTimeoutMs?: number;
}): DynamicStructuredTool;
//# sourceMappingURL=image-gen.tool.d.ts.map