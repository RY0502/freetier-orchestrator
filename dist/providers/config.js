export const DEFAULT_TEXT_MODELS = {
    groq: "llama-3.3-70b-versatile",
    huggingface: "meta-llama/Llama-3.3-70B-Instruct",
    nvidia: "meta/llama-3.3-70b-instruct",
    requesty: "nvidia/nemotron-3-super-120b-a12b",
    sambanova: "Meta-Llama-3.3-70B-Instruct",
    cloudflare: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    cerebras: "zai-glm-4.7"
};
export const DEFAULT_VISION_MODELS = {
    groq: "qwen/qwen3.6-27b",
    huggingface: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    nvidia: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    requesty: "nvidia/nemotron-3-super-120b-a12b",
    sambanova: "gemma-4-31B-it",
    cloudflare: "@cf/meta/llama-4-scout-17b-16e-instruct",
    cerebras: "gemma-4-31b"
};
export const DEFAULT_MAX_TOKENS = 2048;
export const DEFAULT_REQUEST_TIMEOUT_MS = 300_000;
function loadEnvKeys(baseName) {
    const values = [];
    const baseValue = process.env[baseName];
    if (baseValue) {
        values.push(baseValue);
    }
    for (let index = 1;; index += 1) {
        const value = process.env[`${baseName}_${index}`];
        if (!value)
            break;
        values.push(value);
    }
    return values;
}
export function loadConfigFromEnv() {
    const config = {
        maxTokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS, 10) : DEFAULT_MAX_TOKENS,
        requestTimeoutMs: process.env.REQUEST_TIMEOUT_MS ? parseInt(process.env.REQUEST_TIMEOUT_MS, 10) : DEFAULT_REQUEST_TIMEOUT_MS
    };
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
        config.groq = {
            apiKey: groqKey,
            textModel: process.env.GROQ_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.groq,
            visionModel: process.env.GROQ_VISION_MODEL ?? DEFAULT_VISION_MODELS.groq
        };
    }
    const hfKey = process.env.HUGGINGFACE_API_KEY;
    if (hfKey) {
        config.huggingface = {
            apiKey: hfKey,
            textModel: process.env.HUGGINGFACE_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.huggingface,
            visionModel: process.env.HUGGINGFACE_VISION_MODEL ?? DEFAULT_VISION_MODELS.huggingface
        };
    }
    const nvidiaKeys = loadEnvKeys("NVIDIA_API_KEY");
    if (nvidiaKeys.length > 0) {
        config.nvidia = {
            apiKeys: nvidiaKeys,
            textModel: process.env.NVIDIA_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.nvidia,
            visionModel: process.env.NVIDIA_VISION_MODEL ?? DEFAULT_VISION_MODELS.nvidia,
            baseUrl: process.env.NVIDIA_API_URL
        };
    }
    const requestyKey = process.env.REQUESTY_API_KEY;
    if (requestyKey) {
        config.requesty = {
            apiKey: requestyKey,
            textModel: process.env.REQUESTY_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.requesty,
            visionModel: process.env.REQUESTY_VISION_MODEL ?? DEFAULT_VISION_MODELS.requesty,
            baseUrl: process.env.REQUESTY_API_URL
        };
    }
    const sambanovaKey = process.env.SAMBANOVA_API_KEY;
    if (sambanovaKey) {
        config.sambanova = {
            apiKey: sambanovaKey,
            textModel: process.env.SAMBANOVA_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.sambanova,
            visionModel: process.env.SAMBANOVA_VISION_MODEL ?? DEFAULT_VISION_MODELS.sambanova,
            baseUrl: process.env.SAMBANOVA_API_URL
        };
    }
    const cloudflareTokens = loadEnvKeys("CLOUDFLARE_API_TOKEN");
    const cloudflareAccountIds = loadEnvKeys("CLOUDFLARE_ACCOUNT_ID");
    if (cloudflareTokens.length > 0 && cloudflareAccountIds.length > 0) {
        config.cloudflare = {
            apiTokens: cloudflareTokens,
            accountIds: cloudflareAccountIds,
            textModel: process.env.CLOUDFLARE_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.cloudflare,
            visionModel: process.env.CLOUDFLARE_VISION_MODEL ?? DEFAULT_VISION_MODELS.cloudflare
        };
    }
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
        config.cerebras = {
            apiKey: cerebrasKey,
            textModel: process.env.CEREBRAS_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.cerebras,
            visionModel: process.env.CEREBRAS_VISION_MODEL ?? DEFAULT_VISION_MODELS.cerebras,
            baseUrl: process.env.CEREBRAS_API_URL
        };
    }
    return config;
}
