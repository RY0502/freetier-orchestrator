import type { Provider } from "../types.js";
import type { LlmInput } from "./types.js";

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
    private readonly apiUrl: string
  ) {}

  async invoke(input: LlmInput): Promise<string> {
    const hasImage = Boolean(input.imageBase64);
    const model = hasImage ? this.visionModel : this.textModel;

    const userContent = hasImage
      ? [
          { type: "text", text: input.prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.imageBase64}` } }
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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.name} API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;

    if (data.error) {
      const message = typeof data.error === "string" ? data.error : data.error.message ?? "Unknown error";
      throw new Error(`${this.name} API error: ${message}`);
    }

    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }
}
