import { ErrorKind, type Provider } from "./types.js";
/**
 * An error that carries the HTTP status code as a first-class numeric property.
 * This lets the error classifier use deterministic status-code matching instead
 * of fragile regex on the message string.
 */
export declare class HttpError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
/** Built-in error classifier shared by all providers. */
export declare function defaultClassify(error: unknown): ErrorKind;
/** Classify an error, allowing the provider to override the default behavior. */
export declare function classifyError(error: unknown, provider: Provider<never, never>): ErrorKind;
//# sourceMappingURL=errors.d.ts.map