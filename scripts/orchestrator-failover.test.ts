import assert from "node:assert/strict";
import { FreeTierOrchestrator } from "../src/orchestrator.js";
import type { Logger, Provider } from "../src/types.js";

class TestLogger implements Logger {
  readonly messages: string[] = [];

  info(message: string): void {
    this.messages.push(message);
  }

  warn(message: string): void {
    this.messages.push(message);
  }

  error(message: string): void {
    this.messages.push(message);
  }
}

class EmptyResponseProvider implements Provider<string, string> {
  constructor(readonly name: string, private readonly message: string) {}

  async invoke(): Promise<string> {
    throw new Error(this.message);
  }

  getModelConfig() {
    return { textModel: "empty-model", visionModel: "empty-vision" };
  }
}

class SuccessProvider implements Provider<string, string> {
  readonly name = "SuccessProvider";

  async invoke(): Promise<string> {
    return "ok";
  }

  getModelConfig() {
    return { textModel: "success-model", visionModel: "success-vision" };
  }
}

async function main() {
  const logger = new TestLogger();
  const orchestrator = new FreeTierOrchestrator(
    [
      new EmptyResponseProvider(
        "Cloudflare",
        "Cloudflare returned an empty response (model: @cf/meta/llama-4-scout-17b-16e-instruct). The response may have been filtered or the model produced no output."
      ),
      new SuccessProvider()
    ],
    { logger }
  );

  const result = await orchestrator.invoke("hello");

  assert.equal(result, "ok");
  assert(
    logger.messages.some((message) => message.includes('Switching from "Cloudflare" to "SuccessProvider"')),
    `Expected failover log, got: ${logger.messages.join(" | ")}`
  );

  console.log("orchestrator failover test passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
