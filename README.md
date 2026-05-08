# Universal AI Assistant 🤖✨

> Your intelligent assistant that generates complete interactive interfaces, not just text.

**Generative UI Global Hackathon 2024** — Built with Next.js 16, CopilotKit, and Groq.

## 🎯 What is this?

Unlike traditional chatbots that only return text, this assistant generates **complete, interactive user interfaces** tailored to your specific needs:

- **✈️ Travel Planning** — Interactive itineraries with day-by-day schedules, budget breakdowns, and booking recommendations.
- **💻 Dev Roadmaps** — Visual learning paths with tech stacks, resources, and milestone tracking *(template coming soon)*.
- **💪 Fitness Plans** — Weekly workout schedules, nutrition guides, and progress trackers.

## 🚀 Features

- **Generative UI** — Real components, not just markdown.
- **Context-Aware** — Detects intent and extracts the slots needed for each domain.
- **Interactive Components** — Clickable, explorable, actionable interfaces.
- **Responsive** — Mobile-first; works on any screen.
- **Streaming-Ready** — CopilotKit + AI SDK pipeline ready for progressive rendering.
- **Strictly Typed End-to-End** — Every LLM ↔ app boundary validated with Zod.
- **Resilient** — Loading and error states baked in; defaults if the LLM under-delivers.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **AI Integration** | CopilotKit, Groq (Llama 3.3 70B) |
| **State Management** | React Hooks, CopilotKit Actions |
| **Validation** | Zod schemas |
| **Icons** | Lucide React |
| **Dates** | date-fns |

## 📦 Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/        # Intent detection + context extraction
│   │   └── copilotkit/     # CopilotKit runtime endpoint
│   ├── components/
│   │   ├── templates/      # UI templates (travel, fitness, …)
│   │   └── ui/             # Reusable primitives (LoadingSpinner, ErrorMessage)
│   ├── globals.css         # Tailwind v4 + animations + CopilotKit theme
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main chat interface
│   └── providers.tsx       # CopilotKit provider + sidebar
├── lib/
│   ├── groq.ts             # Groq client wrapper + rate limiting
│   ├── types.ts            # Domain TypeScript types
│   ├── schemas.ts          # Zod validation schemas
│   ├── parsers.ts          # LLM-output parsers with safe defaults
│   ├── intent-detection.ts # Intent classifier
│   ├── context-extraction.ts # Per-intent slot extraction
│   ├── copilot-actions.ts  # Action definitions
│   └── ui-generators.ts    # Per-domain UI content generators
├── prompts/                # System / intent / context-extraction prompts
└── scripts/                # bash + node smoke-test scripts
```

## ⚙️ Architecture Flow

```
┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│  User Input  │ → │ Intent Detection │ → │ Context Extraction │ → │   UI Generation    │
│  (chat box)  │   │ (Groq + Zod)     │   │  (entities, slots) │   │  (typed templates) │
└──────────────┘   └──────────────────┘   └────────────────────┘   └────────────────────┘
        │                   │                       │                        │
        └─── CopilotKit ────┴───────── /api/analyze ─┴── /api/copilotkit ────┘
```

1. The chat sidebar (`<CopilotSidebar>`) captures the user message.
2. The CopilotKit runtime decides to invoke one of the `generate_*` actions and provides a typed `context`.
3. The frontend handler calls `/api/analyze` to validate intent/context and then renders the matching template (`TravelPlanUI`, `FitnessPlanUI`, …).
4. Parsers in `lib/parsers.ts` fill in safe defaults so the UI always renders something useful.

See `AGENTS.md` for the full set of conventions agents should follow when extending this repo.

## 🚦 Getting Started

### 1. Prerequisites

- Node.js 20+
- A Groq API key — grab one at [console.groq.com/keys](https://console.groq.com/keys)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example file and add your key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
GROQ_API_KEY=your_real_groq_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try one of the demo prompts below.

### 5. Other scripts

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

## 🎤 Demo Prompts

Open the chat sidebar and try:

- *"Quiero viajar a París por 5 días con $1500"*
- *"Plan a 7-day trip to Tokyo with a $2500 budget"*
- *"Necesito bajar 10kg en 2 meses, soy principiante"*
- *"Build me a 4-day-a-week strength plan for muscle gain"*

The chat will pick the right intent, extract the right context, and render the matching template.

## 🧪 Testing

The repo ships with a few standalone smoke tests:

```bash
# Verify Groq client end-to-end (requires GROQ_API_KEY)
npx tsx --env-file=.env.local lib/__test-groq.ts

# Verify intent detection + context extraction
npx tsx --env-file=.env.local lib/__test-intent.ts

# Verify UI generators produce content for the 3 domains
npx tsx --env-file=.env.local lib/__test-ui-generation.ts

# Hit the /api/analyze endpoint with the dev server running
npm run dev
node scripts/test-api.js
```

`scripts/test-api.sh` is the bash equivalent of `test-api.js` — works from Git Bash / WSL / macOS / Linux.

## 🚀 Deployment

The app is ready to deploy to **Vercel**:

1. Push the repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add `GROQ_API_KEY` and `NEXT_PUBLIC_APP_URL` in the Vercel environment variables.
4. Click *Deploy*.

> **Tip:** The CopilotKit runtime endpoint requires the env var to be set at runtime (not just at build time); the runtime client checks it lazily.

## 🛣️ Roadmap

- [ ] Dev Roadmap template (`DevRoadmapUI` + parser).
- [ ] Stream UI specs from `/api/copilotkit` actions instead of round-tripping through `/api/analyze`.
- [ ] Persist generated plans to local storage / DB.
- [ ] Auth + multi-user rate limiting.
- [ ] Real booking integrations (Skyscanner, Booking.com, GetYourGuide).

## 📝 License

MIT — built for the Generative UI Hackathon.
