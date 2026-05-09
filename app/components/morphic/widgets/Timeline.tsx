"use client";

/**
 * Timeline widget — vertical timeline of dated/ordered items.
 *
 * Expected `data` shape:
 *   { items: Array<{
 *       title: string;
 *       description?: string;
 *       date?: string;
 *       time?: string;
 *       tag?: string;
 *     }>
 *   }
 *
 * Used by travel, fitness and dev domains.
 */

import { motion } from "framer-motion";
import { CalendarClock, Clock } from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

interface TimelineItem {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  tag?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseItem(value: unknown): TimelineItem | null {
  if (!isRecord(value)) return null;
  const { title, description, date, time, tag } = value;
  if (typeof title !== "string" || title.length === 0) return null;
  return {
    title,
    description: typeof description === "string" ? description : undefined,
    date: typeof date === "string" ? date : undefined,
    time: typeof time === "string" ? time : undefined,
    tag: typeof tag === "string" ? tag : undefined,
  };
}

function parseTimelineData(data: unknown): TimelineItem[] | null {
  if (!isRecord(data)) return null;
  const { items } = data;
  if (!Array.isArray(items)) return null;
  const parsed = items
    .map(parseItem)
    .filter((it): it is TimelineItem => it !== null);
  return parsed.length > 0 ? parsed : null;
}

export default function Timeline({ context, data }: WidgetProps) {
  const items = parseTimelineData(data);
  const { colorScheme } = context;

  if (!items) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-label="Cargando línea de tiempo"
      >
        <div className="flex items-center gap-2 mb-5 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
        <ol className="space-y-5">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-4 animate-pulse">
              <div className="mt-1 h-3 w-3 rounded-full bg-slate-200" />
              <div className="flex-1">
                <div className="h-3 w-1/3 rounded bg-slate-200 mb-2" />
                <div className="h-3 w-2/3 rounded bg-slate-200" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Línea de tiempo"
    >
      <header className="flex items-center gap-3 mb-5">
        <div
          className={`grid place-items-center h-9 w-9 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <CalendarClock className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Línea de tiempo
        </h3>
      </header>

      <ol className="relative pl-6 border-l-2 border-slate-200 space-y-5">
        {items.map((item, index) => (
          <motion.li
            key={`${index}-${item.title}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="relative"
          >
            <span
              className={`absolute -left-[31px] top-1 grid place-items-center h-4 w-4 rounded-full ring-4 ring-white ${colorScheme.primary}`}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <h4 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h4>
              {item.tag ? (
                <span
                  className={`inline-flex items-center text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full text-white ${colorScheme.secondary}`}
                >
                  {item.tag}
                </span>
              ) : null}
            </div>
            {(item.date || item.time) && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>
                  {[item.date, item.time].filter(Boolean).join(" · ")}
                </span>
              </p>
            )}
            {item.description ? (
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            ) : null}
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}
