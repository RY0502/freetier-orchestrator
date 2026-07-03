import { HttpError } from "../errors.js";
import type { Provider } from "../types.js";
import { buildImageDataUrl } from "./image-utils.js";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "./openai-compatible.js";
import type { LlmInput } from "./types.js";

interface CloudflareResponse {
  result?: {
    response?: string;
  };
  success?: boolean;
  errors?: Array<{ message: string }>;
}

export class CloudflareProvider implements Provider<LlmInput, string> {
  readonly name = "Cloudflare";

  constructor(
    private readonly apiToken: string,
    private readonly accountId: string,
    private readonly textModel: string,
    private readonly visionModel: string,
    private readonly requestTimeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
  ) {}

  async invoke(input: LlmInput): Promise<string> {
    const hasImage = Boolean(input.imageBase64);
    const model = hasImage ? this.visionModel : this.textModel;

    const userContent = hasImage
      ? [
          { type: "text", text: input.prompt },
          { type: "image_url", image_url: { url: buildImageDataUrl(input.imageBase64!, input.mimeType) } }
        ]
      : input.prompt;

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${model}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: userContent }
        ]
      }),
      signal: AbortSignal.timeout(this.requestTimeoutMs)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpError(response.status, `${this.name} API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as CloudflareResponse;

    if (!data.success || data.errors?.length) {
      const errorMsg = data.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
      throw new Error(`${this.name} API error: ${errorMsg}`);
    }

    const content = data.result?.response?.trim();

    if (!content) {
      throw new Error(
        `${this.name} returned an empty response (model: ${model}). The response may have been filtered or the model produced no output.`
      );
    }

    return content;
  }
}
