/**
 * Detect MIME type from the leading characters of a base64-encoded image.
 * Falls back to "image/jpeg" if the magic bytes don't match a known format.
 */
export function detectMimeType(base64) {
    if (base64.startsWith("/9j/"))
        return "image/jpeg";
    if (base64.startsWith("iVBOR"))
        return "image/png";
    if (base64.startsWith("R0lGOD"))
        return "image/gif";
    if (base64.startsWith("UklGR"))
        return "image/webp";
    return "image/jpeg";
}
/**
 * Build a `data:` URL from a base64-encoded image.
 * Uses the explicit MIME type if provided, otherwise auto-detects from magic bytes.
 */
export function buildImageDataUrl(base64, mimeType) {
    const mime = mimeType ?? detectMimeType(base64);
    return `data:${mime};base64,${base64}`;
}
