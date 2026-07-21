/**
 * Holds the ordered list of providers plus their cooldown state and the current
 * "sticky default" index. Cooldowns are timestamp-based (no dangling timers), so
 * this works safely in serverless / short-lived environments.
 */
export class ProviderRegistry {
    providers;
    cooldownUntil;
    currentIndex = 0;
    constructor(providers) {
        if (providers.length === 0) {
            throw new Error("ProviderRegistry requires at least one provider.");
        }
        const seen = new Set();
        for (const provider of providers) {
            if (seen.has(provider.name)) {
                throw new Error(`Duplicate provider name detected: "${provider.name}". Provider names must be unique.`);
            }
            seen.add(provider.name);
        }
        this.providers = providers;
        this.cooldownUntil = providers.map(() => 0);
    }
    size() {
        return this.providers.length;
    }
    at(index) {
        return this.providers[index];
    }
    names() {
        return this.providers.map((provider) => provider.name);
    }
    describe() {
        return this.providers.map((provider) => {
            const modelConfig = provider.getModelConfig?.();
            if (!modelConfig) {
                return provider.name;
            }
            return `${provider.name} (text: ${modelConfig.textModel}, vision: ${modelConfig.visionModel})`;
        });
    }
    current() {
        return this.currentIndex;
    }
    setCurrent(index) {
        this.currentIndex = index;
    }
    isInCooldown(index) {
        return Date.now() < this.cooldownUntil[index];
    }
    setCooldown(index, cooldownMs) {
        this.cooldownUntil[index] = Date.now() + cooldownMs;
    }
    clearCooldown(index) {
        this.cooldownUntil[index] = 0;
    }
    status() {
        const now = Date.now();
        return this.providers.map((provider, index) => ({
            provider: provider.name,
            inCooldown: now < this.cooldownUntil[index],
            cooldownMsRemaining: Math.max(0, this.cooldownUntil[index] - now)
        }));
    }
}
