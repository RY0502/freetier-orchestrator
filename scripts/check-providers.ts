#!/usr/bin/env node
/*
  Check each configured provider by sending a tiny dummy PNG image and
  logging whether the provider returned a response or failed.

  Usage:
    - Set your provider keys in the environment or load via a .env file.
    - Run: `npx tsx scripts/check-providers.ts`

  The script attempts to dynamically import `dotenv/config` if it is available,
  so you can optionally install `dotenv` and keep a `.env` file in the repo.
*/

import { createProviders } from "../src/providers/factory.js";
import type { LlmInput } from "../src/providers/types.js";

// Try to load .env automatically if `dotenv` is installed in the environment.
try {
  // top-level await is supported in Node >= 14 ESM; use dynamic import
  // to avoid hard dependency on `dotenv` in this package.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("dotenv/config");
  // If successful, .env keys are now visible on process.env
} catch {
  // ignore if dotenv is not installed; user may set env vars externally
}

async function main() {
  const providers = createProviders();

  const dummyBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="; // 1x1 PNG

  const input: LlmInput = {
    system: "You are a helpful assistant for testing provider connectivity.",
    prompt: "Please describe the attached image in one sentence and confirm receipt.",
    imageBase64: dummyBase64,
    mimeType: "image/png"
  };

  console.log(`Checking ${providers.length} provider(s): ${providers.map((p) => p.name).join(", ")}`);

  for (const provider of providers) {
    process.stdout.write(`[${provider.name}] `);
    try {
      const out = await provider.invoke(input as any);
      const text = typeof out === "string" ? out.replace(/\s+/g, " ").trim() : JSON.stringify(out);
      console.log("SUCCESS:", text.slice(0, 300));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("FAIL:", message);
    }
  }
}

main().catch((e) => {
  // Top-level failure is unexpected — print and exit non-zero
  // eslint-disable-next-line no-console
  console.error("Error running provider checks:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
