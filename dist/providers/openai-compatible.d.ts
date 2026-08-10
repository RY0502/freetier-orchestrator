import type { Provider } from "../types.js";
import type { LlmInput } from "./types.js";
/** Default request timeout for fetch calls (60 seconds). */
export declare const DEFAULT_REQUEST_TIMEOUT_MS = 60000;
export declare class OpenAICompatibleProvider implements Provider<LlmInput, string> {
    readonly name: string;
    protected readonly apiKey: string;
    private readonly textModel;
    private readonly visionModel;
    private readonly maxTokens;
    private readonly apiUrl;
    private readonly requestTimeoutMs;
    constructor(name: string, apiKey: string, textModel: string, visionModel: string, maxTokens: number, apiUrl: string, requestTimeoutMs?: number);
    getModelConfig(): {
        textModel: string;
        visionModel: string;
    };
    protected sendRequest(apiKey: string, input: LlmInput): Promise<string>;
    invoke(input: LlmInput): Promise<string>;
}
//# sourceMappingURL=openai-compatible.d.ts.map