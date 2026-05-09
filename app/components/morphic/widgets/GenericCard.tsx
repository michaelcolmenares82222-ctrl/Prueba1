"use client";

/**
 * GenericCard widget — a graceful, generic fallback shown when no specialised
 * widget matches a context entry, or when payload data is missing.
 *
 * Expected `data` shape (all fields optional):
 *   {
 *     title?: string;
 *     description?: string;
 *     bullets?: string[];
 *     footnote?: string;
 *   }
 */

import { motion } from "framer-motion";
import { Sparkles, Info } from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

interface GenericCardData {
  title?: string;
  description?: string;
  bullets?: string[];
  footnote?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function parseGenericCardData(data: unknown): GenericCardData | null {
  if (!isRecord(data)) return null;
  const { title, description, bullets, footnote } = data;
  if (
    title === undefined &&
    description === undefined &&
    bullets === undefined &&
    footnote === undefined
  ) {
    return null;
  }
  return {
    title: typeof title === "string" ? title : undefined,
    description: typeof description === "string" ? description : undefined,
    bullets: isStringArray(bullets) ? bullets : undefined,
    footnote: typeof footnote === "string" ? footnote : undefined,
  };
}

export default function GenericCard({ context, data }: WidgetProps) {
  const parsed = parseGenericCardData(data);
  const { colorScheme } = context;

  if (!parsed) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse"
        role="status"
        aria-label="Cargando contenido"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-slate-200" />
          <div className="flex-1 h-4 rounded bg-slate-200" />
        </div>
        <div className="h-3 w-5/6 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-2/3 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
      aria-labelledby={parsed.title ? "generic-card-title" : undefined}
    >
      <header className="flex items-start gap-3 mb-3">
        <div
          className={`flex-shrink-0 grid place-items-center h-10 w-10 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {parsed.title ? (
            <h3
              id="generic-card-title"
              className="text-base font-semibold text-slate-900 leading-tight"
            >
              {parsed.title}
            </h3>
          ) : null}
          {parsed.description ? (
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              {parsed.description}
            </p>
          ) : null}
        </div>
      </header>

      {parsed.bullets && parsed.bullets.length > 0 ? (
        <ul className="space-y-2 mt-4" role="list">
          {parsed.bullets.map((item, index) => (
            <motion.li
              key={`${index}-${item.slice(0, 16)}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className="flex items-start gap-2 text-sm text-slate-700"
            >
              <span
                className={`mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${colorScheme.primary}`}
                aria-hidden="true"
              />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      ) : null}

      {parsed.footnote ? (
        <footer className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{parsed.footnote}</span>
        </footer>
      ) : null}
    </motion.article>
  );
}
