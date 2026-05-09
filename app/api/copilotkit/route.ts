import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createGroqChatServiceAdapter } from "@/lib/groq-chat-service-adapter";
import { OpenAIChatCompletionsAdapter } from "@/lib/openrouter-chat-adapter";

// ============================================================
// CopilotKit Runtime — OpenRouter primary, Groq fallback
// ------------------------------------------------------------
// Las acciones (`generate_travel_plan`, etc.) se registran SOLO
// en el cliente con `useCopilotAction` en `app/page.tsx`. No se
// vuelven a registrar aquí: hacerlo causaba doble dispatch y los
// handlers del cliente se quedaban sin ejecutar.
// ============================================================

const runtime = new CopilotRuntime();

// ============================================================
// OpenRouter (OpenAI-compatible) — preferido si hay clave.
// ------------------------------------------------------------
// Free-tier: 20 req/min, 200 req/día por IP en modelos `:free`.
// Catálogo: https://openrouter.ai/models
//
// Default: z-ai/glm-4.5-air:free
//   - Sirve por el provider Z.AI directamente, no por Venice.
//   - Tool-calling MUY estable (probado en repo el 2026-05-08).
//   - Razonamiento explícito que ayuda a no inventar parámetros.
//
// Free alternativos verificados (también con tools):
//   - openai/gpt-oss-120b:free  (provider OpenInference, conciso)
//   - openai/gpt-oss-20b:free   (más pequeño, más rápido)
//
// EVITA por ahora (provider Venice saturado, devuelve 429):
//   - meta-llama/llama-3.3-70b-instruct:free
//   - qwen/qwen3-next-80b-a3b-instruct:free
//   - qwen/qwen3-coder:free
//
// Override con OPENROUTER_CHAT_MODEL en .env.local.
// ============================================================

const DEFAULT_OPENROUTER_MODEL = "z-ai/glm-4.5-air:free";

let openrouterAdapter: OpenAIChatCompletionsAdapter | null = null;
let cachedOpenrouterModel: string | null = null;

function getOpenrouterAdapter(): OpenAIChatCompletionsAdapter | null {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (
    !apiKey ||
    apiKey.startsWith("sk-or-your-") ||
    apiKey === "placeholder"
  ) {
    return null;
  }
  const model =
    process.env.OPENROUTER_CHAT_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  if (!openrouterAdapter || cachedOpenrouterModel !== model) {
    const referer =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    // Custom adapter: fuerza /v1/chat/completions tanto en `process()`
    // como en `getLanguageModel()` (CopilotKit usa este último para crear
    // el agente `default` automático). OpenRouter no soporta /v1/responses.
    openrouterAdapter = new OpenAIChatCompletionsAdapter({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      model,
      headers: {
        // Headers recomendados por OpenRouter para identificar la app
        // (mejora ranking, evita bans por anonimato).
        "HTTP-Referer": referer,
        "X-Title": "Universal AI Assistant",
      },
    });
    cachedOpenrouterModel = model;
  }
  return openrouterAdapter;
}

// ============================================================
// Groq fallback (mismo flujo de antes)
// ============================================================

const DEFAULT_GROQ_CHAT_MODEL = "llama-3.1-8b-instant";

let groqAdapter: ReturnType<typeof createGroqChatServiceAdapter> | null = null;
let cachedGroqModel: string | null = null;

function getGroqAdapter(): ReturnType<typeof createGroqChatServiceAdapter> | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === "placeholder_add_your_key_here") return null;
  const model = process.env.GROQ_CHAT_MODEL?.trim() || DEFAULT_GROQ_CHAT_MODEL;
  if (!groqAdapter || cachedGroqModel !== model) {
    groqAdapter = createGroqChatServiceAdapter({
      model,
      groq: new Groq({ apiKey }),
    });
    cachedGroqModel = model;
  }
  return groqAdapter;
}

function getActiveAdapter(): {
  adapter:
    | OpenAIChatCompletionsAdapter
    | ReturnType<typeof createGroqChatServiceAdapter>;
  provider: "openrouter" | "groq";
  model: string;
} | null {
  const openrouter = getOpenrouterAdapter();
  if (openrouter) {
    return {
      adapter: openrouter,
      provider: "openrouter",
      model:
        process.env.OPENROUTER_CHAT_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
    };
  }
  const groq = getGroqAdapter();
  if (groq) {
    return {
      adapter: groq,
      provider: "groq",
      model: process.env.GROQ_CHAT_MODEL?.trim() || DEFAULT_GROQ_CHAT_MODEL,
    };
  }
  return null;
}

// ============================================================
// POST handler
// ============================================================

export const POST = async (req: NextRequest) => {
  const active = getActiveAdapter();
  if (!active) {
    return NextResponse.json(
      {
        error:
          "No chat provider configured. Set OPENROUTER_API_KEY (recommended) or GROQ_API_KEY in .env.local.",
      },
      { status: 500 }
    );
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: active.adapter,
    endpoint: "/api/copilotkit",
  });

  try {
    return await handleRequest(req);
  } catch (err) {
    console.error("[copilotkit] handleRequest crashed:", err);
    const message =
      err instanceof Error ? err.message : "Unknown runtime error";
    return NextResponse.json(
      { error: "copilotkit_runtime_error", message },
      { status: 500 }
    );
  }
};

// ============================================================
// GET — info / health
// ============================================================

export async function GET() {
  const active = getActiveAdapter();
  return NextResponse.json({
    endpoint: "/api/copilotkit",
    status: active ? "active" : "missing_api_key",
    provider: active?.provider ?? null,
    model: active?.model ?? null,
    description:
      "CopilotKit runtime endpoint. Prefiere OpenRouter si OPENROUTER_API_KEY está; cae a Groq si no.",
  });
}
