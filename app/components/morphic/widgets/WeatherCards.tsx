"use client";

/**
 * WeatherCards widget — compact daily forecast cards.
 *
 * Expected `data` shape:
 *   { days: Array<{
 *       day: string;            // e.g. "Lun" or "12 Ago"
 *       condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'wind';
 *       tempC: number;
 *       tempMinC?: number;
 *       tempMaxC?: number;
 *     }>
 *   }
 */

import { motion } from "framer-motion";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

const CONDITIONS = ["sunny", "cloudy", "rain", "snow", "storm", "wind"] as const;
type WeatherCondition = (typeof CONDITIONS)[number];

interface WeatherDay {
  day: string;
  condition: WeatherCondition;
  tempC: number;
  tempMinC?: number;
  tempMaxC?: number;
}

const ICON_BY_CONDITION: Record<WeatherCondition, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  wind: Wind,
};

const LABEL_BY_CONDITION: Record<WeatherCondition, string> = {
  sunny: "Soleado",
  cloudy: "Nublado",
  rain: "Lluvia",
  snow: "Nieve",
  storm: "Tormenta",
  wind: "Viento",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCondition(value: unknown): WeatherCondition | null {
  return typeof value === "string" &&
    (CONDITIONS as readonly string[]).includes(value)
    ? (value as WeatherCondition)
    : null;
}

function parseDay(value: unknown): WeatherDay | null {
  if (!isRecord(value)) return null;
  const { day, condition, tempC, tempMinC, tempMaxC } = value;
  if (typeof day !== "string" || day.length === 0) return null;
  if (typeof tempC !== "number") return null;
  const cond = parseCondition(condition);
  if (!cond) return null;
  return {
    day,
    condition: cond,
    tempC,
    tempMinC: typeof tempMinC === "number" ? tempMinC : undefined,
    tempMaxC: typeof tempMaxC === "number" ? tempMaxC : undefined,
  };
}

function parseWeatherData(data: unknown): WeatherDay[] | null {
  if (!isRecord(data)) return null;
  const { days } = data;
  if (!Array.isArray(days)) return null;
  const parsed = days
    .map(parseDay)
    .filter((d): d is WeatherDay => d !== null);
  return parsed.length > 0 ? parsed : null;
}

export default function WeatherCards({ context, data }: WidgetProps) {
  const days = parseWeatherData(data);
  const { colorScheme } = context;

  if (!days) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-label="Cargando pronóstico"
      >
        <div className="flex items-center gap-3 mb-5 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 animate-pulse">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Pronóstico del tiempo"
    >
      <header className="flex items-center gap-3 mb-5">
        <div
          className={`grid place-items-center h-9 w-9 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <Sun className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Pronóstico
        </h3>
      </header>

      <ul
        className="grid grid-cols-3 sm:grid-cols-5 gap-2"
        role="list"
      >
        {days.map((d, index) => {
          const Icon = ICON_BY_CONDITION[d.condition];
          return (
            <motion.li
              key={`${index}-${d.day}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative rounded-xl p-3 text-white text-center bg-gradient-to-br ${colorScheme.gradient}`}
              aria-label={`${d.day}: ${LABEL_BY_CONDITION[d.condition]}, ${Math.round(d.tempC)} grados`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide opacity-90">
                {d.day}
              </p>
              <Icon
                className="h-7 w-7 mx-auto my-1.5"
                aria-hidden="true"
              />
              <p className="text-lg font-bold leading-none">
                {Math.round(d.tempC)}°
              </p>
              {(typeof d.tempMinC === "number" ||
                typeof d.tempMaxC === "number") && (
                <p className="text-[10px] opacity-90 mt-1">
                  {typeof d.tempMinC === "number"
                    ? `${Math.round(d.tempMinC)}°`
                    : "–"}
                  {" / "}
                  {typeof d.tempMaxC === "number"
                    ? `${Math.round(d.tempMaxC)}°`
                    : "–"}
                </p>
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
