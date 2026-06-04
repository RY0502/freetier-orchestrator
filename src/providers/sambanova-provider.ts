import { OpenAICompatibleProvider } from "./openai-compatible.js";

export class SambaNovaProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, textModel: string, visionModel: string, maxTokens: number, baseUrl?: string) {
    super(
      "SambaNova",
      apiKey,
      textModel,
      visionModel,
      maxTokens,
      baseUrl || "https://api.sambanova.ai/v1/chat/completions"
    );
  }
}
