import type { Logger } from "./types.js";

/** Default logger that writes to the console with a stable prefix. */
export const defaultLogger: Logger = {
  info: (message: string) => console.log(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message)
};

/** Logger that swallows all output. Useful for tests. */
export const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};
