import { OpenAICompatibleProvider } from "./openai-compatible.js";
export class GroqProvider extends OpenAICompatibleProvider {
    constructor(apiKey, textModel, visionModel, maxTokens, requestTimeoutMs) {
        super("Groq", apiKey, textModel, visionModel, maxTokens, "https://api.groq.com/openai/v1/chat/completions", requestTimeoutMs);
    }
}
