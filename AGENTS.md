<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Universal AI Assistant — Architecture Guide for Agents

This project is a **Generative UI** assistant: the user describes a goal in natural language and the system responds by streaming a fully interactive, purpose-built UI (not just text). It targets the Generative UI Hackathon and ships three reference experiences: travel planning, dev roadmaps, and fitness plans.

## High-level Flow

```
┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│  User Input  │ → │ Intent Detection │ → │ Context Extraction │ → │   UI Generation    │
│  (chat box)  │   │ (Groq + Zod)     │   │  (entities, slots) │   │ (JSON spec → JSX)  │
└──────────────┘   └──────────────────┘   └────────────────────┘   └────────────────────┘
        │                   │                       │                        │
        └─── CopilotKit ────┴───────── /api/analyze ─┴────── /api/generate-ui ┘
```

1. **User Input** — captured by the CopilotKit chat sidebar in `app/page.tsx`.
2. **Intent Detection** — `app/api/analyze/route.ts` calls Groq (Llama 3.3 70B) with the prompt from `prompts/intent-detection.md` and validates the result with a Zod enum (`travel | roadmap | fitness | unknown`).
3. **Context Extraction** — same route extracts the slots required for the chosen intent (destination + dates for travel, stack + experience level for roadmaps, goal + days/week for fitness, …) into a typed object.
4. **UI Generation** — `app/api/generate-ui/route.ts` feeds intent + context into `prompts/ui-generation.md`, asks the LLM to emit a JSON spec matching the relevant Zod schema in `lib/schemas.ts`, and streams it back via the Vercel AI SDK.
5. **Render** — the matching component in `app/components/templates/` (e.g. `TravelItinerary`, `DevRoadmap`, `FitnessPlan`) renders the spec into a rich, interactive UI.

## Key Components

| Layer | Path | Responsibility |
| --- | --- | --- |
| Chat shell | `app/page.tsx`, `app/layout.tsx` | Mount `<CopilotKit>` provider and chat sidebar. |
| Runtime bridge | `app/api/copilotkit/route.ts` | CopilotKit ↔ Groq adapter (uses Vercel AI SDK). |
| Intent + context | `app/api/analyze/route.ts` | Classify intent and extract structured slots. |
| UI spec generator | `app/api/generate-ui/route.ts` | Stream a typed JSON spec describing the UI. |
| Templates | `app/components/templates/*` | One client component per use case. |
| Shared logic | `lib/*` | Groq client, Zod schemas, helpers. |
| Prompts | `prompts/*` | Versioned system / task prompts. |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Route Handlers, Server Components).
- **UI**: React 19 + Tailwind CSS v4 + `lucide-react` icons.
- **Generative UI framework**: CopilotKit (`@copilotkit/react-core`, `react-ui`, `runtime`).
- **LLM**: Groq (`groq-sdk`) running Llama 3.3 70B.
- **AI orchestration**: Vercel AI SDK (`ai`) for streaming + tool calls.
- **Validation**: Zod for every LLM ↔ app boundary (intents, contexts, UI specs).
- **Dates**: `date-fns` for itinerary / timeline rendering.
- **Language**: TypeScript in strict mode (see `tsconfig.json`).

## Supported Use Cases

1. **Travel planning** — itinerary, daily schedule, budget breakdown, booking suggestions.
2. **Dev roadmaps** — phased timeline, recommended tech stack, learning resources, milestones.
3. **Fitness plans** — weekly routine, nutrition guidance, progress tracking widgets.

The architecture is intentionally extensible: adding a new use case = (a) a new entry in the intent enum, (b) a new Zod schema in `lib/schemas.ts`, (c) a new template component in `app/components/templates/`, (d) optional prompt fragment in `prompts/`.

## Conventions for Agents Editing This Repo

- **Always** read the relevant Next.js 16 doc under `node_modules/next/dist/docs/` before touching routing, caching, or server/client boundaries.
- **Never** import `groq-sdk` from a client component — it must stay behind a route handler.
- **Always** validate LLM output with Zod before returning it to the client.
- **Always** mark template components with `"use client"` (they use hooks and animations).
- **Never** edit `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, or files in `public/` unless explicitly required by the task.
- **Never** commit real API keys; `.env.local` stays local, use `.env.example` for placeholders.
- **Prefer** editing existing files over creating new ones; keep the App Router structure intact.
