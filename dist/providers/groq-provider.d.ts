import type { Provider } from "../types.js";
import type { LlmInput } from "./types.js";
export declare class GroqProvider implements Provider<LlmInput, string> {
    private readonly apiKey;
    private readonly textModel;
    private readonly visionModel;
    private readonly maxTokens;
    readonly name = "Groq";
    constructor(apiKey: string, textModel: string, visionModel: string, maxTokens: number);
    invoke(input: LlmInput): Promise<string>;
}
//# sourceMappingURL=groq-provider.d.ts.map