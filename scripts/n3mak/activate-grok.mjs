#!/usr/bin/env node
/**
 * N3mak → OmniRoute Grok activator
 *
 * - Ensures Node/runtime basics
 * - If XAI_API_KEY is set: adds/updates the `xai` provider connection via CLI
 * - Prints the OpenAI-compatible base URL + default model for N3mak_Bot
 *
 * Usage:
 *   XAI_API_KEY=... node scripts/n3mak/activate-grok.mjs
 *   npm run n3mak:activate
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PROVIDERS_FILE = path.join(ROOT, "config/n3mak/providers.xai.json");
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

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    ...opts,
  });
  return result;
}

function main() {
  loadDotEnv();
  const routing = JSON.parse(readFileSync(ROUTING_FILE, "utf8"));
  const baseUrl = process.env.OMNIROUTE_BASE_URL || routing.baseUrl;
  const defaultModel =
    process.env.N3MAK_DEFAULT_MODEL || routing.defaultModel || "xai/grok-4.3";
  const key = (process.env.XAI_API_KEY || "").trim();

  console.log("=== N3mak OmniRoute Grok activator ===");
  console.log(`Base URL:       ${baseUrl}`);
  console.log(`Default model:  ${defaultModel}`);
  console.log(`XAI_API_KEY:    ${key ? "set (" + key.length + " chars)" : "NOT SET"}`);

  if (!existsSync(path.join(ROOT, "node_modules/better-sqlite3"))) {
    console.error(
      "\n[error] better-sqlite3 missing. On npm ≥11 run:\n" +
        "  npm install-scripts approve better-sqlite3 && npm install better-sqlite3\n"
    );
    process.exit(1);
  }

  if (!key) {
    console.log(`
[config-ready] Server can start, but live Grok calls need XAI_API_KEY.

Next steps:
  1. Get a key at https://console.x.ai
  2. Add to .env:  XAI_API_KEY=xai-...
  3. Start OmniRoute:  npm run dev
  4. Re-run:  npm run n3mak:activate
  5. Smoke:   npm run n3mak:smoke

N3mak_Bot OpenAI-compatible settings:
  OPENAI_BASE_URL=${baseUrl}
  OPENAI_API_KEY=\${OMNIROUTE_API_KEY:-n3mak-local}
  OPENAI_MODEL=${defaultModel}
`);
    process.exit(0);
  }

  const bin = path.join(ROOT, "bin/omniroute.mjs");
  const cli = existsSync(bin) ? ["node", bin] : ["npx", "omniroute"];

  console.log("\n[activate] Importing xAI provider (credential from XAI_API_KEY)...");
  const importResult = run(cli[0], [
    ...cli.slice(1),
    "providers",
    "import",
    PROVIDERS_FILE,
    "--yes",
    "--json",
  ]);

  if (importResult.status !== 0) {
    console.log("[activate] import via running server failed; trying providers add...");
    console.log(importResult.stderr || importResult.stdout || "");
    const add = run(cli[0], [
      ...cli.slice(1),
      "providers",
      "add",
      "xai",
      "--name",
      "n3mak-xai-grok",
      "--default-model",
      "grok-4.3",
      "--priority",
      "1",
      "--credential-env",
      "XAI_API_KEY",
      "--yes",
      "--json",
    ]);
    if (add.status !== 0) {
      console.error("[warn] Could not register provider via CLI (is the server up?).");
      console.error(add.stderr || add.stdout || "");
      console.log(`
[partial] Key is present. Start the server then run:

  npm run dev
  # in another terminal:
  node bin/omniroute.mjs providers add xai \\
    --name n3mak-xai-grok --default-model grok-4.3 \\
    --credential-env XAI_API_KEY --yes

Or use the dashboard at http://127.0.0.1:20128 → Providers → xAI → paste API key.
`);
      process.exit(0);
    }
    console.log(add.stdout || "provider add ok");
  } else {
    console.log(importResult.stdout || "provider import ok");
  }

  console.log(`
[ready] xAI/Grok wired for N3mak.

  curl ${baseUrl.replace(/\/v1\/?$/, "")}/v1/chat/completions \\
    -H "Authorization: Bearer \${OMNIROUTE_API_KEY:-n3mak-local}" \\
    -H "Content-Type: application/json" \\
    -d '{"model":"${defaultModel}","messages":[{"role":"user","content":"ping"}]}'

  npm run n3mak:smoke
`);
}

main();
