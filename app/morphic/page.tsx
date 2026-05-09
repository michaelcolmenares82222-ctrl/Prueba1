"use client";

/**
 * Morphic UI Showcase
 *
 * Lets a user type a free-form prompt + pick a domain, then renders the
 * adaptive widget grid produced by `detectUIContext`. For travel prompts we
 * additionally pull a real enrichment payload from `/api/mcp/enrichTravel`
 * (weather + Wikipedia + top places) and adapt it into a multi-widget shape
 * so the deterministic widgets (`WeatherCards`, `Timeline`, `RestaurantMap`,
 * `RouteMap`, `GenericCard`) all have honest data to render.
 *
 * For non-travel domains we leave `data={undefined}` so the renderer shows
 * skeleton placeholders rather than fake data.
 */

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";

import { MorphicRenderer } from "@/app/components/morphic/MorphicRenderer";
import {
  detectUIContext,
  type UIContext,
  type UIDomain,
} from "@/lib/ui-context-detector";
import type {
  EnrichedTravelContext,
  PlaceData,
  WeatherData,
  WeatherForecastDay,
  WikipediaInfo,
} from "@/lib/mcp";

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const DOMAINS: Array<{ value: UIDomain; label: string }> = [
  { value: "travel", label: "Viajes" },
  { value: "fitness", label: "Fitness" },
  { value: "dev", label: "Desarrollo" },
  { value: "finance", label: "Finanzas" },
  { value: "food", label: "Gastronomía" },
  { value: "event", label: "Eventos" },
  { value: "generic", label: "Genérico" },
];

const EXAMPLES: Array<{ domain: UIDomain; prompt: string }> = [
  { domain: "travel", prompt: "Road trip por la costa oeste de Portugal" },
  { domain: "travel", prompt: "Escapada cultural a Roma 4 días" },
  { domain: "fitness", prompt: "Quiero perder 5 kg en 3 meses entrenando en casa" },
  { domain: "fitness", prompt: "Plan de hipertrofia para ganar masa muscular" },
  { domain: "dev", prompt: "Aprender React Hooks y construir una web app" },
  { domain: "dev", prompt: "Roadmap mobile app con React Native" },
];

// ---------------------------------------------------------------------------
// Travel-data extraction + widget adapter
// ---------------------------------------------------------------------------

/**
 * Best-effort destination extraction from free-form input.
 *
 * Looks for "a <destino>" / "en <destino>" / "para <destino>" / "por <destino>"
 * patterns; otherwise returns the trimmed input verbatim so the user can still
 * see *some* enrichment when they just type a city name.
 */
function extractDestination(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const patterns = [
    /\b(?:viaje|escapada|road\s*trip|ruta|trip|tour|vacaciones|crucero)\s+(?:a|por|en|hacia|para)\s+([\p{L}\s,'-]{2,60})/iu,
    /\b(?:a|por|en|hacia|para)\s+([\p{L}][\p{L}\s,'-]{2,60})/iu,
  ];

  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match?.[1]) {
      return match[1].replace(/\s+\d+\s+d[ií]as?.*$/iu, "").trim();
    }
  }

  return trimmed;
}

/** Map an Open-Meteo-ish daily forecast row into a `WeatherCards` day. */
function forecastToDay(f: WeatherForecastDay) {
  const date = new Date(f.date);
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const day = Number.isNaN(date.getTime())
    ? f.date
    : labels[date.getDay()] ?? f.date;

  // Heuristic condition from precipitation amount (mm); we don't have the
  // weather_code in the forecast row.
  const condition =
    f.precipitation >= 5 ? "rain" : f.precipitation >= 1 ? "cloudy" : "sunny";

  return {
    day,
    condition,
    tempC: Math.round((f.tempMax + f.tempMin) / 2),
    tempMinC: f.tempMin,
    tempMaxC: f.tempMax,
  };
}

interface AdaptedTravelData {
  // WeatherCards
  days: ReturnType<typeof forecastToDay>[];
  // Timeline
  items: Array<{
    title: string;
    description?: string;
    tag?: string;
  }>;
  // RouteMap
  stops: Array<{
    name: string;
    description?: string;
  }>;
  // RestaurantMap
  restaurants: Array<{
    name: string;
    cuisine?: string;
    address?: string;
    reason?: string;
  }>;
  // GenericCard
  title?: string;
  description?: string;
  bullets?: string[];
  footnote?: string;
  // Raw payload for the debug panel
  __raw: EnrichedTravelContext;
}

function adaptTravelEnrichment(
  payload: EnrichedTravelContext
): AdaptedTravelData {
  const weather: WeatherData | null = payload.weather;
  const wiki: WikipediaInfo | null = payload.wiki;
  const places: PlaceData[] = payload.topPlaces ?? [];

  const days = (weather?.forecast ?? []).map(forecastToDay);

  const items = places.map((p) => ({
    title: p.name,
    description: p.address,
    tag: p.type,
  }));

  const stops = places.map((p) => ({
    name: p.name,
    description: p.type
      ? `Tipo: ${p.type}`
      : p.address || undefined,
  }));

  const restaurants = places.map((p) => ({
    name: p.name,
    cuisine: p.type,
    address: p.address,
    reason: "Lugar destacado en la zona (OpenStreetMap)",
  }));

  const wikiBullets =
    wiki?.extract && typeof wiki.extract === "string"
      ? wiki.extract
          .split(/(?<=\.)\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
      : undefined;

  const title = wiki?.title ?? payload.destination;
  const description = weather
    ? `${weather.location}: ${Math.round(
        weather.temperature
      )}°C, ${weather.description.toLowerCase()}.`
    : wiki?.extract?.split(/(?<=\.)\s+/)[0];

  return {
    days,
    items,
    stops,
    restaurants,
    title,
    description,
    bullets: wikiBullets,
    footnote: weather
      ? `Datos en vivo: Open-Meteo · Wikipedia · OpenStreetMap`
      : "Datos en vivo desde MCP servers",
    __raw: payload,
  };
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

interface MCPEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

async function fetchEnrichTravel(
  destination: string
): Promise<EnrichedTravelContext> {
  const res = await fetch("/api/mcp/enrichTravel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination }),
  });

  let body: MCPEnvelope<EnrichedTravelContext> | null = null;
  try {
    body = (await res.json()) as MCPEnvelope<EnrichedTravelContext>;
  } catch {
    /* ignore, we'll throw below */
  }

  if (!res.ok || !body?.success || !body.data) {
    const message = body?.error ?? `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; context: UIContext; data?: AdaptedTravelData }
  | { status: "error"; context: UIContext; error: string };

export default function MorphicShowcasePage() {
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState<UIDomain>("travel");
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const liveContext = useMemo<UIContext | null>(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    return detectUIContext(trimmed, domain);
  }, [input, domain]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      const context = detectUIContext(trimmed, domain);

      if (domain !== "travel") {
        setState({ status: "ready", context });
        return;
      }

      setState({ status: "loading" });
      try {
        const destination = extractDestination(trimmed) || trimmed;
        const enriched = await fetchEnrichTravel(destination);
        const adapted = adaptTravelEnrichment(enriched);
        setState({ status: "ready", context, data: adapted });
      } catch (err) {
        setState({
          status: "error",
          context,
          error:
            err instanceof Error
              ? err.message
              : "Error desconocido al consultar los servicios MCP.",
        });
      }
    },
    [input, domain]
  );

  const handleReset = useCallback(() => {
    setInput("");
    setState({ status: "idle" });
  }, []);

  const isLoading = state.status === "loading";
  const renderedContext =
    state.status === "ready" || state.status === "error"
      ? state.context
      : liveContext;
  const renderedData = state.status === "ready" ? state.data : undefined;

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8 text-slate-100">
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            UI Morfológica
          </div>
          <h1 className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
            Detecta dominio, monta widgets, conecta MCP.
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-400 md:text-base">
            Escribe un objetivo y elige un dominio. El detector heurístico
            elige los widgets y, para viajes, traemos datos reales desde
            Open-Meteo, Wikipedia y OpenStreetMap.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-2xl backdrop-blur"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ej: "road trip por la costa", "perder 5 kg en 3 meses", "aprender React Hooks"…'
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm placeholder:text-slate-500 focus:border-indigo-500/60 focus:outline-none"
              aria-label="Describe tu objetivo"
            />
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as UIDomain)}
              className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 text-sm focus:border-indigo-500/60 focus:outline-none md:w-44"
              aria-label="Dominio"
            >
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generar UI
                </>
              )}
            </button>
            {state.status !== "idle" && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-xs text-slate-400 transition hover:border-slate-700 hover:text-slate-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reiniciar
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] uppercase tracking-widest text-slate-500">
              Ejemplos
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.prompt}
                  type="button"
                  onClick={() => {
                    setInput(ex.prompt);
                    setDomain(ex.domain);
                  }}
                  className="rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-700 hover:bg-slate-800"
                >
                  {ex.prompt}
                </button>
              ))}
            </div>
          </div>
        </form>

        {renderedContext && (
          <ContextPanel context={renderedContext} live={state.status === "idle"} />
        )}

        {state.status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <div className="font-medium">No pudimos enriquecer con MCP</div>
              <div className="text-xs text-rose-200/80">{state.error}</div>
              <div className="mt-1 text-xs text-rose-200/60">
                Renderizamos el layout sin datos en vivo (los widgets mostrarán
                skeletons donde corresponda).
              </div>
            </div>
          </motion.div>
        )}

        {renderedContext && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 md:p-6">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Widgets renderizados
                </h2>
                <p className="text-xs text-slate-500">
                  {renderedContext.components.length} widget
                  {renderedContext.components.length === 1 ? "" : "s"} ·{" "}
                  {state.status === "ready" && renderedData
                    ? "datos en vivo desde MCP"
                    : "sin payload (skeletons)"}
                </p>
              </div>
            </header>

            <MorphicRenderer
              context={renderedContext}
              data={renderedData}
              className="bg-white/5 p-4 rounded-xl"
            />
          </section>
        )}

        {state.status === "ready" && renderedData?.__raw && (
          <RawMcpPanel raw={renderedData.__raw} />
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ContextPanel({
  context,
  live,
}: {
  context: UIContext;
  live: boolean;
}) {
  return (
    <section
      aria-label="Contexto detectado"
      className={`rounded-2xl border border-slate-800 ${
        live ? "bg-slate-900/30" : "bg-slate-900/60"
      } p-4 md:p-5`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">
          Contexto detectado
          {live && (
            <span className="ml-2 text-[10px] font-normal uppercase tracking-widest text-indigo-300/80">
              en vivo
            </span>
          )}
        </h2>
      </header>
      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Field k="Dominio" v={context.domain} />
        <Field k="Subtipo" v={context.subtype} />
        <Field k="Mood" v={context.mood} />
        <Field k="Densidad" v={context.density} />
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          Componentes
        </span>
        {context.components.map((c) => (
          <span
            key={c}
            className={`rounded-full bg-gradient-to-r ${context.colorScheme.gradient} px-2.5 py-1 text-[11px] font-medium text-white`}
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-widest text-slate-500">
        {k}
      </dt>
      <dd className="mt-0.5 truncate font-mono text-xs text-slate-100">{v}</dd>
    </div>
  );
}

function RawMcpPanel({ raw }: { raw: EnrichedTravelContext }) {
  return (
    <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:p-5">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200 marker:hidden">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
          Payload MCP en bruto · {raw.destination}
          <span className="ml-2 text-[10px] uppercase tracking-widest text-slate-500 group-open:hidden">
            Expandir
          </span>
        </span>
      </summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-[11px] leading-relaxed text-slate-300">
        {JSON.stringify(raw, null, 2)}
      </pre>
    </details>
  );
}
