import { ErrorKind, type Provider } from "./types.js";
/** Built-in error classifier shared by all providers. */
export declare function defaultClassify(error: unknown): ErrorKind;
/** Classify an error, allowing the provider to override the default behavior. */
export declare function classifyError(error: unknown, provider: Provider<never, never>): ErrorKind;
//# sourceMappingURL=errors.d.ts.map