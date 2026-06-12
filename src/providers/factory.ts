import type { Provider } from "../types.js";
import { CerebrasProvider } from "./cerebras-provider.js";
import { CloudflareProvider } from "./cloudflare-provider.js";
import { loadConfigFromEnv } from "./config.js";
import { GroqProvider } from "./groq-provider.js";
import { HuggingFaceProvider } from "./huggingface-provider.js";
import { NvidiaProvider } from "./nvidia-provider.js";
import { SambaNovaProvider } from "./sambanova-provider.js";
import type { LlmInput } from "./types.js";

export function createProviders(): Provider<LlmInput, string>[] {
  const config = loadConfigFromEnv();
  const providers: Provider<LlmInput, string>[] = [];
  const maxTokens = config.maxTokens;

  if (config.groq) {
    providers.push(new GroqProvider(config.groq.apiKey, config.groq.textModel, config.groq.visionModel, maxTokens));
  }

  if (config.cloudflare) {
    providers.push(
      new CloudflareProvider(config.cloudflare.apiToken, config.cloudflare.accountId, config.cloudflare.textModel, config.cloudflare.visionModel)
    );
  }

  if (config.nvidia) {
    providers.push(
      new NvidiaProvider(config.nvidia.apiKey, config.nvidia.textModel, config.nvidia.visionModel, maxTokens, config.nvidia.baseUrl)
    );
  }

  if (config.sambanova) {
    providers.push(
      new SambaNovaProvider(
        config.sambanova.apiKey,
        config.sambanova.textModel,
        config.sambanova.visionModel,
        maxTokens,
        config.sambanova.baseUrl
      )
    );
  }

  if (config.huggingface) {
    providers.push(
      new HuggingFaceProvider(config.huggingface.apiKey, config.huggingface.textModel, config.huggingface.visionModel, maxTokens)
    );
  }

  if (config.cerebras) {
    providers.push(
      new CerebrasProvider(config.cerebras.apiKey, config.cerebras.textModel, config.cerebras.visionModel, maxTokens, config.cerebras.baseUrl)
    );
  }

  if (providers.length === 0) {
    throw new Error(
      "No LLM providers configured. Set at least one of: GROQ_API_KEY, HUGGINGFACE_API_KEY, NVIDIA_API_KEY, SAMBANOVA_API_KEY, CEREBRAS_API_KEY, or CLOUDFLARE_API_TOKEN+CLOUDFLARE_ACCOUNT_ID"
    );
  }

  return providers;
}
