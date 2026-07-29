import type { Provider } from "../types.js";
import type { LlmInput } from "./types.js";
export declare function createProviders(type?: "text" | "vision"): Provider<LlmInput, string>[];
export declare function createTextProviders(): Provider<LlmInput, string>[];
export declare function createVisionProviders(): Provider<LlmInput, string>[];
//# sourceMappingURL=factory.d.ts.map