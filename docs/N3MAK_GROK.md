# N3mak ↔ OmniRoute ↔ Free AI (and optional Grok)

**English** · [العربية](#العربية)

Wire [N3mak_Bot](https://github.com/Namak7678/N3mak_Bot) (or any OpenAI-compatible client) through this OmniRoute fork.

## Free path (no xAI billing) — recommended

Uses **Cloudflare AI Playground** (`cfp/*`) — no API key, no console.x.ai payment.

**Verified live model:** `cfp/openai/gpt-oss-20b`

```bash
npm install
npx playwright install chromium   # required for cfp/*
npm run dev                       # http://127.0.0.1:20128
node scripts/n3mak/smoke-free.mjs # or: npm run n3mak:smoke-free
```

Point N3mak_Bot / any OpenAI client:

```
OPENAI_BASE_URL=http://127.0.0.1:20128/v1
OPENAI_API_KEY=n3mak-local
OPENAI_MODEL=cfp/openai/gpt-oss-20b
```

Minimal curl:

```bash
curl http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer n3mak-local" \
  -H "Content-Type: application/json" \
  -d '{"model":"cfp/openai/gpt-oss-20b","messages":[{"role":"user","content":"Reply with exactly: free-ok"}]}'
```

Other free `cfp/*` fallbacks: `cfp/zai-org/glm-4.7-flash`, `cfp/openai/gpt-oss-120b`, `cfp/moonshotai/kimi-k2.6`.

If Playwright is missing you will see `Executable doesn't exist` / `chromium_headless_shell` — run `npx playwright install chromium` again.

Config files:

- `.env.n3mak.example` — free defaults (`N3MAK_DEFAULT_MODEL=cfp/openai/gpt-oss-20b`)
- `config/n3mak/routing.json` — free-first routing
- `scripts/n3mak/smoke-free.mjs`

## Optional: official xAI Grok (paid)

| Provider id | Auth | Upstream | Notes |
|-------------|------|----------|--------|
| `xai` | API key (`XAI_API_KEY`) | `https://api.x.ai/v1/chat/completions` | Requires console.x.ai key (billing) |
| `xai-oauth` / `xao` | OAuth (SuperGrok) | same | Dashboard “Sign in with xAI” |
| `grok-web` | Browser / TLS sidecar | Grok web | Needs `OMNIROUTE_GROK_TLS_*` |
| `grok-cli` | Grok Build JWT | cli-chat-proxy | Separate from API key |

```bash
# Edit .env → XAI_API_KEY=xai-...
npm run n3mak:activate
# set OPENAI_MODEL=xai/grok-4.3
npm run n3mak:smoke
```

---

## Install notes (this fork / Cloud Agents box)

- **Node**: use 24.x. Engines require `>=22.22.2 <23 || >=24 <27`.
- **Playwright**: required for free `cfp/*` path.
- **Ready-to-run**: `npm run dev` (port **20128**). `/api/health` → `{"status":"ok"}`.
- **Full `npm run build`**: may OOM on ~15GB boxes — prefer `npm run dev`.

## العربية

### المسار المجاني (بدون دفع xAI) — الموصى به

1. `npm install` ثم `npx playwright install chromium`
2. `npm run dev` على المنفذ `20128`
3. `node scripts/n3mak/smoke-free.mjs`
4. في البوت:

```
OPENAI_BASE_URL=http://127.0.0.1:20128/v1
OPENAI_API_KEY=n3mak-local
OPENAI_MODEL=cfp/openai/gpt-oss-20b
```

النموذج المُتحقق: `cfp/openai/gpt-oss-20b` عبر Cloudflare Playground داخل OmniRoute.

### اختياري: Grok الرسمي

ضع `XAI_API_KEY` من console.x.ai ثم `npm run n3mak:activate` وغيّر النموذج إلى `xai/grok-4.3`.
