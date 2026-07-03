/**
 * Detect MIME type from the leading characters of a base64-encoded image.
 * Falls back to "image/jpeg" if the magic bytes don't match a known format.
 */
export declare function detectMimeType(base64: string): string;
/**
 * Build a `data:` URL from a base64-encoded image.
 * Uses the explicit MIME type if provided, otherwise auto-detects from magic bytes.
 */
export declare function buildImageDataUrl(base64: string, mimeType?: string): string;
//# sourceMappingURL=image-utils.d.ts.map