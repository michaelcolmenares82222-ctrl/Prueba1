import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateApp,
  refineApp,
  pickTemplateFromPrompt,
  GeneratedAppSchema,
  type GeneratedApp,
} from "@/lib/app-builder/code-generator";

// ============================================
// Route configuration
// ------------------------------------------------------------
// The free OpenRouter model can take 30-90s for a full app, so
// we mark this route as fully dynamic and disable Next caching.
// ============================================
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ============================================
// Request schema
// ============================================

const CreateRequestSchema = z.object({
  mode: z.literal("create"),
  prompt: z.string().min(1, "prompt is required").max(4000),
});

const RefineRequestSchema = z.object({
  mode: z.literal("refine"),
  currentApp: GeneratedAppSchema,
  feedback: z.string().min(1, "feedback is required").max(4000),
});

const BuildAppRequestSchema = z.discriminatedUnion("mode", [
  CreateRequestSchema,
  RefineRequestSchema,
]);

// ============================================
// POST /api/build-app
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = BuildAppRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  try {
    let app: GeneratedApp;

    if (parsed.data.mode === "create") {
      app = await generateApp(parsed.data.prompt);
    } else {
      app = await refineApp(parsed.data.currentApp, parsed.data.feedback);
    }

    return NextResponse.json(
      {
        success: true,
        app,
        metadata: {
          mode: parsed.data.mode,
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in /api/build-app:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    // Last-ditch fallback: never return a hard 500 in create mode if we
    // can salvage a sensible template — the demo experience matters.
    if (parsed.data.mode === "create") {
      const fallback = pickTemplateFromPrompt(parsed.data.prompt);
      return NextResponse.json(
        {
          success: true,
          app: fallback,
          metadata: {
            mode: "create",
            processingTimeMs: Date.now() - startTime,
            fallback: true,
            fallbackReason: message,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================
// GET — endpoint info
// ============================================

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/build-app",
    method: "POST",
    description:
      "Generates or refines a React+TS+Tailwind app from a natural-language prompt.",
    requestBody: {
      create: { mode: "create", prompt: "string" },
      refine: {
        mode: "refine",
        currentApp: "GeneratedApp object",
        feedback: "string",
      },
    },
    response: {
      success: "boolean",
      app: "GeneratedApp (when success=true)",
      error: "string (when success=false)",
    },
  });
}
