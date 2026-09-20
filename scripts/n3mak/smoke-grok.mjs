#!/usr/bin/env node
/**
 * Minimal smoke: OmniRoute /v1/chat/completions → Grok (xai/*)
 * Exits 0 on success, 2 if skipped (no key / server down), 1 on hard failure.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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

async function main() {
  loadDotEnv();
  const base =
    (process.env.OMNIROUTE_BASE_URL || "http://127.0.0.1:20128/v1").replace(/\/$/, "");
  const model = process.env.N3MAK_DEFAULT_MODEL || "xai/grok-4.3";
  const apiKey = process.env.OMNIROUTE_API_KEY || "n3mak-local";
  const xaiKey = (process.env.XAI_API_KEY || "").trim();

  console.log(`[smoke] POST ${base}/chat/completions model=${model}`);

  if (!xaiKey) {
    console.log("[skip] XAI_API_KEY not set — config-ready only. Live Grok not verified.");
    process.exit(2);
  }

  let res;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 32,
        messages: [{ role: "user", content: "Reply with exactly: n3mak-grok-ok" }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    console.error("[skip] OmniRoute not reachable:", err.message);
    console.error("Start with: npm run dev");
    process.exit(2);
  }

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    console.error(`[fail] HTTP ${res.status}`, body);
    process.exit(1);
  }

  const content =
    body?.choices?.[0]?.message?.content ||
    body?.choices?.[0]?.text ||
    JSON.stringify(body).slice(0, 200);
  console.log("[ok] Grok reply:", content);
  process.exit(0);
}

main();
