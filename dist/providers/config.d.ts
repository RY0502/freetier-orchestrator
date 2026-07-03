export interface ProviderConfig {
    groq?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
    };
    huggingface?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
    };
    nvidia?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
        baseUrl?: string;
    };
    sambanova?: {
        apiKey: string;
        textModel: string;
        visionModel: string;
        baseUrl?: string;
    };
    cloudflare?: {
        apiToken: string;
        accountId: string;
        textModel: string;
        visionModel: string;
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
    sambanova: string;
    cloudflare: string;
    cerebras: string;
};
export declare const DEFAULT_VISION_MODELS: {
    groq: string;
    huggingface: string;
    nvidia: string;
    sambanova: string;
    cloudflare: string;
    cerebras: string;
};
export declare const DEFAULT_MAX_TOKENS = 2048;
export declare const DEFAULT_REQUEST_TIMEOUT_MS = 300000;
export declare function loadConfigFromEnv(): ProviderConfig;
//# sourceMappingURL=config.d.ts.map