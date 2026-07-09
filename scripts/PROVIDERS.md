Provider check script

Run the provider checks script which invokes each configured provider with a tiny dummy PNG image.

Setup
- Create a `.env` file with your provider keys (or export env vars into your shell). Example env vars used by `createProviders()` include:
  - `GROQ_API_KEY`
  - `HUGGINGFACE_API_KEY`
  - `NVIDIA_API_KEY`
  - `SAMBANOVA_API_KEY`
  - `CEREBRAS_API_KEY`
  - `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

Run

```bash
npx tsx scripts/check-providers.ts
```

Notes
- The script attempts to import `dotenv/config` if available so a local `.env` will be loaded when `dotenv` is installed. If you rely on `.env` make sure `dotenv` is available in your environment or run the command with `node -r dotenv/config`.
