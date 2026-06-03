/**
 * How an error should be handled by the orchestrator.
 */
export var ErrorKind;
(function (ErrorKind) {
    /** Transient issue (network, timeout, model busy/loading/under load, unreachable). Retry the same provider. */
    ErrorKind["Retryable"] = "retryable";
    /** Free-tier / rate-limit / quota issue. Stop using this provider for a cooldown and switch to the next one. */
    ErrorKind["Quota"] = "quota";
    /** Any other error. Not recoverable by switching providers; bubble up immediately. */
    ErrorKind["Fatal"] = "fatal";
})(ErrorKind || (ErrorKind = {}));
