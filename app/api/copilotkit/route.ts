import {
  CopilotRuntime,
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
import { createGroqChatServiceAdapter } from "@/lib/groq-chat-service-adapter";
import { stripNullish } from "@/lib/args-utils";

// ============================================
// CopilotKit Runtime Configuration
// ============================================

const runtime = new CopilotRuntime({
  actions: [
    {
      name: COPILOT_ACTIONS.generateTravelPlan.name,
      description: COPILOT_ACTIONS.generateTravelPlan.description,
      parameters: COPILOT_ACTIONS.generateTravelPlan.parameters,
      handler: async (args: Record<string, unknown>) => {
        const ctx = TravelContextSchema.parse(stripNullish(args));
        return generateTravelUI(ctx);
      },
    },
    {
      name: COPILOT_ACTIONS.generateDevRoadmap.name,
      description: COPILOT_ACTIONS.generateDevRoadmap.description,
      parameters: COPILOT_ACTIONS.generateDevRoadmap.parameters,
      handler: async (args: Record<string, unknown>) => {
        const ctx = DevContextSchema.parse(stripNullish(args));
        return generateDevUI(ctx);
      },
    },
    {
      name: COPILOT_ACTIONS.generateFitnessPlan.name,
      description: COPILOT_ACTIONS.generateFitnessPlan.description,
      parameters: COPILOT_ACTIONS.generateFitnessPlan.parameters,
      handler: async (args: Record<string, unknown>) => {
        const ctx = FitnessContextSchema.parse(stripNullish(args));
        return generateFitnessUI(ctx);
      },
    },
  ],
});

// ============================================
// Groq Adapter Setup (lazy — avoids build-time env requirement)
// ============================================

let serviceAdapter: ReturnType<typeof createGroqChatServiceAdapter> | null =
  null;
let cachedChatModel: string | null = null;

/**
 * Default chat model. Used for intent + tool-call routing inside CopilotKit.
 * `llama-3.1-8b-instant` has a much higher free-tier TPD (~500k) than 70b (~100k)
 * and is plenty for mapping natural language → tool args. Override via env.
 */
const DEFAULT_CHAT_MODEL = "llama-3.1-8b-instant";

function getGroqAdapter(): ReturnType<typeof createGroqChatServiceAdapter> | null {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return null;
  const model = process.env.GROQ_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
  if (!serviceAdapter || cachedChatModel !== model) {
    serviceAdapter = createGroqChatServiceAdapter({
      model,
      groq: new Groq({ apiKey: groqApiKey }),
    });
    cachedChatModel = model;
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
    adapter: "GroqChatServiceAdapter (chat completions)",
    model: process.env.GROQ_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
    description:
      "CopilotKit runtime endpoint for AI-powered UI generation",
  });
}
