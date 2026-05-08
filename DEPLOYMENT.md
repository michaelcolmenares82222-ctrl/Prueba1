# Deployment Guide

> One-pager for getting **Universal AI Assistant** running in production.

## Recommended target: Vercel

The app is a stock Next.js 16 application — Vercel deploys it without any extra config.

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Import on Vercel

- Go to [vercel.com/new](https://vercel.com/new) and pick this repository.
- Framework preset: **Next.js** (auto-detected).
- Root directory: leave at repo root.
- Build command: `next build` (default).
- Output directory: `.next` (default).

### 3. Environment variables

Add these in **Project Settings → Environment Variables** for the *Production*, *Preview* and *Development* scopes:

| Variable | Required | Example | Notes |
|---|:---:|---|---|
| `GROQ_API_KEY` | ✅ | `gsk_...` | From [console.groq.com/keys](https://console.groq.com/keys). Used at runtime by `/api/copilotkit` and `/api/analyze`. |
| `NEXT_PUBLIC_APP_URL` | recommended | `https://your-app.vercel.app` | Used by client-side links. Falls back to `http://localhost:3000` if unset. |

> The Groq key is checked **lazily** at request time, so missing it during `next build` will not fail the build — but POST calls to the AI endpoints will return `500`.

### 4. Deploy

Click *Deploy*. The first build takes ~1 min.

---

## Self-hosting

Any Node.js 20+ host that can run `next start` works:

```bash
git clone <repo>
cd <repo>
npm ci
cp .env.example .env.local      # then fill in GROQ_API_KEY
npm run build
npm run start                   # serves on http://localhost:3000
```

Behind a reverse proxy (nginx, Caddy, Cloudflare, …) make sure you forward:

- `Host` header
- `X-Forwarded-Proto` (so Next.js generates correct absolute URLs)
- WebSocket upgrade if you ever enable HMR / streaming features

---

## Sanity checks after deploy

Run these from your machine, replacing the host:

```bash
# 1. Static landing renders
curl -I https://your-app.vercel.app | head -n 1
# Expect: HTTP/2 200

# 2. CopilotKit endpoint info
curl https://your-app.vercel.app/api/copilotkit
# Expect: {"endpoint":"/api/copilotkit","status":"active",...}

# 3. Analyze endpoint detects intent end-to-end (uses real Groq quota)
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"message":"Quiero viajar a Tokio 5 dias"}'
# Expect: {"intent":"travel","confidence":0.9,"context":{...}}
```

---

## Production hardening checklist

- [ ] **Rotate the Groq key** if it ever leaked into a chat / log / commit.
- [ ] Replace the in-memory rate limiter (`lib/groq.ts:checkRateLimit`) with Upstash Redis or similar — the in-memory map resets per serverless instance.
- [ ] Set CORS origin explicitly for `/api/copilotkit` if you ever serve the chat from a different origin.
- [ ] Add observability — Vercel Analytics + Logflare/Datadog for the route handlers.
- [ ] Pin a Groq model version once you settle on one for the demo.
- [ ] Consider migrating from the dev Llama model to a hosted production-tier endpoint with SLAs.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `500 GROQ_API_KEY is not set` on POST | env var missing in deployment | Add `GROQ_API_KEY` and redeploy. |
| Sidebar empty / CopilotKit silent | `runtimeUrl` mismatch | Confirm `<CopilotKit runtimeUrl="/api/copilotkit">` matches the deployed path. |
| `401 Invalid API Key` from Groq | key revoked or mistyped | Generate a new key at [console.groq.com/keys](https://console.groq.com/keys). |
| `429 rate limit exceeded` | hit the in-memory limiter or Groq's quota | Wait 60 s; for production, swap to a distributed limiter and Groq paid tier. |
| Templates render with default content | LLM returned non-JSON or no JSON | Parsers fall back to defaults on purpose; tighten prompts in `prompts/` if quality is low. |
