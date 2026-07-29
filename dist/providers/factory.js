import { CerebrasProvider } from "./cerebras-provider.js";
import { CloudflareProvider } from "./cloudflare-provider.js";
import { loadConfigFromEnv } from "./config.js";
import { GroqProvider } from "./groq-provider.js";
import { HuggingFaceProvider } from "./huggingface-provider.js";
import { NvidiaProvider } from "./nvidia-provider.js";
import { SambaNovaProvider } from "./sambanova-provider.js";
export function createProviders(type = "text") {
    const config = loadConfigFromEnv();
    const maxTokens = config.maxTokens;
    const timeoutMs = config.requestTimeoutMs;
    const providerMap = {
        cloudflare: () => config.cloudflare
            ? new CloudflareProvider(config.cloudflare.apiToken, config.cloudflare.accountId, config.cloudflare.textModel, config.cloudflare.visionModel, timeoutMs)
            : undefined,
        groq: () => config.groq
            ? new GroqProvider(config.groq.apiKey, config.groq.textModel, config.groq.visionModel, maxTokens, timeoutMs)
            : undefined,
        nvidia: () => config.nvidia
            ? new NvidiaProvider(config.nvidia.apiKey, config.nvidia.textModel, config.nvidia.visionModel, maxTokens, config.nvidia.baseUrl, timeoutMs)
            : undefined,
        cerebras: () => config.cerebras
            ? new CerebrasProvider(config.cerebras.apiKey, config.cerebras.textModel, config.cerebras.visionModel, maxTokens, config.cerebras.baseUrl, timeoutMs)
            : undefined,
        huggingface: () => config.huggingface
            ? new HuggingFaceProvider(config.huggingface.apiKey, config.huggingface.textModel, config.huggingface.visionModel, maxTokens, timeoutMs)
            : undefined,
        sambanova: () => config.sambanova
            ? new SambaNovaProvider(config.sambanova.apiKey, config.sambanova.textModel, config.sambanova.visionModel, maxTokens, config.sambanova.baseUrl, timeoutMs)
            : undefined
    };
    const textOrder = ["cloudflare", "groq", "nvidia", "cerebras", "huggingface", "sambanova"];
    const visionOrder = ["cloudflare", "nvidia", "cerebras", "groq", "huggingface", "sambanova"];
    const order = type === "vision" ? visionOrder : textOrder;
    const providers = [];
    for (const name of order) {
        const provider = providerMap[name]?.();
        if (provider) {
            providers.push(provider);
        }
    }
    if (providers.length === 0) {
        throw new Error("No LLM providers configured. Set at least one of: GROQ_API_KEY, HUGGINGFACE_API_KEY, NVIDIA_API_KEY, SAMBANOVA_API_KEY, CEREBRAS_API_KEY, or CLOUDFLARE_API_TOKEN+CLOUDFLARE_ACCOUNT_ID");
    }
    return providers;
}
export function createTextProviders() {
    return createProviders("text");
}
export function createVisionProviders() {
    return createProviders("vision");
}
