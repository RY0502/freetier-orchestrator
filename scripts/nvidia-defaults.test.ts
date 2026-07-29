import assert from "node:assert/strict";
import { DEFAULT_VISION_MODELS } from "../src/providers/config.js";

const expected = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
assert.equal(DEFAULT_VISION_MODELS.nvidia, expected, "Expected NVIDIA default vision model to match the requested value");

console.log("✅ NVIDIA default vision model test PASSED");
