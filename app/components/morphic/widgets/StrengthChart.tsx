"use client";

/**
 * StrengthChart widget — horizontal bar chart of weights lifted across a set
 * of exercises, ideal for fitness/strength contexts.
 *
 * Expected `data` shape:
 *   { exercises: Array<{
 *       name: string;
 *       weightKg: number;
 *       sets?: number;
 *       reps?: number | string;
 *     }>
 *   }
 */

import { motion } from "framer-motion";
import { Dumbbell, TrendingUp } from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

interface ExerciseEntry {
  name: string;
  weightKg: number;
  sets?: number;
  reps?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseExercise(value: unknown): ExerciseEntry | null {
  if (!isRecord(value)) return null;
  const { name, weightKg, sets, reps } = value;
  if (typeof name !== "string" || name.length === 0) return null;
  if (typeof weightKg !== "number" || weightKg < 0) return null;
  return {
    name,
    weightKg,
    sets: typeof sets === "number" ? sets : undefined,
    reps:
      typeof reps === "number"
        ? String(reps)
        : typeof reps === "string"
        ? reps
        : undefined,
  };
}

function parseStrengthData(data: unknown): ExerciseEntry[] | null {
  if (!isRecord(data)) return null;
  const { exercises } = data;
  if (!Array.isArray(exercises)) return null;
  const parsed = exercises
    .map(parseExercise)
    .filter((ex): ex is ExerciseEntry => ex !== null);
  return parsed.length > 0 ? parsed : null;
}

export default function StrengthChart({ context, data }: WidgetProps) {
  const exercises = parseStrengthData(data);
  const { colorScheme } = context;

  if (!exercises) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-label="Cargando gráfico de fuerza"
      >
        <div className="flex items-center gap-3 mb-5 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
        <ul className="space-y-3 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="space-y-1">
              <div className="h-3 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded-full bg-slate-100" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const max = Math.max(...exercises.map((ex) => ex.weightKg), 1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Cargas por ejercicio"
    >
      <header className="flex items-center gap-3 mb-5">
        <div
          className={`grid place-items-center h-9 w-9 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Cargas por ejercicio
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            Máximo: {max} kg
          </p>
        </div>
      </header>

      <ul className="space-y-3" role="list">
        {exercises.map((ex, index) => {
          const ratio = ex.weightKg / max;
          return (
            <li key={`${index}-${ex.name}`} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800 truncate">
                  {ex.name}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {ex.weightKg} kg
                </span>
              </div>
              <div
                className="relative h-3 rounded-full bg-slate-100 overflow-hidden"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={ex.weightKg}
                aria-label={`${ex.name} — ${ex.weightKg} kilogramos`}
              >
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${ratio * 100}%` }}
                  transition={{ delay: index * 0.07, duration: 0.6, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colorScheme.gradient}`}
                />
              </div>
              {(ex.sets || ex.reps) && (
                <p className="text-[11px] text-slate-500">
                  {ex.sets ? `${ex.sets} series` : null}
                  {ex.sets && ex.reps ? " · " : null}
                  {ex.reps ? `${ex.reps} reps` : null}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
