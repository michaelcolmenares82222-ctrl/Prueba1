# Universal AI Assistant

> Generative UI Hackathon project — a single chat box that turns any goal into a fully interactive, purpose-built UI.

Most assistants reply with a wall of text. **Universal AI Assistant** instead **generates the UI you actually need** for the task: an itinerary view for trips, a phased roadmap for dev projects, a weekly plan for fitness — rendered as real React components, not markdown.

## Features

- **One assistant, many UIs** — the chat detects intent and streams a tailored UI back to you.
- **Three reference templates out of the box**:
  - **Travel planning** — itinerary, daily schedule, budget, booking suggestions.
  - **Dev roadmaps** — timeline, tech stack picks, learning resources, milestones.
  - **Fitness plans** — weekly routine, nutrition tips, progress tracking.
- **Extensible by design** — add a new use case by dropping a Zod schema + a template component.
- **Strictly typed** — every LLM response is validated with Zod before it touches the UI.
- **Streaming end-to-end** — generated UIs appear progressively as the model thinks.

## Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | React 19 + Tailwind CSS v4 + `lucide-react` |
| Generative UI | [CopilotKit](https://copilotkit.ai) (`@copilotkit/react-core`, `react-ui`, `runtime`) |
| LLM | [Groq](https://groq.com) — Llama 3.3 70B via `groq-sdk` |
| AI orchestration | [Vercel AI SDK](https://sdk.vercel.ai) (`ai`) |
| Validation | [Zod](https://zod.dev) |
| Dates | `date-fns` |
| Language | TypeScript (strict) |

See [`AGENTS.md`](./AGENTS.md) for the full architecture and contribution rules.

## Project Structure

```
app/
├── api/
│   ├── copilotkit/     # CopilotKit runtime ↔ Groq bridge
│   ├── analyze/        # Intent detection + context extraction
│   └── generate-ui/    # JSON UI-spec generator (streamed)
├── components/
│   └── templates/      # One client component per use case
├── layout.tsx
└── page.tsx            # Chat shell

lib/                    # Groq client, Zod schemas, shared helpers
prompts/                # System & task prompts (versioned)
```

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A Groq API key — grab one at [console.groq.com/keys](https://console.groq.com/keys).

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example file and add your key:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
GROQ_API_KEY=your_real_groq_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try prompts like:

- *"Plan a 5-day trip to Tokyo in November with a $2000 budget."*
- *"Give me a 12-week roadmap to learn full-stack TypeScript from zero."*
- *"Build me a 4-day-a-week strength plan for fat loss."*

### 5. Other scripts

```bash
npm run build   # production build
npm run start   # run the production server
npm run lint    # ESLint
```

## License

MIT — built for the Generative UI Hackathon.
