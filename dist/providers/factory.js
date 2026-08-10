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
    const providers = [];
    function addCloudflareProviders() {
        if (!config.cloudflare?.apiTokens?.length)
            return;
        config.cloudflare.apiTokens.forEach((token, index) => {
            const accountId = config.cloudflare.accountIds[index] ?? config.cloudflare.accountIds[0];
            providers.push(new CloudflareProvider(token, accountId, config.cloudflare.textModel, config.cloudflare.visionModel, timeoutMs, index + 1));
        });
    }
    function addNvidiaProviders() {
        if (!config.nvidia?.apiKeys?.length)
            return;
        config.nvidia.apiKeys.forEach((apiKey, index) => {
            providers.push(new NvidiaProvider(apiKey, config.nvidia.textModel, config.nvidia.visionModel, maxTokens, config.nvidia.baseUrl, timeoutMs, index + 1));
        });
    }
    const textOrder = ["cloudflare", "groq", "nvidia", "cerebras", "huggingface", "sambanova"];
    const visionOrder = ["cloudflare", "nvidia", "cerebras", "groq", "huggingface", "sambanova"];
    const order = type === "vision" ? visionOrder : textOrder;
    for (const name of order) {
        switch (name) {
            case "cloudflare":
                addCloudflareProviders();
                break;
            case "nvidia":
                addNvidiaProviders();
                break;
            case "groq":
                if (config.groq) {
                    providers.push(new GroqProvider(config.groq.apiKey, config.groq.textModel, config.groq.visionModel, maxTokens, timeoutMs));
                }
                break;
            case "cerebras":
                if (config.cerebras) {
                    providers.push(new CerebrasProvider(config.cerebras.apiKey, config.cerebras.textModel, config.cerebras.visionModel, maxTokens, config.cerebras.baseUrl, timeoutMs));
                }
                break;
            case "huggingface":
                if (config.huggingface) {
                    providers.push(new HuggingFaceProvider(config.huggingface.apiKey, config.huggingface.textModel, config.huggingface.visionModel, maxTokens, timeoutMs));
                }
                break;
            case "sambanova":
                if (config.sambanova) {
                    providers.push(new SambaNovaProvider(config.sambanova.apiKey, config.sambanova.textModel, config.sambanova.visionModel, maxTokens, config.sambanova.baseUrl, timeoutMs));
                }
                break;
        }
    }
    if (providers.length === 0) {
        throw new Error("No LLM providers configured. Set at least one of: GROQ_API_KEY, HUGGINGFACE_API_KEY, NVIDIA_API_KEY, REQUESTY_API_KEY, SAMBANOVA_API_KEY, CEREBRAS_API_KEY, or CLOUDFLARE_API_TOKEN+CLOUDFLARE_ACCOUNT_ID");
    }
    return providers;
}
export function createTextProviders() {
    return createProviders("text");
}
export function createVisionProviders() {
    return createProviders("vision");
}
