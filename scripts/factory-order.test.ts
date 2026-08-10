import assert from "node:assert/strict";
import { createProviders, createTextProviders, createVisionProviders } from "../src/index.js";

// Mock env variables so all providers are enabled and multiple keys are available
process.env.CLOUDFLARE_API_TOKEN = "cf-main";
process.env.CLOUDFLARE_API_TOKEN_1 = "cf-1";
process.env.CLOUDFLARE_ACCOUNT_ID = "cf-account";
process.env.CLOUDFLARE_ACCOUNT_ID_1 = "cf-account";
process.env.GROQ_API_KEY = "dummy";
process.env.NVIDIA_API_KEY = "nv-main";
process.env.NVIDIA_API_KEY_1 = "nv-1";
process.env.CEREBRAS_API_KEY = "dummy";
process.env.HUGGINGFACE_API_KEY = "dummy";
process.env.SAMBANOVA_API_KEY = "dummy";

const textProviders = createTextProviders();
const textNames = textProviders.map((p) => p.name);
assert.deepEqual(textNames, [
  "Cloudflare",
  "Cloudflare #2",
  "Groq",
  "NVIDIA",
  "NVIDIA #2",
  "Cerebras",
  "HuggingFace",
  "SambaNova"
]);

const visionProviders = createVisionProviders();
const visionNames = visionProviders.map((p) => p.name);
assert.deepEqual(visionNames, [
  "Cloudflare",
  "Cloudflare #2",
  "NVIDIA",
  "NVIDIA #2",
  "Cerebras",
  "Groq",
  "HuggingFace",
  "SambaNova"
]);

// Default createProviders() without args should default to text order
const defaultProviders = createProviders();
assert.deepEqual(defaultProviders.map((p) => p.name), textNames);

console.log("factory ordering test passed!");
