"use client";

/**
 * CalorieTracker widget — circular progress + macro breakdown for a daily
 * calorie target.
 *
 * Expected `data` shape:
 *   {
 *     targetKcal: number;
 *     consumedKcal?: number;
 *     macros?: { protein: number; carbs: number; fats: number };
 *   }
 */

import { motion } from "framer-motion";
import { Flame, Drumstick, Wheat, Droplet } from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

interface CalorieData {
  targetKcal: number;
  consumedKcal: number;
  macros?: { protein: number; carbs: number; fats: number };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMacros(value: unknown): CalorieData["macros"] {
  if (!isRecord(value)) return undefined;
  const { protein, carbs, fats } = value;
  if (
    typeof protein !== "number" ||
    typeof carbs !== "number" ||
    typeof fats !== "number"
  ) {
    return undefined;
  }
  return { protein, carbs, fats };
}

function parseCalorieData(data: unknown): CalorieData | null {
  if (!isRecord(data)) return null;
  const { targetKcal, consumedKcal, macros } = data;
  if (typeof targetKcal !== "number" || targetKcal <= 0) return null;
  return {
    targetKcal,
    consumedKcal: typeof consumedKcal === "number" ? consumedKcal : 0,
    macros: parseMacros(macros),
  };
}

const CIRCUMFERENCE = 2 * Math.PI * 52;

export default function CalorieTracker({ context, data }: WidgetProps) {
  const parsed = parseCalorieData(data);
  const { colorScheme } = context;

  if (!parsed) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-label="Cargando calorías"
      >
        <div className="flex items-center gap-3 mb-5 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-200" />
        </div>
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-32 w-32 rounded-full bg-slate-200" />
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  const { targetKcal, consumedKcal, macros } = parsed;
  const ratio = Math.min(consumedKcal / targetKcal, 1);
  const remaining = Math.max(targetKcal - consumedKcal, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Seguimiento de calorías"
    >
      <header className="flex items-center gap-3 mb-5">
        <div
          className={`grid place-items-center h-9 w-9 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <Flame className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Calorías</h3>
      </header>

      <div className="flex flex-col items-center gap-5">
        <div className="relative h-32 w-32">
          <svg
            viewBox="0 0 120 120"
            className="h-32 w-32 -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r="52"
              className="fill-none stroke-slate-100"
              strokeWidth="12"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              className={`fill-none ${colorScheme.accent}`}
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{
                strokeDashoffset: CIRCUMFERENCE * (1 - ratio),
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            aria-live="polite"
          >
            <span className="text-2xl font-bold text-slate-900 leading-none">
              {Math.round(consumedKcal)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              de {targetKcal} kcal
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {remaining > 0 ? `${remaining} restantes` : "objetivo alcanzado"}
            </span>
          </div>
        </div>

        {macros ? (
          <dl className="grid grid-cols-3 gap-2 w-full">
            <MacroPill
              icon={<Drumstick className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Proteína"
              value={macros.protein}
              accent={colorScheme.primary}
            />
            <MacroPill
              icon={<Wheat className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Carbos"
              value={macros.carbs}
              accent={colorScheme.secondary}
            />
            <MacroPill
              icon={<Droplet className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Grasas"
              value={macros.fats}
              accent={colorScheme.primary}
            />
          </dl>
        ) : null}
      </div>
    </motion.section>
  );
}

function MacroPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
      <span
        className={`inline-grid place-items-center h-6 w-6 rounded-full text-white mb-1 ${accent}`}
      >
        {icon}
      </span>
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-slate-900">{value}g</dd>
    </div>
  );
}
