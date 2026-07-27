import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PollinationsImageProvider } from "../providers/pollinations-provider.js";
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
export function createImageGenTool(options) {
    const provider = new PollinationsImageProvider(options);
    return new DynamicStructuredTool({
        name: "generate_image",
        description: "Generate an image from a text prompt using the Pollinations API. " +
            "Saves the image to the specified output path and returns the file path. " +
            "Supports models like flux, zimage, gptimage, kontext, seedream5, etc.",
        schema: z.object({
            prompt: z.string().describe("Text description of the image to generate"),
            model: z.string().describe('Model to use (e.g. "flux", "zimage", "gptimage", "kontext")'),
            outputPath: z.string().describe("File path where the generated image will be saved"),
            width: z.number().int().positive().optional().describe("Width in pixels (default: 1024)"),
            height: z.number().int().positive().optional().describe("Height in pixels (default: 1024)"),
            seed: z.number().int().optional().describe("Seed for reproducible results. Use -1 for random (default: 0)"),
            quality: z
                .enum(["low", "medium", "high", "hd"])
                .optional()
                .describe('Image quality level. Only supported by gptimage models (default: "medium")'),
            image: z.string().optional().describe("Reference image URL(s) for editing. Separate multiple with | or ,"),
            transparent: z.boolean().optional().describe("Transparent background. Only supported by gptimage models (default: false)")
        }),
        func: async (input) => {
            try {
                const filePath = await provider.invoke(input);
                return filePath;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return `Error generating image: ${message}`;
            }
        }
    });
}
