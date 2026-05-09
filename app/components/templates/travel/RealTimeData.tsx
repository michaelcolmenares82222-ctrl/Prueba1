"use client";

/**
 * "Datos en tiempo real" block — only rendered when the travel plan was
 * generated via `generateTravelPlanEnriched` (i.e. when `plan.realData` is
 * present). Pure presentational; degrades gracefully when individual MCP
 * calls returned `null`.
 */

import { Cloud, MapPin, BookOpen, ExternalLink } from "lucide-react";

import type { TravelRealTimeData } from "../types";

interface RealTimeDataProps {
  data: TravelRealTimeData;
}

export function RealTimeData({ data }: RealTimeDataProps) {
  const { weather, wiki, topPlaces } = data;
  const hasAny = Boolean(weather || wiki || (topPlaces && topPlaces.length > 0));

  if (!hasAny) return null;

  const updatedAt = formatTimestamp(data.timestamp);

  return (
    <section
      aria-label="Datos en tiempo real"
      className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm"
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Datos en tiempo real
          </h2>
          <p className="text-xs text-slate-500">
            Open-Meteo · Wikipedia · OpenStreetMap
          </p>
        </div>
        {updatedAt && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-emerald-700">
            Actualizado {updatedAt}
          </span>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {weather && <WeatherBlock weather={weather} />}
        {wiki && <WikiBlock wiki={wiki} />}
        {topPlaces && topPlaces.length > 0 && (
          <PlacesBlock places={topPlaces} />
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-blocks
// ---------------------------------------------------------------------------

function WeatherBlock({ weather }: { weather: NonNullable<TravelRealTimeData["weather"]> }) {
  const days = (weather.forecast ?? []).slice(0, 7);
  return (
    <article className="rounded-xl border border-blue-100 bg-white/80 p-4 backdrop-blur">
      <header className="mb-3 flex items-center gap-2">
        <Cloud className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Clima en {weather.location}
        </h3>
      </header>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">
          {Math.round(weather.temperature)}°C
        </span>
        <span className="text-sm text-slate-600">{weather.description}</span>
      </div>
      <p className="text-xs text-slate-500">
        Sensación {Math.round(weather.feelsLike)}°C · Humedad {weather.humidity}
        % · Viento {Math.round(weather.windSpeed)} km/h
      </p>

      {days.length > 0 && (
        <ul
          className="mt-4 grid grid-cols-7 gap-1.5"
          aria-label="Pronóstico de 7 días"
        >
          {days.map((d) => (
            <li
              key={d.date}
              className="rounded-lg bg-blue-50 px-1.5 py-2 text-center"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                {shortDay(d.date)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                {Math.round(d.tempMax)}°
              </p>
              <p className="text-[10px] text-slate-500">
                {Math.round(d.tempMin)}°
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function WikiBlock({ wiki }: { wiki: NonNullable<TravelRealTimeData["wiki"]> }) {
  return (
    <article className="rounded-xl border border-purple-100 bg-white/80 p-4 backdrop-blur">
      <header className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-slate-900">{wiki.title}</h3>
      </header>
      <p className="mb-3 text-xs leading-relaxed text-slate-700 line-clamp-6">
        {wiki.extract}
      </p>
      <a
        href={wiki.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:text-purple-900"
      >
        Leer en Wikipedia <ExternalLink className="h-3 w-3" />
      </a>
    </article>
  );
}

function PlacesBlock({
  places,
}: {
  places: TravelRealTimeData["topPlaces"];
}) {
  return (
    <article className="rounded-xl border border-emerald-100 bg-white/80 p-4 backdrop-blur md:col-span-2">
      <header className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Top lugares cercanos
        </h3>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {places.slice(0, 6).map((p) => (
          <li
            key={`${p.name}-${p.lat}-${p.lon}`}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <p className="text-sm font-semibold text-slate-900">{p.name}</p>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
              {p.address}
            </p>
            <p className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              {p.type}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHORT_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function shortDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return SHORT_DAYS[d.getDay()] ?? iso;
}

function formatTimestamp(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
