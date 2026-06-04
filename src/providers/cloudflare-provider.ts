import type { Provider } from "../types.js";
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
    private readonly visionModel: string
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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.name} API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as CloudflareResponse;

    if (!data.success || data.errors?.length) {
      const errorMsg = data.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
      throw new Error(`${this.name} API error: ${errorMsg}`);
    }

    return data.result?.response?.trim() ?? "";
  }
}
