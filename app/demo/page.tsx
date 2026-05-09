"use client";

/**
 * Demo / landing page.
 *
 * Single self-contained client component that showcases every pillar of the
 * Universal AI Assistant in one scrollable surface:
 *
 *   1) Hero — animated headline + CTA into the running app.
 *   2) Feature showcase — 4 cards (Copilot, Morphic UI, MCPs, App Builder)
 *      each linking to its dedicated route.
 *   3) Morphic mini-demo — three mood buttons that swap a `COLOR_SCHEMES`
 *      gradient instantly, illustrating context-driven theming.
 *   4) MCP live demo — calls the real `/api/mcp/weather` endpoint and
 *      renders current weather + 3 forecast days for any city.
 *   5) Stats / Stack / Footer.
 *
 * No fake data: the weather block goes through the real endpoint; the rest
 * of the page is presentational and labelled as such.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Cloud,
  CloudRain,
  CloudSnow,
  Code2,
  Cpu,
  Database,
  Droplets,
  Github,
  Hammer,
  LayoutGrid,
  Loader2,
  MapPin,
  Plug,
  RefreshCw,
  Sparkles,
  Sun,
  Wand2,
  Wind,
  Zap,
} from "lucide-react";

import {
  COLOR_SCHEMES,
  type UIMood,
} from "@/lib/ui-context-detector";
import type { WeatherData } from "@/lib/mcp";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

interface FeatureCard {
  id: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  cta: string;
  icon: ReactNode;
  illustration: ReactNode;
  accent: string;
}

interface StatCard {
  value: string;
  label: string;
  icon: ReactNode;
}

interface MoodOption {
  mood: UIMood;
  label: string;
  emoji: string;
  description: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    mood: "professional",
    label: "Profesional",
    emoji: "💼",
    description: "Tonos azules sobrios para roadmaps y dashboards",
  },
  {
    mood: "playful",
    label: "Juguetón",
    emoji: "🎈",
    description: "Magenta y púrpura para experiencias divertidas",
  },
  {
    mood: "adventurous",
    label: "Aventurero",
    emoji: "🏔️",
    description: "Naranjas y rojos para road trips y deportes",
  },
];

const TECH_CHIPS: string[] = [
  "Next.js 16",
  "React 19",
  "Tailwind v4",
  "TypeScript",
  "CopilotKit 1.3",
  "OpenRouter",
  "Vercel AI SDK",
  "Zod",
  "framer-motion",
  "Sandpack",
  "lucide-react",
  "date-fns",
];

const STATS: StatCard[] = [
  {
    value: "4",
    label: "APIs gratuitas integradas como MCPs",
    icon: <Plug className="h-5 w-5" />,
  },
  {
    value: "8",
    label: "Widgets morfológicos listos para componer",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  {
    value: "3",
    label: "Templates funcionales en App Builder",
    icon: <Hammer className="h-5 w-5" />,
  },
  {
    value: "≈3×",
    label: "Más rápido tras la auditoría de performance",
    icon: <Zap className="h-5 w-5" />,
  },
];

// ---------------------------------------------------------------------------
// SVG illustrations (inline, dependency-free)
// ---------------------------------------------------------------------------

function CopilotIllustration() {
  return (
    <svg
      viewBox="0 0 320 160"
      className="h-full w-full"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="copilot-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect
        x="10"
        y="14"
        width="220"
        height="36"
        rx="18"
        fill="url(#copilot-grad)"
        opacity="0.3"
      />
      <rect
        x="10"
        y="60"
        width="160"
        height="28"
        rx="14"
        fill="#fff"
        opacity="0.12"
      />
      <rect
        x="80"
        y="100"
        width="220"
        height="44"
        rx="22"
        fill="url(#copilot-grad)"
      />
      <text
        x="100"
        y="128"
        fill="#fff"
        fontSize="14"
        fontFamily="ui-sans-serif, system-ui"
        fontWeight="600"
      >
        Plan a 5-day trip to Tokyo
      </text>
      <circle cx="40" cy="125" r="14" fill="#fff" opacity="0.18" />
    </svg>
  );
}

function MorphicIllustration() {
  return (
    <svg
      viewBox="0 0 320 160"
      className="h-full w-full"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="morph-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="morph-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="morph-grad-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect x="10" y="20" width="92" height="120" rx="16" fill="url(#morph-grad-1)" />
      <rect x="114" y="20" width="92" height="120" rx="16" fill="url(#morph-grad-2)" />
      <rect x="218" y="20" width="92" height="120" rx="16" fill="url(#morph-grad-3)" />
      <rect x="22" y="34" width="68" height="8" rx="4" fill="#fff" opacity="0.5" />
      <rect x="22" y="48" width="48" height="8" rx="4" fill="#fff" opacity="0.3" />
      <rect x="126" y="34" width="68" height="8" rx="4" fill="#fff" opacity="0.5" />
      <rect x="126" y="48" width="48" height="8" rx="4" fill="#fff" opacity="0.3" />
      <rect x="230" y="34" width="68" height="8" rx="4" fill="#fff" opacity="0.5" />
      <rect x="230" y="48" width="48" height="8" rx="4" fill="#fff" opacity="0.3" />
    </svg>
  );
}

function McpIllustration() {
  return (
    <svg
      viewBox="0 0 320 160"
      className="h-full w-full"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="mcp-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="80" r="32" fill="url(#mcp-grad)" />
      <text
        x="160"
        y="86"
        textAnchor="middle"
        fill="#0f172a"
        fontSize="14"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui"
      >
        LLM
      </text>
      {[
        { x: 30, y: 30, label: "Weather" },
        { x: 290, y: 30, label: "Places" },
        { x: 30, y: 130, label: "FX" },
        { x: 290, y: 130, label: "Wiki" },
      ].map((node) => (
        <g key={node.label}>
          <line
            x1="160"
            y1="80"
            x2={node.x}
            y2={node.y}
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          <circle cx={node.x} cy={node.y} r="20" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
          <text
            x={node.x}
            y={node.y + 4}
            textAnchor="middle"
            fill="#67e8f9"
            fontSize="9"
            fontWeight="600"
            fontFamily="ui-sans-serif, system-ui"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AppBuilderIllustration() {
  return (
    <svg
      viewBox="0 0 320 160"
      className="h-full w-full"
      aria-hidden="true"
      role="img"
    >
      <rect x="10" y="14" width="300" height="132" rx="12" fill="#020617" stroke="#1e293b" />
      <rect x="10" y="14" width="300" height="22" fill="#0f172a" />
      <circle cx="24" cy="25" r="4" fill="#ef4444" />
      <circle cx="38" cy="25" r="4" fill="#f59e0b" />
      <circle cx="52" cy="25" r="4" fill="#22c55e" />
      <text
        x="160"
        y="29"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        Sandpack preview
      </text>
      {[
        { y: 50, w: 180, c: "#475569" },
        { y: 64, w: 240, c: "#22d3ee" },
        { y: 78, w: 140, c: "#a855f7" },
        { y: 92, w: 200, c: "#22c55e" },
        { y: 106, w: 100, c: "#475569" },
      ].map((line) => (
        <rect
          key={line.y}
          x="22"
          y={line.y}
          width={line.w}
          height="6"
          rx="3"
          fill={line.c}
        />
      ))}
      <rect x="22" y="120" width="80" height="18" rx="9" fill="#22d3ee" opacity="0.7" />
      <text
        x="62"
        y="133"
        textAnchor="middle"
        fill="#0f172a"
        fontSize="10"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui"
      >
        Run ▶
      </text>
    </svg>
  );
}

const FEATURES: FeatureCard[] = [
  {
    id: "copilot",
    title: "Asistente Copilot",
    tagline: "Chat en lenguaje natural → UI completa",
    description:
      "Pídele un viaje, un roadmap o un plan de fitness. El asistente clasifica la intención, extrae los slots con Zod y renderiza la plantilla correspondiente con animaciones y datos enriquecidos.",
    href: "/",
    cta: "Abrir asistente",
    icon: <Bot className="h-5 w-5" />,
    illustration: <CopilotIllustration />,
    accent: "from-indigo-500 to-fuchsia-500",
  },
  {
    id: "morphic",
    title: "UI Morfológica",
    tagline: "Una intención → una UI distinta",
    description:
      "El detector de contexto elige dominio, mood, densidad y un set de widgets (RouteMap, Timeline, WeatherCards…). Cambia el prompt y la interfaz se reorganiza en tiempo real con un esquema de color coherente.",
    href: "/morphic",
    cta: "Explorar widgets",
    icon: <LayoutGrid className="h-5 w-5" />,
    illustration: <MorphicIllustration />,
    accent: "from-pink-500 to-purple-500",
  },
  {
    id: "mcp",
    title: "MCP en vivo",
    tagline: "Datos reales: clima, lugares, divisas, Wikipedia",
    description:
      "Cuatro APIs gratuitas (Open-Meteo, Nominatim/Overpass, Frankfurter, Wikipedia) expuestas como herramientas MCP. Se llaman en paralelo desde /api/mcp/* con tolerancia a fallos individuales.",
    href: "/morphic",
    cta: "Ver datos enriquecidos",
    icon: <Plug className="h-5 w-5" />,
    illustration: <McpIllustration />,
    accent: "from-cyan-500 to-sky-500",
  },
  {
    id: "app-builder",
    title: "App Builder",
    tagline: "Genera mini-apps con vista previa en vivo",
    description:
      "Estilo Lovable: describe la app, el sistema cae a templates probados (todo, calculadora, pomodoro) si el LLM falla, y compila al instante en Sandpack con editor incluido.",
    href: "/app-builder",
    cta: "Crea tu app",
    icon: <Hammer className="h-5 w-5" />,
    illustration: <AppBuilderIllustration />,
    accent: "from-amber-500 to-orange-500",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MCPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Pick a Lucide weather icon from the Spanish description string returned by
 * the Open-Meteo MCP. Best-effort, never throws.
 */
function pickWeatherIcon(description: string): ReactNode {
  const d = description.toLowerCase();
  if (d.includes("nieve") || d.includes("nev")) {
    return <CloudSnow className="h-7 w-7" aria-hidden="true" />;
  }
  if (d.includes("lluvia") || d.includes("lloviz") || d.includes("chubasc")) {
    return <CloudRain className="h-7 w-7" aria-hidden="true" />;
  }
  if (d.includes("nublado") || d.includes("niebla")) {
    return <Cloud className="h-7 w-7" aria-hidden="true" />;
  }
  return <Sun className="h-7 w-7" aria-hidden="true" />;
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DemoPage() {
  // ---------- Morphic mini-demo state ----------
  const [activeMood, setActiveMood] = useState<UIMood>("professional");
  const moodScheme = COLOR_SCHEMES[activeMood];

  // ---------- Live weather state ----------
  const [city, setCity] = useState<string>("Madrid");
  const [pendingCity, setPendingCity] = useState<string>("Madrid");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (target: string): Promise<void> => {
    const trimmed = target.trim();
    if (!trimmed) {
      setWeatherError("Escribe una ciudad");
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch("/api/mcp/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: trimmed }),
      });
      const json = (await res.json()) as MCPResponse<WeatherData>;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setWeather(json.data);
      setCity(trimmed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setWeatherError(message);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // First load: prefetch Madrid weather so the section is alive on arrival.
  // The fetch is deferred to a macrotask to avoid synchronous setState inside
  // the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    const handle = setTimeout(() => {
      void fetchWeather("Madrid");
    }, 0);
    return () => clearTimeout(handle);
  }, [fetchWeather]);

  const forecastPreview = useMemo(() => {
    if (!weather?.forecast) return [];
    return weather.forecast.slice(1, 4);
  }, [weather]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ============================================================= */}
      {/* HERO                                                           */}
      {/* ============================================================= */}
      <section
        role="region"
        aria-label="Hero — Universal AI Assistant"
        className="relative overflow-hidden px-4 pt-16 pb-24 md:pt-24 md:pb-32"
      >
        {/* Animated gradient blobs */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-40 h-96 w-96 rounded-full bg-indigo-600/40 blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-20 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-500/30 blur-3xl"
          animate={{ scale: [1, 1.05, 1], x: [0, 18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Grid overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" aria-hidden="true" />
            Generative UI Hackathon · 2026
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Asistente de UI generativa
            <br className="hidden sm:block" />
            que crea apps, planes y dashboards{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              en vivo con datos reales
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl text-base text-slate-400 sm:text-lg"
          >
            Describe lo que necesitas en una frase. El sistema clasifica la
            intención, llama a 4 MCPs (clima, lugares, divisas, Wikipedia) y
            stream-ea una interfaz interactiva hecha a medida — incluyendo
            mini-apps generadas y compiladas al instante.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
            >
              Probar el asistente
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/app-builder"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:bg-white/10"
            >
              <Hammer className="h-4 w-4" aria-hidden="true" />
              Crea tu app
            </Link>
          </motion.div>

          {/* Mini stat strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-4"
            role="list"
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                role="listitem"
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
              >
                <div className="flex items-center gap-2 text-cyan-300">
                  {stat.icon}
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* FEATURE SHOWCASE                                               */}
      {/* ============================================================= */}
      <section
        id="features"
        role="region"
        aria-label="Funcionalidades destacadas"
        className="relative px-4 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Cuatro pilares, una sola experiencia
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">
              Cada ruta de la app demuestra una pieza distinta del sistema. Todas
              comparten el mismo backbone de prompting + Zod + streaming.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURES.map((feature, idx) => (
              <motion.article
                key={feature.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur transition hover:border-white/20 hover:bg-slate-900/60"
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br ${feature.accent} opacity-20 blur-3xl transition-opacity group-hover:opacity-30`}
                />

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${feature.accent} text-white shadow-lg`}
                      aria-hidden="true"
                    >
                      {feature.icon}
                    </span>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-300">
                    {feature.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>

                  <div
                    className="mt-5 aspect-[2/1] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60"
                    aria-hidden="true"
                  >
                    {feature.illustration}
                  </div>

                  <Link
                    href={feature.href}
                    aria-label={`${feature.cta} (${feature.title})`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
                  >
                    {feature.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* MORPHIC MOOD MINI-DEMO                                         */}
      {/* ============================================================= */}
      <section
        role="region"
        aria-label="Demostración de UI morfológica"
        className="relative px-4 py-20 md:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400">
                UI Morfológica · presentacional
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                La UI cambia con la intención
              </h2>
              <p className="mt-2 max-w-2xl text-slate-400">
                Pulsa un mood y mira cómo el gradient, las palabras clave y el
                widget mock se reordenan al instante. En la app real lo decide el
                detector basado en tu prompt.
              </p>
            </div>
            <Link
              href="/morphic"
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 md:self-end"
            >
              Probar con prompts reales
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </motion.div>

          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Selector de mood"
          >
            {MOOD_OPTIONS.map((option) => {
              const active = activeMood === option.mood;
              return (
                <button
                  key={option.mood}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`Cambiar mood a ${option.label}`}
                  onClick={() => setActiveMood(option.mood)}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition " +
                    (active
                      ? "border-white/40 bg-white text-slate-950 shadow-lg"
                      : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <span aria-hidden="true">{option.emoji}</span>
                  {option.label}
                </button>
              );
            })}
          </div>

          <motion.div
            key={activeMood}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${moodScheme.gradient} p-8 shadow-xl`}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="text-white">
                <p className={`text-xs font-semibold uppercase tracking-widest ${moodScheme.accent}`}>
                  Mood: {activeMood}
                </p>
                <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {MOOD_OPTIONS.find((m) => m.mood === activeMood)?.description}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full ${moodScheme.primary} px-3 py-1 text-xs font-semibold text-white shadow`}>
                    primary
                  </span>
                  <span className={`rounded-full ${moodScheme.secondary} px-3 py-1 text-xs font-semibold text-white shadow`}>
                    secondary
                  </span>
                  <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-mono text-white/90 backdrop-blur">
                    {moodScheme.gradient}
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:min-w-[280px]">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={`${activeMood}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="rounded-xl border border-white/20 bg-white/15 p-3 backdrop-blur"
                    aria-hidden="true"
                  >
                    <div className="h-2 w-12 rounded-full bg-white/60" />
                    <div className="mt-2 h-2 w-20 rounded-full bg-white/40" />
                    <div className="mt-1 h-2 w-16 rounded-full bg-white/30" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* MCP LIVE WEATHER DEMO                                          */}
      {/* ============================================================= */}
      <section
        role="region"
        aria-label="Demostración en vivo del MCP de clima"
        className="relative px-4 py-20 md:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                MCP en vivo · datos reales (Open-Meteo)
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Llamada real a /api/mcp/weather
              </h2>
              <p className="mt-2 max-w-2xl text-slate-400">
                Escribe una ciudad y el endpoint geocodifica + consulta el
                forecast en menos de 1 s. Sin claves, sin mocks.
              </p>
            </div>
          </motion.div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void fetchWeather(pendingCity);
              }}
              className="flex flex-col gap-3 sm:flex-row"
              aria-label="Buscar clima por ciudad"
            >
              <label className="sr-only" htmlFor="city-input">
                Ciudad
              </label>
              <div className="relative flex-1">
                <MapPin
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="city-input"
                  type="text"
                  value={pendingCity}
                  onChange={(e) => setPendingCity(e.target.value)}
                  placeholder="Madrid, Tokio, Cusco..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
              <button
                type="submit"
                disabled={weatherLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {weatherLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Consultando…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Consultar clima
                  </>
                )}
              </button>
            </form>

            {weatherError ? (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
              >
                <strong className="font-semibold">No pudo cargarse el clima:</strong>{" "}
                {weatherError}
              </div>
            ) : null}

            {weather ? (
              <motion.div
                key={weather.location}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_2fr]"
              >
                {/* Current */}
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 p-6 text-white shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-100">
                        Ahora en
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        {weather.location}
                      </h3>
                    </div>
                    <span aria-hidden="true">
                      {pickWeatherIcon(weather.description)}
                    </span>
                  </div>
                  <p className="mt-4 text-5xl font-black tracking-tight">
                    {Math.round(weather.temperature)}°
                  </p>
                  <p className="mt-1 text-sm text-cyan-100">
                    {weather.description}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-white/10 p-2 backdrop-blur">
                      <span className="block text-cyan-100/80">Sensación</span>
                      <span className="font-semibold">
                        {Math.round(weather.feelsLike)}°
                      </span>
                    </div>
                    <div className="rounded-lg bg-white/10 p-2 backdrop-blur">
                      <span className="flex items-center gap-1 text-cyan-100/80">
                        <Droplets className="h-3 w-3" aria-hidden="true" />
                        Humedad
                      </span>
                      <span className="font-semibold">{weather.humidity}%</span>
                    </div>
                    <div className="rounded-lg bg-white/10 p-2 backdrop-blur">
                      <span className="flex items-center gap-1 text-cyan-100/80">
                        <Wind className="h-3 w-3" aria-hidden="true" />
                        Viento
                      </span>
                      <span className="font-semibold">
                        {Math.round(weather.windSpeed)} km/h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Forecast */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {forecastPreview.length > 0 ? (
                    forecastPreview.map((day) => (
                      <div
                        key={day.date}
                        className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {formatShortDate(day.date)}
                        </p>
                        <div className="mt-2 flex items-end gap-2">
                          <span className="text-3xl font-bold text-white">
                            {Math.round(day.tempMax)}°
                          </span>
                          <span className="mb-1 text-sm text-slate-400">
                            / {Math.round(day.tempMin)}°
                          </span>
                        </div>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-300">
                          <Droplets className="h-3 w-3" aria-hidden="true" />
                          {day.precipitation.toFixed(1)} mm
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
                      Sin forecast disponible para esta ubicación.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : weatherLoading && !weather ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" aria-hidden="true" />
                Consultando Open-Meteo para {pendingCity}…
              </div>
            ) : null}

            <p className="mt-4 text-xs text-slate-500">
              Endpoint: <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300">POST /api/mcp/weather</code>{" "}
              · ciudad actual:{" "}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300">{city}</code>
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* TECH STACK                                                     */}
      {/* ============================================================= */}
      <section
        role="region"
        aria-label="Stack tecnológico"
        className="relative px-4 py-20 md:py-24"
      >
        <div className="mx-auto max-w-5xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Construido con piezas modernas
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-3 max-w-2xl text-slate-400"
          >
            Todo el flujo es typed end-to-end y el LLM se valida con Zod en cada
            frontera.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {TECH_CHIPS.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur"
              >
                <Cpu className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                {chip}
              </span>
            ))}
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
              <Database className="mb-3 h-5 w-5 text-emerald-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-white">
                Validación estricta
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Zod en intent → contexto → spec UI. El LLM nunca rompe la app.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
              <Plug className="mb-3 h-5 w-5 text-cyan-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-white">
                APIs gratuitas como MCPs
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Open-Meteo, Nominatim+Overpass, Frankfurter, Wikipedia.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
              <Code2 className="mb-3 h-5 w-5 text-fuchsia-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-white">
                Cache + streaming
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Generación en frío ≈3× más rápida tras la auditoría; caché TTL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* FOOTER                                                         */}
      {/* ============================================================= */}
      <footer
        role="contentinfo"
        className="border-t border-white/10 bg-slate-950 px-4 py-10"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow"
              aria-hidden="true"
            >
              <Wand2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                Universal AI Assistant
              </p>
              <p className="text-xs text-slate-500">
                Generative UI Hackathon · 2026
              </p>
            </div>
          </div>

          <nav
            aria-label="Enlaces del pie"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400"
          >
            <Link href="/" className="hover:text-white">
              Asistente
            </Link>
            <Link href="/morphic" className="hover:text-white">
              UI Morfológica
            </Link>
            <Link href="/app-builder" className="hover:text-white">
              App Builder
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Ver en GitHub (placeholder)"
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              README
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
