import { NextRequest, NextResponse } from "next/server";
import {
  getWeather,
  searchPlaces,
  getNearbyAttractions,
  getExchangeRate,
  convertBudget,
  getWikipediaInfo,
  enrichTravelContext,
} from "@/lib/mcp";

/**
 * Dynamic POST endpoint for the MCP toolbox.
 *
 * In Next.js 16 the `params` argument is a Promise that must be awaited
 * (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`).
 *
 * Tools:
 *   POST /api/mcp/weather       { city }
 *   POST /api/mcp/places        { query, city? }            (also accepts { lat, lon, radius? } for nearby)
 *   POST /api/mcp/exchange      { from, to, amount? } | { amount, fromCurrency, toCurrency } for convert
 *   POST /api/mcp/wikipedia     { query, language? }
 *   POST /api/mcp/enrichTravel  { destination, userCurrency? }
 */

type ToolName =
  | "weather"
  | "places"
  | "exchange"
  | "wikipedia"
  | "enrichTravel";

const KNOWN_TOOLS: ToolName[] = [
  "weather",
  "places",
  "exchange",
  "wikipedia",
  "enrichTravel",
];

function isKnownTool(name: string): name is ToolName {
  return (KNOWN_TOOLS as string[]).includes(name);
}

function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const raw = (await request.json()) as unknown;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;

  if (!isKnownTool(tool)) {
    return fail(`Unknown MCP tool: "${tool}"`, 404);
  }

  const body = await readBody(request);

  try {
    switch (tool) {
      case "weather": {
        const city = asString(body.city);
        if (!city) return fail("Missing required field: city");
        const data = await getWeather(city);
        return data ? ok(data) : fail("Weather lookup failed", 502);
      }

      case "places": {
        const lat = asNumber(body.lat);
        const lon = asNumber(body.lon);

        // If caller provided coords, treat as "nearby attractions" call.
        if (lat !== null && lon !== null) {
          const radius = asNumber(body.radius) ?? 5000;
          const data = await getNearbyAttractions(lat, lon, radius);
          return ok(data);
        }

        const query = asString(body.query);
        if (!query) {
          return fail(
            "Missing required field: query (or provide lat/lon for nearby search)"
          );
        }
        const city = asString(body.city) ?? undefined;
        const data = await searchPlaces(query, city);
        return ok(data);
      }

      case "exchange": {
        // Two shapes: { from, to, amount? }  OR  { amount, fromCurrency, toCurrency } for convertBudget.
        const fromCurrency = asString(body.fromCurrency);
        const toCurrency = asString(body.toCurrency);
        const convertAmount = asNumber(body.amount);

        if (fromCurrency && toCurrency && convertAmount !== null) {
          const converted = await convertBudget(
            convertAmount,
            fromCurrency,
            toCurrency
          );
          return converted === null
            ? fail("Currency conversion failed", 502)
            : ok({
                amount: convertAmount,
                from: fromCurrency.toUpperCase(),
                to: toCurrency.toUpperCase(),
                converted,
              });
        }

        const from = asString(body.from);
        const to = asString(body.to);
        if (!from || !to) {
          return fail(
            "Missing required fields: from, to (and optional amount)"
          );
        }
        const amount = asNumber(body.amount) ?? 1;
        const data = await getExchangeRate(from, to, amount);
        return data ? ok(data) : fail("Exchange rate lookup failed", 502);
      }

      case "wikipedia": {
        const query = asString(body.query);
        if (!query) return fail("Missing required field: query");
        const language = asString(body.language) ?? "es";
        const data = await getWikipediaInfo(query, language);
        return data ? ok(data) : fail("Wikipedia lookup failed", 404);
      }

      case "enrichTravel": {
        const destination = asString(body.destination);
        if (!destination) {
          return fail("Missing required field: destination");
        }
        const userCurrency = asString(body.userCurrency) ?? "USD";
        const data = await enrichTravelContext(destination, userCurrency);
        return ok(data);
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error(`[mcp:${tool}] Internal error:`, err);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;
  return NextResponse.json({
    endpoint: `/api/mcp/${tool}`,
    method: "POST",
    knownTools: KNOWN_TOOLS,
    note: "Send a JSON body. See route.ts for per-tool field requirements.",
  });
}
