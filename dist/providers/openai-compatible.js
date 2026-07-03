import { HttpError } from "../errors.js";
import { buildImageDataUrl } from "./image-utils.js";
/** Default request timeout for fetch calls (60 seconds). */
export const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;
export class OpenAICompatibleProvider {
    name;
    apiKey;
    textModel;
    visionModel;
    maxTokens;
    apiUrl;
    requestTimeoutMs;
    constructor(name, apiKey, textModel, visionModel, maxTokens, apiUrl, requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
        this.name = name;
        this.apiKey = apiKey;
        this.textModel = textModel;
        this.visionModel = visionModel;
        this.maxTokens = maxTokens;
        this.apiUrl = apiUrl;
        this.requestTimeoutMs = requestTimeoutMs;
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
        const data = (await response.json());
        if (data.error) {
            const message = typeof data.error === "string" ? data.error : data.error.message ?? "Unknown error";
            throw new Error(`${this.name} API error: ${message}`);
        }
        const content = data.choices?.[0]?.message?.content?.trim();
        if (!content) {
            throw new Error(`${this.name} returned an empty response (model: ${model}). The response may have been filtered or the model produced no output.`);
        }
        return content;
    }
}
