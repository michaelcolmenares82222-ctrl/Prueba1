"use client";

/**
 * RouteMap widget — schematic horizontal route showing the ordered stops of
 * a road trip / adventure travel plan.
 *
 * Expected `data` shape:
 *   { stops: Array<{
 *       name: string;
 *       description?: string;
 *       distanceKm?: number;
 *       drivingHours?: number;
 *     }>
 *   }
 */

import { motion } from "framer-motion";
import { MapPin, Navigation, Route as RouteIcon } from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

interface RouteStop {
  name: string;
  description?: string;
  distanceKm?: number;
  drivingHours?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStop(value: unknown): RouteStop | null {
  if (!isRecord(value)) return null;
  const { name, description, distanceKm, drivingHours } = value;
  if (typeof name !== "string" || name.length === 0) return null;
  return {
    name,
    description: typeof description === "string" ? description : undefined,
    distanceKm: typeof distanceKm === "number" ? distanceKm : undefined,
    drivingHours: typeof drivingHours === "number" ? drivingHours : undefined,
  };
}

function parseRouteData(data: unknown): RouteStop[] | null {
  if (!isRecord(data)) return null;
  const { stops } = data;
  if (!Array.isArray(stops)) return null;
  const parsed = stops
    .map(parseStop)
    .filter((s): s is RouteStop => s !== null);
  return parsed.length > 0 ? parsed : null;
}

export default function RouteMap({ context, data }: WidgetProps) {
  const stops = parseRouteData(data);
  const { colorScheme } = context;

  if (!stops) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-label="Cargando ruta"
      >
        <div className="flex items-center gap-3 mb-5 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
        </div>
        <div className="flex items-center gap-2 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-slate-200" />
              {i < 3 ? <div className="h-0.5 w-10 bg-slate-200" /> : null}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5 animate-pulse">
          <div className="h-12 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  const totalKm = stops.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);
  const totalHr = stops.reduce((sum, s) => sum + (s.drivingHours ?? 0), 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Ruta del viaje"
    >
      <header className="flex items-center gap-3 mb-5">
        <div
          className={`grid place-items-center h-9 w-9 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <RouteIcon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Ruta</h3>
      </header>

      <ol
        className="flex items-center gap-2 overflow-x-auto pb-2"
        aria-label="Paradas de la ruta"
      >
        {stops.map((stop, index) => (
          <li key={`${index}-${stop.name}`} className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.08 }}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`grid place-items-center h-8 w-8 rounded-full text-white shadow ${colorScheme.primary}`}
                aria-label={`Parada ${index + 1}: ${stop.name}`}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium text-slate-700 max-w-[80px] text-center truncate">
                {stop.name}
              </span>
            </motion.div>
            {index < stops.length - 1 ? (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.08 + 0.05 }}
                className={`origin-left h-0.5 w-12 ${colorScheme.secondary}`}
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>

      {(totalKm > 0 || totalHr > 0) && (
        <dl className="grid grid-cols-2 gap-3 mt-5">
          {totalKm > 0 ? (
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                Distancia
              </dt>
              <dd className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Navigation className={`h-3.5 w-3.5 ${colorScheme.accent}`} aria-hidden="true" />
                {totalKm.toLocaleString()} km
              </dd>
            </div>
          ) : null}
          {totalHr > 0 ? (
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                Conducción
              </dt>
              <dd className="text-sm font-semibold text-slate-900 mt-0.5">
                {totalHr.toFixed(1)} h
              </dd>
            </div>
          ) : null}
        </dl>
      )}

      {stops.some((s) => s.description) && (
        <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
          {stops
            .filter((s) => s.description)
            .map((stop, index) => (
              <li
                key={`desc-${index}-${stop.name}`}
                className="text-xs text-slate-600"
              >
                <span className="font-semibold text-slate-800">
                  {stop.name}:
                </span>{" "}
                {stop.description}
              </li>
            ))}
        </ul>
      )}
    </motion.section>
  );
}
