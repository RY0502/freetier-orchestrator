import { OpenAICompatibleProvider } from "./openai-compatible.js";
export class HuggingFaceProvider extends OpenAICompatibleProvider {
    constructor(apiKey, textModel, visionModel, maxTokens, requestTimeoutMs) {
        super("HuggingFace", apiKey, textModel, visionModel, maxTokens, "https://router.huggingface.co/v1/chat/completions", requestTimeoutMs);
    }
}
