import { OpenAICompatibleProvider } from "./openai-compatible.js";
export class NvidiaProvider extends OpenAICompatibleProvider {
    constructor(apiKey, textModel, visionModel, maxTokens, baseUrl) {
        super("NVIDIA", apiKey, textModel, visionModel, maxTokens, baseUrl || "https://integrate.api.nvidia.com/v1/chat/completions");
    }
}
