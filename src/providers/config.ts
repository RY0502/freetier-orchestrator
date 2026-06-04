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
  maxTokens: number;
}

export const DEFAULT_TEXT_MODELS = {
  groq: "llama-3.3-70b-versatile",
  huggingface: "meta-llama/Llama-3.3-70B-Instruct",
  nvidia: "meta/llama-3.3-70b-instruct",
  sambanova: "Meta-Llama-3.3-70B-Instruct",
  cloudflare: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
};

export const DEFAULT_VISION_MODELS = {
  groq: "meta-llama/llama-4-scout-17b-16e-instruct",
  huggingface: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
  nvidia: "meta/llama-4-maverick-17b-128e-instruct",
  sambanova: "Llama-4-Maverick-17B-128E-Instruct",
  cloudflare: "@cf/meta/llama-4-scout-17b-16e-instruct"
};

export const DEFAULT_MAX_TOKENS = 2048;

export function loadConfigFromEnv(): ProviderConfig {
  const config: ProviderConfig = {
    maxTokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS, 10) : DEFAULT_MAX_TOKENS
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

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    config.nvidia = {
      apiKey: nvidiaKey,
      textModel: process.env.NVIDIA_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.nvidia,
      visionModel: process.env.NVIDIA_VISION_MODEL ?? DEFAULT_VISION_MODELS.nvidia,
      baseUrl: process.env.NVIDIA_API_URL
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

  const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
  const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (cloudflareToken && cloudflareAccountId) {
    config.cloudflare = {
      apiToken: cloudflareToken,
      accountId: cloudflareAccountId,
      textModel: process.env.CLOUDFLARE_TEXT_MODEL ?? DEFAULT_TEXT_MODELS.cloudflare,
      visionModel: process.env.CLOUDFLARE_VISION_MODEL ?? DEFAULT_VISION_MODELS.cloudflare
    };
  }

  return config;
}
