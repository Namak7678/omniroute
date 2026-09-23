# N3mak helpers

```bash
# Free path (no xAI key) — Cloudflare Playground
node scripts/n3mak/smoke-free.mjs   # or: npm run n3mak:smoke-free

# Optional paid Grok
node scripts/n3mak/activate-grok.mjs  # or: npm run n3mak:activate
node scripts/n3mak/smoke-grok.mjs     # or: npm run n3mak:smoke

node examples/n3mak/openai_client.mjs # or: npm run n3mak:client

# Optional extra fallbacks: Groq / Gemini / OpenRouter / Anthropic
# (see docs/N3MAK_MULTI_PROVIDER.md — does not touch Grok config above)
node scripts/n3mak/activate-multi.mjs # or: npm run n3mak:activate-providers
```

Default free model: `cfp/openai/gpt-oss-20b` (requires Playwright Chromium).
Requires OmniRoute `npm run dev` on port 20128.

If `package.json` scripts are present on this branch, prefer `npm run n3mak:*`.
