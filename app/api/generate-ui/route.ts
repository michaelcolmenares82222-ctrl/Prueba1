import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateTravelUI,
  generateTravelPlanEnriched,
  generateDevUI,
  generateFitnessUI,
} from "@/lib/ui-generators";
import type { EnrichedTravelContext } from "@/lib/mcp";
import {
  TravelContextSchema,
  DevContextSchema,
  FitnessContextSchema,
} from "@/lib/schemas";
import { checkRateLimit } from "@/lib/groq";
import { stripNullish } from "@/lib/args-utils";
// Perf logs: silence with PERF_LOG=0.
import { logStep, perfStart } from "@/lib/perf-log";

const GenerateUISchema = z.object({
  intent: z.enum(["travel", "development", "fitness"]),
  context: z.record(z.unknown()),
  userId: z.string().optional(),
});

// ============================================
// In-memory LRU-ish cache (per server process)
// ------------------------------------------------------------
// La generación es determinística-suficiente para reusar la
// misma respuesta cuando el contexto efectivo es idéntico.
// Esto convierte la 2ª/3ª regeneración del mismo plan en
// instantánea sin tocar el LLM. TTL corto y tope de entradas
// para no crecer sin límite.
// ============================================
type CacheEntry = {
  expiresAt: number;
  payload: {
    intent: "travel" | "development" | "fitness";
    content: string;
    context: unknown;
    generatedAt: string;
    realData?: EnrichedTravelContext;
  };
};

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 min
const CACHE_MAX_ENTRIES = 50;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

function cacheKey(intent: string, ctx: unknown): string {
  return `${intent}:${stableStringify(ctx)}`;
}

function getCached(key: string): CacheEntry["payload"] | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

function setCached(key: string, payload: CacheEntry["payload"]): void {
  if (CACHE.size >= CACHE_MAX_ENTRIES) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
  CACHE.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function POST(request: NextRequest) {
  const startTime = perfStart();

  try {
    const body = await request.json();
    const { intent, context, userId = "anonymous" } =
      GenerateUISchema.parse(body);

    const cleanContext = stripNullish(context);

    const key = cacheKey(intent, cleanContext);
    const cached = getCached(key);
    if (cached) {
      logStep("generate-ui:POST", startTime, { intent, cache: "hit" });
      return NextResponse.json(
        {
          success: true,
          intent: cached.intent,
          content: cached.content,
          context: cached.context,
          generatedAt: cached.generatedAt,
          ...(cached.realData ? { realData: cached.realData } : {}),
          metadata: {
            processingTimeMs: Date.now() - startTime,
            cached: true,
          },
        },
        { status: 200 }
      );
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limit excedido. Intenta de nuevo en un minuto." },
        { status: 429 }
      );
    }

    // Opt-in MCP enrichment for travel via NEXT_PUBLIC_ENABLE_MCP_ENRICHMENT.
    // Falls back transparently to the LLM-only plan if MCP fails (handled
    // inside generateTravelPlanEnriched via Promise.all + .catch → null).
    const enrichTravel =
      process.env.NEXT_PUBLIC_ENABLE_MCP_ENRICHMENT === "1";

    let result;
    let realData: EnrichedTravelContext | undefined;
    if (intent === "travel") {
      const ctx = TravelContextSchema.parse(cleanContext);
      if (enrichTravel) {
        const enriched = await generateTravelPlanEnriched(ctx);
        result = {
          type: enriched.type,
          context: enriched.context,
          content: enriched.content,
          generatedAt: enriched.generatedAt,
        };
        realData =
          "realData" in enriched
            ? (enriched.realData as EnrichedTravelContext | undefined)
            : undefined;
      } else {
        result = await generateTravelUI(ctx);
      }
    } else if (intent === "fitness") {
      const ctx = FitnessContextSchema.parse(cleanContext);
      result = await generateFitnessUI(ctx);
    } else {
      const ctx = DevContextSchema.parse(cleanContext);
      result = await generateDevUI(ctx);
    }

    setCached(key, {
      intent: result.type,
      content: result.content,
      context: result.context,
      generatedAt: result.generatedAt,
      ...(realData ? { realData } : {}),
    });

    logStep("generate-ui:POST", startTime, {
      intent,
      cache: "miss",
      enriched: intent === "travel" && enrichTravel ? true : undefined,
    });
    return NextResponse.json(
      {
        success: true,
        intent: result.type,
        content: result.content,
        context: result.context,
        generatedAt: result.generatedAt,
        ...(realData ? { realData } : {}),
        metadata: {
          processingTimeMs: Date.now() - startTime,
          cached: false,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in /api/generate-ui:", error);
    logStep("generate-ui:POST:error", startTime);

    const isZod =
      typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "ZodError";
    if (isZod) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details:
            (error as { issues?: unknown }).issues ??
            (error as { errors?: unknown }).errors,
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/generate-ui",
    method: "POST",
    description:
      "Generates rich UI content (itinerary / roadmap / fitness plan) using Groq.",
    requestBody: {
      intent: "travel | development | fitness",
      context: "validated object matching the corresponding Zod schema",
      userId: "string (optional, for rate limiting)",
    },
    responseFields: {
      success: "boolean",
      intent: "travel | development | fitness",
      content:
        "string – JSON document produced by Groq, parseable by lib/parsers.ts",
      context: "echoed input context (post Zod-defaults)",
      generatedAt: "ISO timestamp",
    },
  });
}
