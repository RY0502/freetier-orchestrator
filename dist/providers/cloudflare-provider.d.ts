import type { Provider } from "../types.js";
import type { LlmInput } from "./types.js";
export declare class CloudflareProvider implements Provider<LlmInput, string> {
    private readonly apiToken;
    private readonly accountId;
    private readonly textModel;
    private readonly visionModel;
    private readonly requestTimeoutMs;
    readonly name = "Cloudflare";
    constructor(apiToken: string, accountId: string, textModel: string, visionModel: string, requestTimeoutMs?: number);
    invoke(input: LlmInput): Promise<string>;
}
//# sourceMappingURL=cloudflare-provider.d.ts.map