import Groq from "groq-sdk";

// ============================================
// Cliente Singleton
// ============================================

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY no está configurada. " +
          "Agrega tu API key en .env.local"
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
 * Free-tier Groq TPD is per model: `llama-3.3-70b-versatile` is high-quality
 * but only ~100k tokens/day, while `llama-3.1-8b-instant` allows ~500k.
 * Override via `GROQ_GENERATION_MODEL` in `.env.local` when you want to swap.
 */
const DEFAULT_MODEL =
  process.env.GROQ_GENERATION_MODEL?.trim() || "llama-3.1-8b-instant";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2000;

export async function groqCompletion(
  prompt: string,
  options: GroqCompletionOptions = {}
): Promise<string> {
  const client = getGroqClient();

  const {
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    systemPrompt,
    stream = false,
    responseFormat,
  } = options;

  try {
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

    if (stream) {
      throw new Error(
        "Streaming no soportado en este wrapper. Usa groqStream()"
      );
    }

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      message?: string;
      error?: {
        message?: string;
        code?: string;
        failed_generation?: string;
      };
      headers?: Record<string, string>;
    };

    // Groq's strict JSON mode (`response_format: json_object`) rejects the entire
    // response if the model produced even a tiny syntax slip. Retry once without
    // the constraint so the parser layer can attempt a repair.
    if (
      responseFormat &&
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
