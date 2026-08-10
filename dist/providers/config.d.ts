export interface ProviderConfig {
    groq?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
    };
    requesty?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
        baseUrl?: string;
    };
    huggingface?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
    };
    nvidia?: {
        apiKeys: string[];
        textModel: string;
        visionModel: string;
        baseUrl?: string;
    };
    cloudflare?: {
        apiTokens: string[];
        accountIds: string[];
        textModel: string;
        visionModel: string;
    };
    sambanova?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
        baseUrl?: string;
    };
    cerebras?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
        baseUrl?: string;
    };
    maxTokens: number;
    requestTimeoutMs: number;
}
export declare const DEFAULT_TEXT_MODELS: {
    groq: string;
    huggingface: string;
    nvidia: string;
    requesty: string;
    sambanova: string;
    cloudflare: string;
    cerebras: string;
};
export declare const DEFAULT_VISION_MODELS: {
    groq: string;
    huggingface: string;
    nvidia: string;
    requesty: string;
    sambanova: string;
    cloudflare: string;
    cerebras: string;
};
export declare const DEFAULT_MAX_TOKENS = 2048;
export declare const DEFAULT_REQUEST_TIMEOUT_MS = 300000;
export declare function loadConfigFromEnv(): ProviderConfig;
//# sourceMappingURL=config.d.ts.map