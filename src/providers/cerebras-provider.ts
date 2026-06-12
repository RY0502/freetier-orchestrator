import { OpenAICompatibleProvider } from "./openai-compatible.js";

export class CerebrasProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, textModel: string, visionModel: string, maxTokens: number, baseUrl?: string) {
    super(
      "Cerebras",
      apiKey,
      textModel,
      visionModel,
      maxTokens,
      baseUrl || "https://api.cerebras.ai/v1/chat/completions"
    );
  }
}
