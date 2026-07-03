import { OpenAICompatibleProvider } from "./openai-compatible.js";
export class CerebrasProvider extends OpenAICompatibleProvider {
    constructor(apiKey, textModel, visionModel, maxTokens, baseUrl, requestTimeoutMs) {
        super("Cerebras", apiKey, textModel, visionModel, maxTokens, baseUrl || "https://api.cerebras.ai/v1/chat/completions", requestTimeoutMs);
    }
}
