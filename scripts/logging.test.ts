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

class StubProvider implements Provider<string, string> {
  readonly name = "StubProvider";

  async invoke(): Promise<string> {
    return "ok";
  }

  getModelConfig() {
    return { textModel: "text-model-123", visionModel: "vision-model-456" };
  }
}

const logger = new TestLogger();
new FreeTierOrchestrator([new StubProvider()], { logger });

assert(
  logger.messages.some(
    (message) => message.includes("text-model-123") && message.includes("vision-model-456")
  ),
  `Expected init log to include model details, got: ${logger.messages.join(" | ")}`
);

console.log("logging test passed");
