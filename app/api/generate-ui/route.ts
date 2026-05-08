import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateTravelUI,
  generateDevUI,
  generateFitnessUI,
} from "@/lib/ui-generators";
import {
  TravelContextSchema,
  DevContextSchema,
  FitnessContextSchema,
} from "@/lib/schemas";
import { checkRateLimit } from "@/lib/groq";
import { stripNullish } from "@/lib/args-utils";

const GenerateUISchema = z.object({
  intent: z.enum(["travel", "development", "fitness"]),
  context: z.record(z.unknown()),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { intent, context, userId = "anonymous" } =
      GenerateUISchema.parse(body);

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limit excedido. Intenta de nuevo en un minuto." },
        { status: 429 }
      );
    }

    const cleanContext = stripNullish(context);

    let result;
    if (intent === "travel") {
      const ctx = TravelContextSchema.parse(cleanContext);
      result = await generateTravelUI(ctx);
    } else if (intent === "fitness") {
      const ctx = FitnessContextSchema.parse(cleanContext);
      result = await generateFitnessUI(ctx);
    } else {
      const ctx = DevContextSchema.parse(cleanContext);
      result = await generateDevUI(ctx);
    }

    return NextResponse.json(
      {
        success: true,
        intent: result.type,
        content: result.content,
        context: result.context,
        generatedAt: result.generatedAt,
        metadata: {
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in /api/generate-ui:", error);

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
