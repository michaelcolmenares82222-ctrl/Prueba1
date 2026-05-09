import Groq from "groq-sdk";

// ============================================
// Proveedor: Groq (preferido) o OpenRouter (fallback)
// ============================================
//
// Selección de proveedor:
//   1. `LLM_PROVIDER=groq|openrouter` en .env.local (override explícito).
//   2. Groq si `GROQ_API_KEY` está configurada (default recomendado: más
//      rápido, ~1-5s vs 10-70s del free de OpenRouter).
//   3. OpenRouter si solo hay `OPENROUTER_API_KEY` (fallback).
//
// Si Groq devuelve 429 `tokens per day` o `model_decommissioned` en una
// llamada concreta, `groqCompletion()` cae automáticamente a OpenRouter
// (cuando esté configurado) y loguea con prefijo `[llm:fallback]`.

type LlmProvider = "groq" | "openrouter";

function isConfiguredOpenRouterKey(): boolean {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return false;
  if (apiKey.startsWith("sk-or-your-") || apiKey === "placeholder")
    return false;
  if (apiKey.startsWith("placeholder_")) return false;
  return true;
}

function isConfiguredGroqKey(): boolean {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return false;
  if (apiKey === "placeholder_add_your_key_here") return false;
  return true;
}

function assertAnyLlmKey(): void {
  if (!isConfiguredOpenRouterKey() && !isConfiguredGroqKey()) {
    throw new Error(
      "No hay proveedor de LLM configurado. " +
        "Agrega GROQ_API_KEY (recomendado) o OPENROUTER_API_KEY en .env.local."
    );
  }
}

function getPreferredProvider(): LlmProvider {
  const explicit = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq" || explicit === "openrouter") {
    return explicit;
  }
  if (isConfiguredGroqKey()) return "groq";
  if (isConfiguredOpenRouterKey()) return "openrouter";
  // Sin claves: assertAnyLlmKey() lanza en la siguiente llamada.
  return "groq";
}

// ============================================
// Cliente Singleton (solo Groq)
// ============================================

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey || apiKey === "placeholder_add_your_key_here") {
      throw new Error(
        "GROQ_API_KEY no está configurada. " +
          "Para usar solo OpenRouter, no llames a getGroqClient(); " +
          "usa groqCompletion() / groqJsonCompletion(), que leen OPENROUTER_API_KEY."
      );
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ============================================
// Wrapper para Completions
// ============================================

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  /**
   * If set to `{ type: "json_object" }`, asks Groq for guaranteed-parseable JSON
   * (Groq's OpenAI-compatible JSON mode). The system prompt MUST mention "json".
   */
  responseFormat?: { type: "json_object" };
}

/**
 * Default model for content generation (rich UIs, JSON output).
 * `llama-3.3-70b-versatile` es el default recomendado: latencia 1-5s y mayor
 * calidad de razonamiento que `llama-3.1-8b-instant`, a cambio de una cuota
 * TPD (tokens-per-day) más estricta en el free tier (~100k/día vs ~500k).
 * Si llegas a la cuota, `groqCompletion()` cae automáticamente a OpenRouter
 * (si hay clave); también puedes cambiar `GROQ_GENERATION_MODEL` a
 * `llama-3.1-8b-instant` para volver al modelo con TPD mayor.
 */
const DEFAULT_GROQ_MODEL =
  process.env.GROQ_GENERATION_MODEL?.trim() || "llama-3.3-70b-versatile";

// Default de generación: glm-4.5-air free es estable (probado).
// Probamos `openai/gpt-oss-20b:free` y devuelve tokens corruptos vía
// OpenInference; evitarlo. Override vía OPENROUTER_GENERATION_MODEL.
const DEFAULT_OPENROUTER_MODEL =
  process.env.OPENROUTER_GENERATION_MODEL?.trim() ||
  "z-ai/glm-4.5-air:free";

const DEFAULT_TEMPERATURE = 0.6;
// Bajado de 2000 → 1200: las extracciones y generaciones de plan reales
// caben de sobra. Cada generador puede subirlo si lo necesita.
const DEFAULT_MAX_TOKENS = 1200;

type ChatCompletionErrorBody = {
  status?: number;
  message?: string;
  error?: {
    message?: string;
    code?: string | number;
    failed_generation?: string;
  };
  headers?: Record<string, string>;
};

async function openRouterChatCompletion(
  prompt: string,
  options: GroqCompletionOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY!.trim();
  const referer =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  const {
    model = DEFAULT_OPENROUTER_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    systemPrompt,
    responseFormat,
  } = options;

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
    // Sugerencia universal a OpenRouter: minimiza tokens de razonamiento
    // explícito en modelos que lo soportan (glm-4.5-air, deepseek-r1, etc.).
    // Modelos sin reasoning ignoran el campo.
    reasoning: { effort: "low" },
  };
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "Universal AI Assistant",
    },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  let data: {
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: { message?: string; code?: string | number };
  };
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    throw new Error(
      `OpenRouter devolvió una respuesta no JSON (HTTP ${res.status})`
    );
  }

  const err = data.error;
  if (!res.ok || err) {
    const synthetic: ChatCompletionErrorBody = {
      status: res.status,
      message: err?.message,
      error: err ? { message: err.message, code: err.code } : undefined,
      headers: Object.fromEntries(res.headers.entries()),
    };
    return await handleCompletionHttpError(
      synthetic,
      prompt,
      options,
      "OpenRouter"
    );
  }

  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

async function handleCompletionHttpError(
  err: ChatCompletionErrorBody,
  prompt: string,
  options: GroqCompletionOptions,
  label: "OpenRouter" | "Groq"
): Promise<string> {
  const responseFormat = options.responseFormat;

  if (
    responseFormat &&
    err?.status === 400 &&
    (err.error?.code === "json_validate_failed" ||
      (label === "OpenRouter" &&
        /json|schema|parse/i.test(err.error?.message || err.message || "")))
  ) {
    console.warn(
      `${label} rechazó JSON estricto; reintentando sin response_format.`
    );
    const failed = err.error?.failed_generation;
    if (typeof failed === "string" && failed.length > 0) {
      return failed;
    }
    return groqCompletion(prompt, { ...options, responseFormat: undefined });
  }

  console.error(`Error en ${label} completion:`, err);

  if (err?.status === 401) {
    throw new Error(
      label === "OpenRouter"
        ? "API key de OpenRouter inválida"
        : "API key de Groq inválida"
    );
  }
  if (err?.status === 429) {
    const retryAfter = parseRetryAfter(err);
    const detail = err.error?.message || err.message || "";
    const human = retryAfter
      ? `Rate limit de ${label} excedido. Vuelve a intentar en ${retryAfter}.`
      : `Rate limit de ${label} excedido. Intenta de nuevo en un momento.`;
    const tip =
      label === "Groq" && detail.includes("tokens per day")
        ? " Has alcanzado la cuota diaria del modelo. Cambia GROQ_GENERATION_MODEL en .env.local o espera al reset diario."
        : label === "OpenRouter" && /credits|balance/i.test(detail)
          ? " Revisa créditos o límites en openrouter.ai."
          : "";
    throw new Error(`${human}${tip}`);
  }
  if (err?.status === 500) {
    throw new Error(`Error interno de ${label}. Reintenta en unos segundos.`);
  }

  throw new Error(
    `Error en ${label}: ${err?.message ?? err?.error?.message ?? "desconocido"}`
  );
}

async function groqDirectCompletion(
  prompt: string,
  options: GroqCompletionOptions
): Promise<string> {
  const client = getGroqClient();

  const {
    model = DEFAULT_GROQ_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    systemPrompt,
    stream = false,
    responseFormat,
  } = options;

  if (stream) {
    throw new Error(
      "Streaming no soportado en este wrapper. Usa groqStream()"
    );
  }

  // Reusing the existing `any[]` shape (preexistente) para evitar conflictos
  // entre los tipos de mensaje que expone groq-sdk en distintas versiones.
  const messages: any[] = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
    ...(responseFormat ? { response_format: responseFormat } : {}),
  });

  return completion.choices[0]?.message?.content || "";
}

type GroqRuntimeError = {
  status?: number;
  message?: string;
  error?: {
    message?: string;
    code?: string;
    failed_generation?: string;
  };
  headers?: Record<string, string>;
};

function isGroqTpdError(err: GroqRuntimeError): boolean {
  if (err?.status !== 429) return false;
  const detail = err.error?.message || err.message || "";
  return /tokens per day/i.test(detail);
}

function isGroqDecommissionedError(err: GroqRuntimeError): boolean {
  const code = err.error?.code || "";
  if (typeof code === "string" && /decommission/i.test(code)) return true;
  const detail = err.error?.message || err.message || "";
  return /model[_ ]?decommission/i.test(detail);
}

export async function groqCompletion(
  prompt: string,
  options: GroqCompletionOptions = {}
): Promise<string> {
  assertAnyLlmKey();

  const preferred = getPreferredProvider();

  // OpenRouter explícito o único disponible.
  if (preferred === "openrouter" && isConfiguredOpenRouterKey()) {
    return openRouterChatCompletion(prompt, options);
  }

  // Si el preferido es Groq pero no hay clave, cae a OpenRouter.
  if (preferred === "groq" && !isConfiguredGroqKey()) {
    if (isConfiguredOpenRouterKey()) {
      return openRouterChatCompletion(prompt, options);
    }
    assertAnyLlmKey();
  }

  // Camino Groq (preferido).
  try {
    return await groqDirectCompletion(prompt, options);
  } catch (error: unknown) {
    const err = error as GroqRuntimeError;

    // JSON estricto: reintenta una vez sin response_format para que el parser
    // repare la salida (comportamiento previo a la migración).
    if (
      options.responseFormat &&
      err?.status === 400 &&
      err.error?.code === "json_validate_failed"
    ) {
      console.warn(
        "Groq rejected JSON output; retrying without response_format and letting parser repair."
      );
      if (typeof err.error?.failed_generation === "string") {
        return err.error.failed_generation;
      }
      return groqCompletion(prompt, { ...options, responseFormat: undefined });
    }

    // Fallback automático a OpenRouter ante TPD agotado o modelo retirado.
    if (
      (isGroqTpdError(err) || isGroqDecommissionedError(err)) &&
      isConfiguredOpenRouterKey()
    ) {
      const reason = isGroqTpdError(err)
        ? "429 tokens per day exceeded"
        : "model_decommissioned";
      console.warn(
        `[llm:fallback] Groq returned ${reason}; routing this call through OpenRouter.`
      );
      return openRouterChatCompletion(prompt, options);
    }

    console.error("Error en Groq completion:", error);

    if (err?.status === 401) {
      throw new Error("API key de Groq inválida");
    } else if (err?.status === 429) {
      const retryAfter = parseRetryAfter(err);
      const detail = err.error?.message || err.message || "";
      const human = retryAfter
        ? `Rate limit de Groq excedido. Vuelve a intentar en ${retryAfter}.`
        : "Rate limit de Groq excedido. Intenta de nuevo en un momento.";
      const tip = detail.includes("tokens per day")
        ? " Has alcanzado la cuota diaria del modelo. Cambia GROQ_CHAT_MODEL/GROQ_GENERATION_MODEL en .env.local a otro modelo (p.ej. llama-3.1-8b-instant) o espera al reset diario."
        : "";
      throw new Error(`${human}${tip}`);
    } else if (err?.status === 500) {
      throw new Error("Error interno de Groq. Reintenta en unos segundos.");
    }

    throw new Error(`Error en Groq: ${err?.message ?? "desconocido"}`);
  }
}

function parseRetryAfter(err: {
  message?: string;
  error?: { message?: string };
  headers?: Record<string, string>;
}): string | null {
  const fromHeader = err.headers?.["retry-after"];
  if (fromHeader) {
    const n = Number(fromHeader);
    if (!Number.isNaN(n) && n > 0) {
      return formatSeconds(n);
    }
    return fromHeader;
  }
  const text = err.error?.message || err.message || "";
  const match = text.match(/try again in ([0-9hms.\s]+)/i);
  return match?.[1]?.trim() ?? null;
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return s ? `${m}m${s}s` : `${m}m`;
}

// ============================================
// Wrapper para JSON Completions
// ============================================

export async function groqJsonCompletion<T = any>(
  prompt: string,
  options: GroqCompletionOptions = {}
): Promise<T> {
  // Forzar formato JSON en el system prompt
  const enhancedSystemPrompt = `${
    options.systemPrompt || ""
  }\n\nIMPORTANTE: Tu respuesta DEBE ser ÚNICAMENTE JSON válido, sin texto adicional, sin markdown, sin explicaciones. Solo el objeto JSON.`;

  const response = await groqCompletion(prompt, {
    ...options,
    systemPrompt: enhancedSystemPrompt,
    temperature: 0.3, // Más determinístico para JSON
  });

  try {
    // Limpiar respuesta (por si viene con markdown)
    const cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanedResponse) as T;
  } catch (error) {
    console.error("Error parseando JSON de Groq:", response);
    throw new Error(
      `Respuesta inválida de Groq. No es JSON válido: ${error}`
    );
  }
}

// ============================================
// Rate Limiting Simple
// ============================================

interface RateLimitState {
  requests: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitState>();
const MAX_REQUESTS_PER_MINUTE = 30;

export function checkRateLimit(userId: string = "default"): boolean {
  const now = Date.now();
  const state = rateLimits.get(userId);

  if (!state || now > state.resetTime) {
    rateLimits.set(userId, {
      requests: 1,
      resetTime: now + 60000, // 1 minuto
    });
    return true;
  }

  if (state.requests >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  state.requests++;
  return true;
}

// ============================================
// Utilidades
// ============================================

export function getAvailableModels(): string[] {
  return [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ];
}

export async function testGroqConnection(): Promise<boolean> {
  try {
    await groqCompletion("Responde solo: OK", {
      maxTokens: 10,
    });
    return true;
  } catch (error) {
    console.error("Test de conexión Groq falló:", error);
    return false;
  }
}
