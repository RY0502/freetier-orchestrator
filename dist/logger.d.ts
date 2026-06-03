import type { Logger } from "./types.js";
/** Default logger that writes to the console with a stable prefix. */
export declare const defaultLogger: Logger;
/** Logger that swallows all output. Useful for tests. */
export declare const silentLogger: Logger;
