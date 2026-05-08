import {
  CopilotRuntime,
  GroqAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { COPILOT_ACTIONS } from "@/lib/copilot-actions";
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

// ============================================
// CopilotKit Runtime Configuration
// ============================================

const runtime = new CopilotRuntime({
  actions: [
    {
      name: COPILOT_ACTIONS.generateTravelPlan.name,
      description: COPILOT_ACTIONS.generateTravelPlan.description,
      parameters: COPILOT_ACTIONS.generateTravelPlan.parameters,
      handler: async ({ context }) => {
        const ctx = TravelContextSchema.parse(context);
        return generateTravelUI(ctx);
      },
    },
    {
      name: COPILOT_ACTIONS.generateDevRoadmap.name,
      description: COPILOT_ACTIONS.generateDevRoadmap.description,
      parameters: COPILOT_ACTIONS.generateDevRoadmap.parameters,
      handler: async ({ context }) => {
        const ctx = DevContextSchema.parse(context);
        return generateDevUI(ctx);
      },
    },
    {
      name: COPILOT_ACTIONS.generateFitnessPlan.name,
      description: COPILOT_ACTIONS.generateFitnessPlan.description,
      parameters: COPILOT_ACTIONS.generateFitnessPlan.parameters,
      handler: async ({ context }) => {
        const ctx = FitnessContextSchema.parse(context);
        return generateFitnessUI(ctx);
      },
    },
  ],
});

// ============================================
// Groq Adapter Setup (lazy — avoids build-time env requirement)
// ============================================

let serviceAdapter: GroqAdapter | null = null;

function getGroqAdapter(): GroqAdapter | null {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return null;
  if (!serviceAdapter) {
    serviceAdapter = new GroqAdapter({
      model: "llama-3.3-70b-versatile",
      groq: new Groq({ apiKey: groqApiKey }),
    });
  }
  return serviceAdapter;
}

// ============================================
// POST Handler
// ============================================

export const POST = async (req: NextRequest) => {
  const adapter = getGroqAdapter();
  if (!adapter) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not set" },
      { status: 500 }
    );
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: adapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

// ============================================
// GET Handler - Info
// ============================================

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/copilotkit",
    status: "active",
    adapter: "GroqAdapter",
    model: "llama-3.3-70b-versatile",
    description:
      "CopilotKit runtime endpoint for AI-powered UI generation",
  });
}
