# @freetier/orchestrator

A small, provider-agnostic **LangGraph** framework that maximizes **free-tier usage** by juggling multiple providers. When one provider hits its free-tier limit (RPM/RPD/quota), the orchestrator seamlessly switches to the next one — carrying the exact same input (context) across the switch — so an agent can keep working far beyond a single provider's free quota.

It is **not** tied to LLM or VLM. Any call that can fail with rate-limit / transient errors can be wrapped: text models, vision models, embeddings, or any HTTP API.

## Features

- **Provider-agnostic** — generic over `Provider<TInput, TOutput>`; the framework never inspects your payload.
- **LangGraph-native** — the retry/fallback loop is a compiled `StateGraph`, and `asNode()` lets any LangGraph agent wrap its model calls.
- **Retry transient errors** — network / timeout / "model busy / under load / unreachable" errors are retried on the same provider (default: 2 retries, 10s apart).
- **Free-tier failover** — rate-limit / quota errors cool the provider down and switch to the next provider.
- **Context preserved** — the identical `TInput` is passed to every provider that is tried, so conversation/progress is never lost.
- **Sticky default** — the last working provider becomes the default for subsequent requests.
- **Easy to extend** — add a provider by implementing one `invoke()` method; it works seamlessly with the others.
- **Serverless-safe cooldowns** — timestamp-based, no dangling timers.

## Install

This package is local. From a consumer project, depend on it via a file path:

```json
{ "dependencies": { "@freetier/orchestrator": "file:freetier-orchestrator" } }
```

Then build it (`npm install && npm run build` inside `freetier-orchestrator`).

## Core concepts

### Provider

```ts
import { Provider, ErrorKind } from "@freetier/orchestrator";

class MyProvider implements Provider<MyInput, MyOutput> {
  readonly name = "my-provider";

  async invoke(input: MyInput): Promise<MyOutput> {
    // call your API; throw on failure
  }

  // OPTIONAL: override error classification. Return undefined to use the default.
  classifyError(error: unknown): ErrorKind | undefined {
    return undefined;
  }
}
```

Error handling is automatic via a built-in classifier:

| Kind | Examples | Behavior |
| --- | --- | --- |
| `Retryable` | timeout, ECONNRESET, "model under load", 503/504/529 | Retry same provider (2x, 10s gap) |
| `Quota` | 429, "rate limit", "quota exceeded", "requests per day" | Cooldown + switch provider |
| `Fatal` | anything else (400, auth, bad request) | Throw immediately |

### Orchestrator

```ts
import { FreeTierOrchestrator } from "@freetier/orchestrator";

const orchestrator = new FreeTierOrchestrator<MyInput, MyOutput>(
  [new ProviderA(), new ProviderB(), new ProviderC()],
  {
    retry: { maxRetries: 2, retryDelayMs: 10_000 },
    cooldown: { cooldownMs: 120_000 }
  }
);

const result = await orchestrator.invoke(input);
```

### Use inside a LangGraph agent

```ts
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const State = Annotation.Root({
  messages: Annotation<Message[]>(),
  answer: Annotation<string | undefined>()
});

const modelNode = orchestrator.asNode<typeof State.State>({
  buildInput: (state) => ({ messages: state.messages }),
  applyOutput: (_state, output) => ({ answer: output })
});

const graph = new StateGraph(State)
  .addNode("model", modelNode)
  .addEdge(START, "model")
  .addEdge("model", END)
  .compile();
```

Because `buildInput` derives the provider payload from the parent graph state, and the orchestrator passes that identical payload to every provider it tries, the agent's context and progress survive any provider switch.

## Configuration

| Option | Default | Description |
| --- | --- | --- |
| `retry.maxRetries` | `2` | Extra attempts after the first call, for transient errors. |
| `retry.retryDelayMs` | `10000` | Delay between retries. |
| `cooldown.cooldownMs` | `120000` | How long a provider is skipped after a quota error. |
| `logger` | console | Inject a custom logger, or use `silentLogger`. |

## Adding a new provider

1. Implement `Provider<TInput, TOutput>` with a unique `name` and an `invoke()`.
2. Add it to the array passed to `FreeTierOrchestrator`.

That's it — ordering in the array defines priority, and failover/retry/cooldown work automatically.

## Demo / test

```bash
npm run demo
```

This runs `examples/failover-demo.ts`, which proves:
1. Free-tier exhaustion on Provider A → seamless switch to Provider B (context preserved, A cooled down, B becomes sticky default).
2. Transient errors are retried on the same provider.
3. When every free tier is exhausted, a clear error is thrown.

## API

- `new FreeTierOrchestrator<TInput, TOutput>(providers, options?)`
- `orchestrator.invoke(input): Promise<TOutput>`
- `orchestrator.asNode<TState>({ buildInput, applyOutput })`
- `orchestrator.getCurrentProvider(): string`
- `orchestrator.getStatus(): ProviderStatus[]`
- `ErrorKind`, `defaultClassify`, `classifyError`, `silentLogger`, `defaultLogger`
