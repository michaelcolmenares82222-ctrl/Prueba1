export type TravelStyleCanon = "budget" | "standard" | "luxury";

/**
 * Maps free-form model / user phrases to canonical travelStyle values.
 * Tool APIs send this as a plain string; we normalize here before business logic.
 */
export function coerceTravelStyle(raw: unknown): TravelStyleCanon {
  if (raw == null || raw === "") return "standard";
  if (typeof raw !== "string") return "standard";

  const s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  if (
    [
      "budget",
      "cheap",
      "low",
      "low-cost",
      "lowcost",
      "barato",
      "economico",
      "asequible",
      "bajo",
    ].includes(s)
  ) {
    return "budget";
  }

  if (
    [
      "luxury",
      "premium",
      "high-end",
      "highend",
      "lujo",
      "lujoso",
      "alto",
      "high",
    ].includes(s)
  ) {
    return "luxury";
  }

  if (
    [
      "standard",
      "default",
      "normal",
      "mid",
      "midrange",
      "mid-range",
      "moderate",
      "intermedio",
      "moderado",
      "medio",
      "estandar",
      "standar",
      "middle",
      "medium",
      "balanced",
      "equilibrado",
    ].includes(s)
  ) {
    return "standard";
  }

  return "standard";
}
