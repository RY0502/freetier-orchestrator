import { HttpError } from "../errors.js";
import type { Provider } from "../types.js";
import { buildImageDataUrl } from "./image-utils.js";
import type { LlmInput } from "./types.js";

/** Default request timeout for fetch calls (60 seconds). */
export const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string } | string;
}

export class OpenAICompatibleProvider implements Provider<LlmInput, string> {
  constructor(
    readonly name: string,
    private readonly apiKey: string,
    private readonly textModel: string,
    private readonly visionModel: string,
    private readonly maxTokens: number,
    private readonly apiUrl: string,
    private readonly requestTimeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
  ) {}

  getModelConfig() {
    return { textModel: this.textModel, visionModel: this.visionModel };
  }

  async invoke(input: LlmInput): Promise<string> {
    const hasImage = Boolean(input.imageBase64);
    const model = hasImage ? this.visionModel : this.textModel;

    const userContent = hasImage
      ? [
          { type: "text", text: input.prompt },
          { type: "image_url", image_url: { url: buildImageDataUrl(input.imageBase64!, input.mimeType) } }
        ]
      : input.prompt;

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: this.maxTokens,
        stream: false,
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

    const data = (await response.json()) as ChatCompletionResponse;

    if (data.error) {
      const message = typeof data.error === "string" ? data.error : data.error.message ?? "Unknown error";
      throw new Error(`${this.name} API error: ${message}`);
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error(
        `${this.name} returned an empty response (model: ${model}). The response may have been filtered or the model produced no output.`
      );
    }

    return content;
  }
}
