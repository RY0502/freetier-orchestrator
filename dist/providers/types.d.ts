export interface LlmInput {
    system: string;
    prompt: string;
    imageBase64?: string;
    /** MIME type of the image (e.g. "image/png"). Auto-detected from base64 if omitted. */
    mimeType?: string;
}
export type LlmOutput = string;
//# sourceMappingURL=types.d.ts.map