export interface LlmInput {
  system: string;
  prompt: string;
  imageBase64?: string;
}

export type LlmOutput = string;
