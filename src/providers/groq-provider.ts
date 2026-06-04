import type { Provider } from "../types.js";
import type { LlmInput } from "./types.js";

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export class GroqProvider implements Provider<LlmInput, string> {
  readonly name = "Groq";

  constructor(
    private readonly apiKey: string,
    private readonly textModel: string,
    private readonly visionModel: string,
    private readonly maxTokens: number
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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: this.maxTokens,
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

    const data = (await response.json()) as GroqResponse;

    if (data.error) {
      throw new Error(`${this.name} API error: ${data.error.message ?? "Unknown error"}`);
    }

    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }
}
