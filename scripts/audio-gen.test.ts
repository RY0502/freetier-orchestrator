/**
 * Integration test for the audio generation tool (Groq TTS API).
 *
 * Requires at least GROQ_API_KEY_1 in environment.
 * Calls the real Groq API to generate a short audio clip,
 * verifies the output file was created and has content, then cleans up.
 *
 * Run:  npx tsx scripts/audio-gen.test.ts
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { createAudioGenTool } from "../src/tools/audio-gen.tool.js";

// Load .env so GROQ_API_KEY_* are available
config();

const OUTPUT_DIR = resolve("scripts/.test-output");
const OUTPUT_FILE = join(OUTPUT_DIR, "test-audio.wav");

async function cleanup(): Promise<void> {
  try {
    await rm(OUTPUT_DIR, { recursive: true, force: true });
  } catch {
    // ignore if already gone
  }
}

async function runTest(): Promise<void> {
  // ── Pre-check: at least one Groq API key must be set ──
  if (!process.env.GROQ_API_KEY_1) {
    console.log("⚠️  Skipping audio generation test: GROQ_API_KEY_1 not set in environment.");
    console.log("   Set GROQ_API_KEY_1 (and optionally _2, _3, …) to run this test.");
    return;
  }

  // ── Cleanup any leftover from a previous run ──
  await cleanup();

  console.log("─── Audio Generation Tool Test ───");
  console.log(`Output path: ${OUTPUT_FILE}`);

  const tool = createAudioGenTool();

  // ── Verify tool metadata ──
  assert.equal(tool.name, "generate_audio", "Tool name should be 'generate_audio'");
  assert(tool.description.length > 0, "Tool should have a description");
  console.log("✓ Tool metadata OK");

  // ── Invoke the tool with a short text ──
  console.log("Generating audio (this may take a few seconds)...");
  const result = await tool.invoke({
    input: "Hello, this is a test of the audio generation tool.",
    outputPath: OUTPUT_FILE
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
  console.log(`✓ Audio file created: ${fileInfo.size} bytes`);

  // ── Cleanup ──
  await cleanup();
  assert(!existsSync(OUTPUT_FILE), "Output file should be cleaned up");
  console.log("✓ Cleanup complete");

  console.log("\n✅ Audio generation tool test PASSED\n");
}

runTest().catch((err) => {
  console.error("❌ Audio generation tool test FAILED:", err);
  cleanup().finally(() => process.exit(1));
});
