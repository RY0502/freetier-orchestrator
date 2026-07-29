import assert from "node:assert/strict";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { RequestyProvider } from "../src/providers/requesty-provider.js";

const envPath = resolve(fileURLToPath(new URL("../src/.env", import.meta.url)));
config({ path: envPath });

async function main(): Promise<void> {
  const apiKey = process.env.REQUESTY_API_KEY;

  if (!apiKey) {
    console.log("⚠️  Skipping Requesty provider test: REQUESTY_API_KEY not set in environment.");
    return;
  }

  console.log("─── Requesty Provider Test ───");
  const provider = new RequestyProvider(apiKey, "nvidia/nemotron-3-super-120b-a12b", "nvidia/nemotron-3-super-120b-a12b", 256);

  const result = await provider.invoke({
    system: "You are a helpful assistant.",
    prompt: "Reply with a short greeting in exactly one sentence."
  });

  assert.equal(typeof result, "string", "Expected a string response from the provider");
  assert(result.trim().length > 0, "Expected a non-empty response from the provider");

  console.log(`Response: ${result}`);
  console.log("✅ Requesty provider test PASSED");
}

main().catch((error) => {
  console.error("❌ Requesty provider test FAILED:", error);
  process.exitCode = 1;
});
