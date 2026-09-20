#!/usr/bin/env node
/**
 * Free-path smoke: OmniRoute /v1/chat/completions → Cloudflare Playground (cfp/*)
 * No XAI_API_KEY required. Exits 0 on success, 2 if server down, 1 on hard failure.
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
  const base = (
    process.env.OMNIROUTE_BASE_URL || "http://127.0.0.1:20128/v1"
  ).replace(/\/$/, "");
  const model = process.env.N3MAK_DEFAULT_MODEL || "cfp/openai/gpt-oss-20b";
  const apiKey = process.env.OMNIROUTE_API_KEY || "n3mak-local";

  console.log(`[smoke-free] POST ${base}/chat/completions model=${model}`);

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
        messages: [{ role: "user", content: "Reply with exactly: free-ok" }],
      }),
      signal: AbortSignal.timeout(180_000),
    });
  } catch (err) {
    console.error("[skip] OmniRoute not reachable:", err.message);
    console.error("Start with: npm run dev");
    console.error("If CFP fails with missing browser: npx playwright install chromium");
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
    if (String(body?.error?.message || "").includes("Executable doesn't exist")) {
      console.error("Hint: npx playwright install chromium");
    }
    process.exit(1);
  }

  const content = body?.choices?.[0]?.message?.content ?? "";
  console.log("[ok]", JSON.stringify(content).slice(0, 200));
  if (!String(content).toLowerCase().includes("free-ok") && !content) {
    console.error("[fail] empty content");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[fail]", err);
  process.exit(1);
});
