/** Default logger that writes to the console with a stable prefix. */
export const defaultLogger = {
    info: (message) => console.log(message),
    warn: (message) => console.warn(message),
    error: (message) => console.error(message)
};
/** Logger that swallows all output. Useful for tests. */
export const silentLogger = {
    info: () => { },
    warn: () => { },
    error: () => { }
};
