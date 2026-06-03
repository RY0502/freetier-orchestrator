import { ErrorKind } from "./types.js";
/** Extract an HTTP-ish status code from common error shapes. */
function statusOf(error) {
    if (typeof error === "object" && error !== null) {
        const e = error;
        if (typeof e.status === "number")
            return e.status;
        if (typeof e.statusCode === "number")
            return e.statusCode;
        const response = e.response;
        if (response && typeof response.status === "number")
            return response.status;
    }
    return undefined;
}
function messageOf(error) {
    if (error instanceof Error)
        return error.message;
    if (typeof error === "string")
        return error;
    try {
        return JSON.stringify(error);
    }
    catch {
        return String(error);
    }
}
const QUOTA_PATTERNS = [
    /\brate.?limit/i,
    /\bquota\b/i,
    /too many requests/i,
    /insufficient_quota/i,
    /free tier/i,
    /\bbilling\b/i,
    /requests per (day|minute|month)/i,
    /\bRP[DM]\b/,
    /daily limit/i,
    /usage limit/i,
    /exceeded your current/i,
    /\(429\)/,
    /\b429\b/
];
const RETRYABLE_PATTERNS = [
    /timeout/i,
    /timed out/i,
    /etimedout/i,
    /econnreset/i,
    /econnrefused/i,
    /enotfound/i,
    /eai_again/i,
    /socket hang up/i,
    /network/i,
    /fetch failed/i,
    /under load/i,
    /overload/i,
    /server is busy/i,
    /model is (busy|loading|currently loading|warming up)/i,
    /temporarily unavailable/i,
    /service unavailable/i,
    /unreachable/i,
    /connection (error|reset|refused|closed)/i,
    /\((500|502|503|504|529)\)/,
    /\b(502|503|504|529)\b/
];
const QUOTA_STATUS = new Set([429]);
const RETRYABLE_STATUS = new Set([408, 500, 502, 503, 504, 529]);
/** Built-in error classifier shared by all providers. */
export function defaultClassify(error) {
    const status = statusOf(error);
    if (status !== undefined) {
        if (QUOTA_STATUS.has(status))
            return ErrorKind.Quota;
        if (RETRYABLE_STATUS.has(status))
            return ErrorKind.Retryable;
    }
    const message = messageOf(error);
    if (QUOTA_PATTERNS.some((pattern) => pattern.test(message)))
        return ErrorKind.Quota;
    if (RETRYABLE_PATTERNS.some((pattern) => pattern.test(message)))
        return ErrorKind.Retryable;
    return ErrorKind.Fatal;
}
/** Classify an error, allowing the provider to override the default behavior. */
export function classifyError(error, provider) {
    const custom = provider.classifyError?.(error);
    return custom ?? defaultClassify(error);
}
