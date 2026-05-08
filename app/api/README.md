# `app/api/` — Route Handlers (Next.js 16 App Router)

Server-side endpoints powering the Universal AI Assistant.

| Route | Purpose |
| --- | --- |
| `copilotkit/` | CopilotKit runtime endpoint that bridges the chat UI with Groq. |
| `analyze/` | Detects user intent (travel / roadmap / fitness / …) and extracts structured context from the prompt. |
| `generate-ui/` | Produces the JSON spec that the client renders into a generative UI template. |

Each subfolder must export a `route.ts` with the appropriate HTTP method handlers (`GET`, `POST`, …) per Next.js 16 conventions.
