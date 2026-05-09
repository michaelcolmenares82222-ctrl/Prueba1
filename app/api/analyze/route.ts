import { NextRequest, NextResponse } from "next/server";
import { detectIntent } from "@/lib/intent-detection";
import { extractContext } from "@/lib/context-extraction";
import { checkRateLimit } from "@/lib/groq";
import type { IntentType } from "@/lib/types";
import { z } from "zod";
// Perf logs: silence with PERF_LOG=0.
import { logStep, perfStart } from "@/lib/perf-log";

// ============================================
// Request Schema
// ============================================

const IntentHintSchema = z.enum(["travel", "fitness", "development"]);

const AnalyzeRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long"),
  userId: z.string().optional(),
  /** Si el cliente ya sabe el intent (conversación guiada), evita clasificar mal mensajes cortos. */
  intentHint: IntentHintSchema.optional(),
  /** Datos ya recopilados en el cliente; se antepone al mensaje para extracción incremental. */
  priorContext: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// POST /api/analyze
// ============================================

export async function POST(request: NextRequest) {
  const startTime = perfStart();

  try {
    // Parse y valida request body
    const body = await request.json();
    const {
      message,
      userId = "anonymous",
      intentHint,
      priorContext,
    } = AnalyzeRequestSchema.parse(body);

    console.log(`📥 Analyzing message from ${userId}:`, message);

    // Rate limiting check
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please try again in a minute.",
        },
        { status: 429 }
      );
    }

    const contextualMessage =
      priorContext && Object.keys(priorContext).length > 0
        ? [
            "=== Datos ya recopilados (JSON) ===",
            JSON.stringify(priorContext, null, 2),
            "",
            "=== Nuevo mensaje del usuario ===",
            message,
          ].join("\n")
        : message;

    // Step 1: Detect intent (o usar hint del cliente en modo conversacional)
    const intentResult = intentHint
      ? {
          intent: intentHint as IntentType,
          confidence: 1,
          reasoning: "intentHint from client (progressive conversation)",
        }
      : await detectIntent(contextualMessage);

    if (!intentHint && intentResult.confidence < 0.5) {
      console.warn(
        "⚠️ Low confidence detection, using generic fallback"
      );
    }

    // Step 2: Extract context
    const context = await extractContext(
      intentResult.intent,
      contextualMessage
    );

    // Response
    const response = {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      reasoning: intentResult.reasoning,
      context,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(
      `✅ Analysis complete in ${response.metadata.processingTimeMs}ms`
    );
    logStep("analyze:POST", startTime, {
      intent: intentResult.intent,
      hint: intentHint ? "yes" : "no",
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error in /api/analyze:", error);
    logStep("analyze:POST:error", startTime);

    // Errores de validación de Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Otros errores
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Internal server error",
        message,
      },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONS - CORS preflight
// ============================================

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

// ============================================
// GET - Endpoint info
// ============================================

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/analyze",
    method: "POST",
    description:
      "Analyzes user input to detect intent and extract context",
    requestBody: {
      message: "string (required, 1-2000 chars)",
      intentHint: "travel | fitness | development (optional)",
      priorContext: "object (optional, progressive merge)",
      userId: "string (optional, for rate limiting)",
    },
    responseFields: {
      intent: "travel | development | fitness | learning | generic",
      confidence: "number (0-1)",
      reasoning: "string (optional explanation)",
      context: "object (structured data based on intent)",
      metadata: {
        processingTimeMs: "number",
        timestamp: "ISO string",
      },
    },
    exampleRequest: {
      message: "Quiero viajar a Japón por una semana",
      userId: "user123",
    },
  });
}
