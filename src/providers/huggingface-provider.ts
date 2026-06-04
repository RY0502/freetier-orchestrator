import { OpenAICompatibleProvider } from "./openai-compatible.js";

export class HuggingFaceProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, textModel: string, visionModel: string, maxTokens: number) {
    super(
      "HuggingFace",
      apiKey,
      textModel,
      visionModel,
      maxTokens,
      "https://router.huggingface.co/v1/chat/completions"
    );
  }
}
