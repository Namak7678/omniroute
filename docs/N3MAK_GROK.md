# N3mak ↔ OmniRoute ↔ Grok / xAI

**English** · [العربية](#العربية)

Wire [N3mak_Bot](https://github.com/Namak7678/N3mak_Bot) (or any OpenAI-compatible client) through this OmniRoute fork to **official xAI Grok**.

## What is already first-class in OmniRoute

| Provider id | Auth | Upstream | Notes |
|-------------|------|----------|--------|
| `xai` | API key (`XAI_API_KEY`) | `https://api.x.ai/v1/chat/completions` (+ `/v1/responses`) | **Preferred for N3mak** |
| `xai-oauth` / `xao` | OAuth (SuperGrok) | same | Dashboard “Sign in with xAI” |
| `grok-web` | Browser / TLS sidecar | Grok web | Needs `OMNIROUTE_GROK_TLS_*`, `GROK_AUTH_PATH` |
| `grok-cli` | Grok Build JWT | cli-chat-proxy | Separate from API key |

Catalog models (API key path): `grok-4.6`, `grok-4.3`, `grok-4.20-*`, `grok-build-0.1`.

## Activate (this machine)

```bash
# Node 24 (engines: >=22.22.2 <23 || >=24 <27). npm 11 needs script approvals:
npm install-scripts approve better-sqlite3 tls-client-node
npm install
# .env is created from .env.example on postinstall

# Merge N3mak profile (optional) then set the only required live secret:
cp .env.n3mak.example .env.n3mak   # reference
# Edit .env → XAI_API_KEY=xai-...

npm run dev                        # http://127.0.0.1:20128
npm run n3mak:activate             # registers provider xai from XAI_API_KEY
npm run n3mak:smoke                # live chat smoke (needs key + server)
```

Files:

- `.env.n3mak.example` — documented env vars (no secrets)
- `config/n3mak/providers.xai.json` — `omniroute providers import` template
- `config/n3mak/routing.json` — default model routing for N3mak
- `scripts/n3mak/activate-grok.mjs` / `smoke-grok.mjs`

## Connect N3mak_Bot

OmniRoute OpenAI-compatible endpoint:

```
OPENAI_BASE_URL=http://127.0.0.1:20128/v1
OPENAI_API_KEY=<any OmniRoute key or n3mak-local>
OPENAI_MODEL=xai/grok-4.3
```

In `/workspace/N3mak_Bot/bot/.env.example` (or Railway service vars), add the same three variables. A thin client helper lives at `examples/n3mak/openai_client.mjs`.

Minimal curl:

```bash
curl http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer n3mak-local" \
  -H "Content-Type: application/json" \
  -d '{"model":"xai/grok-4.3","messages":[{"role":"user","content":"ping"}]}'
```

## Without an API key

Install + `npm run dev` still work (OmniRoute zero-config free providers). Live **Grok** calls stay blocked until `XAI_API_KEY` is set — that is the only remaining step.

---

## Install notes (this fork / Cloud Agents box)

- **Node**: use 24.x (`nvm use 24`). Engines require `>=22.22.2 <23 || >=24 <27`.
- **npm ≥ 11**: approve native install scripts before/after install:

```bash
npm install-scripts approve better-sqlite3 tls-client-node onnxruntime-node
npm install
```

  `package.json` `allowScripts` already pins these so a fresh clone is quieter.
- **Ready-to-run path**: `npm run dev` (port **20128**). Verified: `/api/health` → `{"status":"ok"}`.
- **Full `npm run build`**: Next.js 16 production compile can exceed ~11GB RSS and get OOM-killed on a 15GB box. Prefer `npm run dev` for activation; use a larger machine or CI for release builds.
- **OmniRoute API key**: create via dashboard login (`INITIAL_PASSWORD`, default `CHANGEME`) → Keys, or `POST /api/keys`. Put it in `OMNIROUTE_API_KEY` (gitignored `.env`).

## العربية

اربط **N3mak_Bot** بهذا الـ fork من OmniRoute لاستخدام **Grok الرسمي من xAI**.

### التفعيل

1. `npm install` ثم ضع المفتاح في `.env`: `XAI_API_KEY=...` (من https://console.x.ai)
2. `npm run dev` → الخادم على `http://127.0.0.1:20128`
3. `npm run n3mak:activate` ثم `npm run n3mak:smoke`

### ربط البوت

```
OPENAI_BASE_URL=http://127.0.0.1:20128/v1
OPENAI_API_KEY=n3mak-local
OPENAI_MODEL=xai/grok-4.3
```

بدون مفتاح xAI يبقى التثبيت والتشغيل جاهزين؛ استدعاء Grok الحي يحتاج `XAI_API_KEY` فقط.
