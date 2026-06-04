import type { Provider } from "../types.js";
import type { LlmInput } from "./types.js";
export declare class OpenAICompatibleProvider implements Provider<LlmInput, string> {
    readonly name: string;
    private readonly apiKey;
    private readonly textModel;
    private readonly visionModel;
    private readonly maxTokens;
    private readonly apiUrl;
    constructor(name: string, apiKey: string, textModel: string, visionModel: string, maxTokens: number, apiUrl: string);
    invoke(input: LlmInput): Promise<string>;
}
//# sourceMappingURL=openai-compatible.d.ts.map