import { OpenAICompatibleProvider } from "./openai-compatible.js";

export class RequestyProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, textModel: string, visionModel: string, maxTokens: number, baseUrl?: string, requestTimeoutMs?: number) {
    super(
      "Requesty",
      apiKey,
      textModel,
      visionModel,
      maxTokens,
      baseUrl || "https://router.requesty.ai/v1/chat/completions",
      requestTimeoutMs
    );
  }
}
