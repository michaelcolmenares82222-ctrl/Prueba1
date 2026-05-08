import { NextRequest, NextResponse } from "next/server";
import { detectIntent } from "@/lib/intent-detection";
import { extractContext } from "@/lib/context-extraction";
import { checkRateLimit } from "@/lib/groq";
import { z } from "zod";

// ============================================
// Request Schema
// ============================================

const AnalyzeRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long"),
  userId: z.string().optional(), // Para rate limiting
});

// ============================================
// POST /api/analyze
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse y valida request body
    const body = await request.json();
    const { message, userId = "anonymous" } =
      AnalyzeRequestSchema.parse(body);

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

    // Step 1: Detect intent
    const intentResult = await detectIntent(message);

    if (intentResult.confidence < 0.5) {
      console.warn(
        "⚠️ Low confidence detection, using generic fallback"
      );
    }

    // Step 2: Extract context
    const context = await extractContext(intentResult.intent, message);

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

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in /api/analyze:", error);

    // Errores de validación de Zod
    if (error?.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: error.errors ?? error.issues,
        },
        { status: 400 }
      );
    }

    // Otros errores
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
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
      message: "string (required, 1-1000 chars)",
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
