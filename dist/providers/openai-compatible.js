export class OpenAICompatibleProvider {
    name;
    apiKey;
    textModel;
    visionModel;
    maxTokens;
    apiUrl;
    constructor(name, apiKey, textModel, visionModel, maxTokens, apiUrl) {
        this.name = name;
        this.apiKey = apiKey;
        this.textModel = textModel;
        this.visionModel = visionModel;
        this.maxTokens = maxTokens;
        this.apiUrl = apiUrl;
    }
    async invoke(input) {
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
        const data = (await response.json());
        if (data.error) {
            const message = typeof data.error === "string" ? data.error : data.error.message ?? "Unknown error";
            throw new Error(`${this.name} API error: ${message}`);
        }
        return data.choices?.[0]?.message?.content?.trim() ?? "";
    }
}
