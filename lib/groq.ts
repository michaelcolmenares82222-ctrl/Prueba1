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
}

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
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
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Error en Groq completion:", error);

    // Manejo de errores específicos
    if (error.status === 401) {
      throw new Error("API key de Groq inválida");
    } else if (error.status === 429) {
      throw new Error(
        "Rate limit excedido. Intenta de nuevo en un momento"
      );
    } else if (error.status === 500) {
      throw new Error("Error interno de Groq. Reintentando...");
    }

    throw new Error(`Error en Groq: ${error.message}`);
  }
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
