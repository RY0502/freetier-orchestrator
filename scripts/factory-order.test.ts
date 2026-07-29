import assert from "node:assert/strict";
import { createProviders, createTextProviders, createVisionProviders } from "../src/index.js";

// Mock env variables so all providers are enabled
process.env.CLOUDFLARE_API_TOKEN = "dummy";
process.env.CLOUDFLARE_ACCOUNT_ID = "dummy";
process.env.GROQ_API_KEY = "dummy";
process.env.NVIDIA_API_KEY = "dummy";
process.env.CEREBRAS_API_KEY = "dummy";
process.env.HUGGINGFACE_API_KEY = "dummy";
process.env.SAMBANOVA_API_KEY = "dummy";

const textProviders = createTextProviders();
const textNames = textProviders.map((p) => p.name);
assert.deepEqual(textNames, ["Cloudflare", "Groq", "NVIDIA", "Cerebras", "HuggingFace", "SambaNova"]);

const visionProviders = createVisionProviders();
const visionNames = visionProviders.map((p) => p.name);
assert.deepEqual(visionNames, ["Cloudflare", "NVIDIA", "Cerebras", "Groq", "HuggingFace", "SambaNova"]);

// Default createProviders() without args should default to text order
const defaultProviders = createProviders();
assert.deepEqual(defaultProviders.map((p) => p.name), textNames);

console.log("factory ordering test passed!");
