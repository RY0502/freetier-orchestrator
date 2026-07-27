/**
 * Integration test for the image generation tool (Pollinations API).
 *
 * This test calls the real Pollinations API to generate a small image,
 * verifies the output file was created and has content, then cleans up.
 *
 * Run:  npx tsx scripts/image-gen.test.ts
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createImageGenTool } from "../src/tools/image-gen.tool.js";

const OUTPUT_DIR = resolve("scripts/.test-output");
const OUTPUT_FILE = join(OUTPUT_DIR, "test-image.png");

async function cleanup(): Promise<void> {
  try {
    await rm(OUTPUT_DIR, { recursive: true, force: true });
  } catch {
    // ignore if already gone
  }
}

async function runTest(): Promise<void> {
  // ── Cleanup any leftover from a previous run ──
  await cleanup();

  console.log("─── Image Generation Tool Test ───");
  console.log(`Output path: ${OUTPUT_FILE}`);

  const tool = createImageGenTool();

  // ── Verify tool metadata ──
  assert.equal(tool.name, "generate_image", "Tool name should be 'generate_image'");
  assert(tool.description.length > 0, "Tool should have a description");
  console.log("✓ Tool metadata OK");

  // ── Invoke the tool with a small image ──
  console.log("Generating image (this may take a minute)...");
  const result = await tool.invoke({
    prompt: "a small red circle on white background",
    model: "flux",
    outputPath: OUTPUT_FILE,
    width: 256,
    height: 256
  });

  console.log(`Result: ${result}`);

  // ── Verify the result is the output path (not an error string) ──
  assert(
    !String(result).startsWith("Error"),
    `Expected a file path, got an error: ${result}`
  );

  // ── Verify the file exists and has content ──
  assert(existsSync(OUTPUT_FILE), `Output file should exist at ${OUTPUT_FILE}`);
  const fileInfo = await stat(OUTPUT_FILE);
  assert(fileInfo.size > 0, `Output file should not be empty, got ${fileInfo.size} bytes`);
  console.log(`✓ Image file created: ${fileInfo.size} bytes`);

  // ── Cleanup ──
  await cleanup();
  assert(!existsSync(OUTPUT_FILE), "Output file should be cleaned up");
  console.log("✓ Cleanup complete");

  console.log("\n✅ Image generation tool test PASSED\n");
}

runTest().catch((err) => {
  console.error("❌ Image generation tool test FAILED:", err);
  cleanup().finally(() => process.exit(1));
});
