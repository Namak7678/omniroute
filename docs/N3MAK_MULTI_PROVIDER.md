# N3mak — Multi-provider fallback (Groq / Gemini / OpenRouter / Anthropic)

This adds real, official-API fallback providers on top of the existing
free Cloudflare Playground path and the optional paid xAI/Grok path
documented in `N3MAK_GROK.md`. **Nothing in that file or in
`config/n3mak/providers.xai.json` is touched by this.**

## Fallback order (config/n3mak/routing.json)

1. `cfp/*` — free, Cloudflare Playground (no key, browser-automation based)
2. `xai/*` — Grok, paid, only active if `XAI_API_KEY` is set (unchanged)
3. `groq/*` — Groq, **real free tier**
4. `gemini/*` — Google Gemini, **real free tier**
5. `openrouter/*` — OpenRouter `:free` models — free, but the exact free
   catalog and rate limits rotate; check https://openrouter.ai/models?fmt=free
   before relying on a specific model id
6. `anthropic/*` — Claude — **paid API, no standing free tier**. New
   accounts get a small one-time trial credit only. Included because it was
   requested, not because it's a free option like the others.

Only providers whose API key env var is actually set get activated —
you don't need all four.

## Setup

1. Get whichever keys you want:
   - Groq: https://console.groq.com/keys
   - Gemini: https://aistudio.google.com/apikey
   - OpenRouter: https://openrouter.ai/keys
   - Anthropic: https://console.anthropic.com (billing required)
2. Add them to `.env` (see `.env.n3mak.example`)
3. Start OmniRoute: `npm run dev`
4. Activate: `npm run n3mak:activate-providers`
   (only imports the providers whose key is present)
5. N3mak_Bot doesn't need any code change — it already talks to OmniRoute's
   single OpenAI-compatible endpoint; OmniRoute handles the fallback chain
   internally per `routing.json`.

## Notes

- This does not change `defaultModel` (still the free `cfp/*` path) or
  reorder/remove any existing `xai/*` entries — it only appends new
  fallback entries at the end of `fallbackModels`.
- Re-ordering priority (e.g. putting a real-API provider ahead of the
  browser-automation `cfp/*` path for reliability) is a one-line edit to
  `fallbackModels` order whenever you want that.
