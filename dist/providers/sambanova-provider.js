import { OpenAICompatibleProvider } from "./openai-compatible.js";
export class SambaNovaProvider extends OpenAICompatibleProvider {
    constructor(apiKey, textModel, visionModel, maxTokens, baseUrl, requestTimeoutMs) {
        super("SambaNova", apiKey, textModel, visionModel, maxTokens, baseUrl || "https://api.sambanova.ai/v1/chat/completions", requestTimeoutMs);
    }
}
