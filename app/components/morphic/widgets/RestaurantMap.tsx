"use client";

/**
 * RestaurantMap widget — list of recommended restaurants with cuisine, price
 * range and rating. Visually accompanied by map-pin iconography to evoke a
 * map view without requiring an actual map provider.
 *
 * Expected `data` shape:
 *   { restaurants: Array<{
 *       name: string;
 *       cuisine?: string;
 *       priceRange?: '$' | '$$' | '$$$' | '$$$$';
 *       rating?: number;          // 0..5
 *       address?: string;
 *       reason?: string;
 *     }>
 *   }
 */

import { motion } from "framer-motion";
import { MapPin, Utensils, Star } from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"] as const;
type PriceRange = (typeof PRICE_RANGES)[number];

interface Restaurant {
  name: string;
  cuisine?: string;
  priceRange?: PriceRange;
  rating?: number;
  address?: string;
  reason?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePriceRange(value: unknown): PriceRange | undefined {
  return typeof value === "string" && (PRICE_RANGES as readonly string[]).includes(value)
    ? (value as PriceRange)
    : undefined;
}

function parseRestaurant(value: unknown): Restaurant | null {
  if (!isRecord(value)) return null;
  const { name, cuisine, priceRange, rating, address, reason } = value;
  if (typeof name !== "string" || name.length === 0) return null;
  return {
    name,
    cuisine: typeof cuisine === "string" ? cuisine : undefined,
    priceRange: parsePriceRange(priceRange),
    rating:
      typeof rating === "number" && rating >= 0 && rating <= 5
        ? rating
        : undefined,
    address: typeof address === "string" ? address : undefined,
    reason: typeof reason === "string" ? reason : undefined,
  };
}

function parseRestaurantData(data: unknown): Restaurant[] | null {
  if (!isRecord(data)) return null;
  const { restaurants } = data;
  if (!Array.isArray(restaurants)) return null;
  const parsed = restaurants
    .map(parseRestaurant)
    .filter((r): r is Restaurant => r !== null);
  return parsed.length > 0 ? parsed : null;
}

export default function RestaurantMap({ context, data }: WidgetProps) {
  const restaurants = parseRestaurantData(data);
  const { colorScheme } = context;

  if (!restaurants) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-label="Cargando recomendaciones gastronómicas"
      >
        <div className="flex items-center gap-3 mb-5 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
        </div>
        <ul className="space-y-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-3 items-start">
              <div className="h-9 w-9 rounded-full bg-slate-200" />
              <div className="flex-1">
                <div className="h-3 w-1/2 rounded bg-slate-200 mb-1" />
                <div className="h-3 w-1/3 rounded bg-slate-200" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Recomendaciones gastronómicas"
    >
      <header className="flex items-center gap-3 mb-5">
        <div
          className={`grid place-items-center h-9 w-9 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <Utensils className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Dónde comer
        </h3>
      </header>

      <ul className="space-y-3" role="list">
        {restaurants.map((r, index) => (
          <motion.li
            key={`${index}-${r.name}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className="flex gap-3 items-start rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors p-3"
          >
            <span
              className={`grid place-items-center h-9 w-9 rounded-full text-white flex-shrink-0 ${colorScheme.primary}`}
              aria-hidden="true"
            >
              <MapPin className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900 truncate">
                  {r.name}
                </h4>
                {typeof r.rating === "number" ? (
                  <span
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-700"
                    aria-label={`Valoración: ${r.rating.toFixed(1)} de 5`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${colorScheme.accent}`}
                      fill="currentColor"
                      aria-hidden="true"
                    />
                    {r.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                {r.cuisine ? <span>{r.cuisine}</span> : null}
                {r.priceRange ? (
                  <span className="font-semibold">{r.priceRange}</span>
                ) : null}
                {r.address ? <span className="truncate">· {r.address}</span> : null}
              </p>

              {r.reason ? (
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {r.reason}
                </p>
              ) : null}
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
