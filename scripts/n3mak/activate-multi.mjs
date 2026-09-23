#!/usr/bin/env node
/**
 * N3mak -> OmniRoute multi-provider activator
 *
 * Adds real, official-API fallback providers alongside the existing xai/Grok
 * setup (activate-grok.mjs is untouched and still works independently):
 *   - Groq       (GROQ_API_KEY)        - has a real free tier
 *   - Gemini     (GEMINI_API_KEY)      - has a real free tier
 *   - OpenRouter (OPENROUTER_API_KEY)  - free ":free" models, quota rotates
 *   - Anthropic  (ANTHROPIC_API_KEY)   - PAID API (no standing free tier,
 *                                        only a small one-time trial credit)
 *
 * Only providers whose env var is actually set get imported - this script
 * never touches xai/Grok config or providers.xai.json.
 *
 * Usage:
 *   GROQ_API_KEY=... GEMINI_API_KEY=... node scripts/n3mak/activate-multi.mjs
 *   npm run n3mak:activate-providers
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE_FILE = path.join(ROOT, "config/n3mak/providers.multi.json");
const TMP_FILE = path.join(ROOT, "config/n3mak/.providers.multi.active.json");
const ROUTING_FILE = path.join(ROOT, "config/n3mak/routing.json");

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function run(cmd, args) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
}

function main() {
  loadDotEnv();
  const all = JSON.parse(readFileSync(SOURCE_FILE, "utf8")).providers;
  const routing = JSON.parse(readFileSync(ROUTING_FILE, "utf8"));

  console.log("=== N3mak OmniRoute multi-provider activator ===");
  const ready = [];
  const missing = [];
  for (const p of all) {
    const key = (process.env[p.credentialEnv] || "").trim();
    if (key) {
      ready.push(p);
      console.log(`  [ok]   ${p.provider.padEnd(11)} ${p.credentialEnv} set (${key.length} chars)`);
    } else {
      missing.push(p);
      console.log(`  [skip] ${p.provider.padEnd(11)} ${p.credentialEnv} not set`);
    }
  }

  if (ready.length === 0) {
    console.log(`
[config-ready] No new provider keys set yet - xai/Grok config is untouched.

Add whichever of these you have to .env, then re-run:
  GROQ_API_KEY=...        (console.groq.com)
  GEMINI_API_KEY=...      (aistudio.google.com/apikey)
  OPENROUTER_API_KEY=...  (openrouter.ai/keys)
  ANTHROPIC_API_KEY=...   (console.anthropic.com - PAID, no standing free tier)
`);
    process.exit(0);
  }

  writeFileSync(TMP_FILE, JSON.stringify({ providers: ready }, null, 2));

  const bin = path.join(ROOT, "bin/omniroute.mjs");
  const cli = existsSync(bin) ? ["node", bin] : ["npx", "omniroute"];

  console.log(`\n[activate] Importing ${ready.length} provider(s): ${ready.map((p) => p.provider).join(", ")}...`);
  const importResult = run(cli[0], [...cli.slice(1), "providers", "import", TMP_FILE, "--yes", "--json"]);

  if (importResult.status !== 0) {
    console.log("[activate] import via running server failed; trying providers add one-by-one...");
    for (const p of ready) {
      const add = run(cli[0], [
        ...cli.slice(1),
        "providers",
        "add",
        p.provider,
        "--name",
        p.name,
        "--default-model",
        p.defaultModel,
        "--priority",
        String(p.priority),
        "--credential-env",
        p.credentialEnv,
        "--yes",
        "--json",
      ]);
      console.log(`  ${p.provider}: ${add.status === 0 ? "ok" : "FAILED - " + (add.stderr || add.stdout || "")}`);
    }
  } else {
    console.log(importResult.stdout || "provider import ok");
  }

  if (existsSync(TMP_FILE)) unlinkSync(TMP_FILE);

  const baseUrl = process.env.OMNIROUTE_BASE_URL || routing.baseUrl;
  console.log(`
[ready] Fallback chain now (in routing.json order):
  ${routing.defaultModel}  <- default (unchanged)
  ${routing.fallbackModels.join("\n  ")}

Test any model directly:
  curl ${baseUrl}/chat/completions \
    -H "Authorization: Bearer \${OMNIROUTE_API_KEY:-n3mak-local}" \
    -H "Content-Type: application/json" \
    -d '{"model":"groq/llama-3.3-70b-versatile","messages":[{"role":"user","content":"ping"}]}'
`);
}

main();
