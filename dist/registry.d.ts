import type { Provider, ProviderStatus } from "./types.js";
/**
 * Holds the ordered list of providers plus their cooldown state and the current
 * "sticky default" index. Cooldowns are timestamp-based (no dangling timers), so
 * this works safely in serverless / short-lived environments.
 */
export declare class ProviderRegistry<TInput, TOutput> {
    private readonly providers;
    private readonly cooldownUntil;
    private currentIndex;
    constructor(providers: Provider<TInput, TOutput>[]);
    size(): number;
    at(index: number): Provider<TInput, TOutput>;
    names(): string[];
    describe(): string[];
    current(): number;
    setCurrent(index: number): void;
    isInCooldown(index: number): boolean;
    setCooldown(index: number, cooldownMs: number): void;
    clearCooldown(index: number): void;
    status(): ProviderStatus[];
}
//# sourceMappingURL=registry.d.ts.map