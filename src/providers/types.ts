export interface LlmInput {
  system: string;
  prompt: string;
  imageBase64?: string;
  /** MIME type of the image (e.g. "image/png"). Auto-detected from base64 if omitted. */
  mimeType?: string;
}

export type LlmOutput = string;

export interface ImageGenInput {
  /** The text prompt describing the image to generate. */
  prompt: string;
  /** The model name to use (e.g. "flux", "zimage", "gptimage", "kontext", etc.). */
  model: string;
  /** Absolute or relative file path where the generated image will be saved. */
  outputPath: string;

  // ── Optional Pollinations query parameters ──────────────────────────

  /** Width in pixels (default: 1024). */
  width?: number;
  /** Height in pixels (default: 1024). */
  height?: number;
  /** Seed for reproducible results. Use -1 for random (default: 0). */
  seed?: number;
  /**
   * Safety features: comma-separated list of privacy, secrets, sexual, violence, shield, true, nsfw.
   * `true` enables privacy,secrets; `nsfw` enables sexual,violence. Defaults to off.
   */
  safe?: string | boolean;
  /** Image quality level. Only supported by `gptimage` and `gptimage-large`. */
  quality?: "low" | "medium" | "high" | "hd";
  /**
   * Reference image URL(s) for image editing or video generation.
   * Separate multiple URLs with `|` or `,`.
   */
  image?: string;
  /** Generate image with transparent background. Only supported by `gptimage` and `gptimage-large`. */
  transparent?: boolean;
  /** Video duration in seconds (1–120). Only applies to video models. */
  duration?: number;
  /** Video aspect ratio (e.g. "16:9" or "9:16"). Only applies to video models. */
  aspectRatio?: string;
  /** Generate audio for the video. Only applies to video models. */
  audio?: boolean;
}


