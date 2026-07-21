import { HttpError } from "../errors.js";
import { buildImageDataUrl } from "./image-utils.js";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "./openai-compatible.js";
export class CloudflareProvider {
    apiToken;
    accountId;
    textModel;
    visionModel;
    requestTimeoutMs;
    name = "Cloudflare";
    constructor(apiToken, accountId, textModel, visionModel, requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
        this.apiToken = apiToken;
        this.accountId = accountId;
        this.textModel = textModel;
        this.visionModel = visionModel;
        this.requestTimeoutMs = requestTimeoutMs;
    }
    getModelConfig() {
        return { textModel: this.textModel, visionModel: this.visionModel };
    }
    async invoke(input) {
        const hasImage = Boolean(input.imageBase64);
        const model = hasImage ? this.visionModel : this.textModel;
        const userContent = hasImage
            ? [
                { type: "text", text: input.prompt },
                { type: "image_url", image_url: { url: buildImageDataUrl(input.imageBase64, input.mimeType) } }
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
        const data = (await response.json());
        if (!data.success || data.errors?.length) {
            const errorMsg = data.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
            throw new Error(`${this.name} API error: ${errorMsg}`);
        }
        const rawResponse = data.result?.response;
        const content = typeof rawResponse === "string"
            ? rawResponse.trim()
            : rawResponse != null
                ? JSON.stringify(rawResponse).trim()
                : undefined;
        if (!content) {
            throw new Error(`${this.name} returned an empty response (model: ${model}). The response may have been filtered or the model produced no output.`);
        }
        return content;
    }
}
