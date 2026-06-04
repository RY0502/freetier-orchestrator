import { OpenAICompatibleProvider } from "./openai-compatible.js";
export class HuggingFaceProvider extends OpenAICompatibleProvider {
    constructor(apiKey, textModel, visionModel, maxTokens) {
        super("HuggingFace", apiKey, textModel, visionModel, maxTokens, "https://api-inference.huggingface.co/v1/chat/completions");
    }
}
