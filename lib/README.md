# `lib/` — Shared utilities and clients

Framework-agnostic helpers shared across server routes and client components.

Suggested files:

- `groq.ts` — singleton Groq client wired with `GROQ_API_KEY`.
- `intent.ts` — intent detection helpers and Zod schemas.
- `schemas.ts` — shared Zod schemas describing UI specs (travel, roadmap, fitness).
- `utils.ts` — small pure helpers (date formatting via `date-fns`, class merging, etc.).

Anything imported by both server and client code lives here.
