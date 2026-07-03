import { OpenAICompatibleProvider } from "./openai-compatible.js";

export class GroqProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, textModel: string, visionModel: string, maxTokens: number, requestTimeoutMs?: number) {
    super("Groq", apiKey, textModel, visionModel, maxTokens, "https://api.groq.com/openai/v1/chat/completions", requestTimeoutMs);
  }
}
