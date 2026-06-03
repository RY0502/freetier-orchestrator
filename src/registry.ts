import type { Provider, ProviderStatus } from "./types.js";

/**
 * Holds the ordered list of providers plus their cooldown state and the current
 * "sticky default" index. Cooldowns are timestamp-based (no dangling timers), so
 * this works safely in serverless / short-lived environments.
 */
export class ProviderRegistry<TInput, TOutput> {
  private readonly providers: Provider<TInput, TOutput>[];
  private readonly cooldownUntil: number[];
  private currentIndex = 0;

  constructor(providers: Provider<TInput, TOutput>[]) {
    if (providers.length === 0) {
      throw new Error("ProviderRegistry requires at least one provider.");
    }

    const seen = new Set<string>();
    for (const provider of providers) {
      if (seen.has(provider.name)) {
        throw new Error(`Duplicate provider name detected: "${provider.name}". Provider names must be unique.`);
      }
      seen.add(provider.name);
    }

    this.providers = providers;
    this.cooldownUntil = providers.map(() => 0);
  }

  size(): number {
    return this.providers.length;
  }

  at(index: number): Provider<TInput, TOutput> {
    return this.providers[index];
  }

  names(): string[] {
    return this.providers.map((provider) => provider.name);
  }

  current(): number {
    return this.currentIndex;
  }

  setCurrent(index: number): void {
    this.currentIndex = index;
  }

  isInCooldown(index: number): boolean {
    return Date.now() < this.cooldownUntil[index];
  }

  setCooldown(index: number, cooldownMs: number): void {
    this.cooldownUntil[index] = Date.now() + cooldownMs;
  }

  clearCooldown(index: number): void {
    this.cooldownUntil[index] = 0;
  }

  status(): ProviderStatus[] {
    const now = Date.now();
    return this.providers.map((provider, index) => ({
      provider: provider.name,
      inCooldown: now < this.cooldownUntil[index],
      cooldownMsRemaining: Math.max(0, this.cooldownUntil[index] - now)
    }));
  }
}
