#!/usr/bin/env node
/** Tiny OpenAI-compatible client aimed at local OmniRoute → Grok. */
const base = (process.env.OPENAI_BASE_URL || process.env.OMNIROUTE_BASE_URL || "http://127.0.0.1:20128/v1").replace(/\/$/, "");
const key = process.env.OPENAI_API_KEY || process.env.OMNIROUTE_API_KEY || "n3mak-local";
const model = process.env.OPENAI_MODEL || process.env.N3MAK_DEFAULT_MODEL || "xai/grok-4.3";
const prompt = process.argv.slice(2).join(" ") || "Say hello from N3mak via Grok.";

const res = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 128,
  }),
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(res.status, body);
  process.exit(1);
}
console.log(body.choices?.[0]?.message?.content ?? body);
