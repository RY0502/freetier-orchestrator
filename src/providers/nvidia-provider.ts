import { OpenAICompatibleProvider } from "./openai-compatible.js";

export class NvidiaProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, textModel: string, visionModel: string, maxTokens: number, baseUrl?: string) {
    super(
      "NVIDIA",
      apiKey,
      textModel,
      visionModel,
      maxTokens,
      baseUrl || "https://integrate.api.nvidia.com/v1/chat/completions"
    );
  }
}
