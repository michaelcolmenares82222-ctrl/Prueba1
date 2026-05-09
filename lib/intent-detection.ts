import { groqJsonCompletion } from "./groq";
import { validateIntentDetection } from "./schemas";
import { IntentType } from "./types";
import { readFileSync } from "fs";
import { join } from "path";

// Cargar prompts
const SYSTEM_PROMPT = readFileSync(
  join(process.cwd(), "prompts/system.md"),
  "utf-8"
);

const INTENT_CLASSIFIER_PROMPT = readFileSync(
  join(process.cwd(), "prompts/intent-classifier.md"),
  "utf-8"
);

export async function detectIntent(userInput: string): Promise<{
  intent: IntentType;
  confidence: number;
  reasoning?: string;
}> {
  try {
    // Reemplazar placeholder en el prompt
    const prompt = INTENT_CLASSIFIER_PROMPT.replace("{USER_INPUT}", userInput);

    // Llamar a Groq
    const response = await groqJsonCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: 150,
    });

    // Validar con Zod
    const validated = validateIntentDetection(response);

    console.log("✅ Intent detected:", validated);

    return validated;
  } catch (error: unknown) {
    console.error("❌ Error detecting intent:", error);

    // Heurística de respaldo cuando el LLM falla o el JSON viene roto.
    // Evita quemar el flujo dejando el intent en "generic" (que /api/generate-ui
    // no soporta y dispara un 500 confuso).
    return heuristicIntent(userInput);
  }
}

function heuristicIntent(userInput: string): {
  intent: IntentType;
  confidence: number;
  reasoning?: string;
} {
  const s = userInput.toLowerCase();
  if (
    /viaj|via\b|destino|itinerar|vacacion|vuelo|hotel|paris|tokio|jap[oó]n|europa/.test(
      s
    )
  ) {
    return {
      intent: "travel",
      confidence: 0.6,
      reasoning: "Heurística local (fallback): palabras de viaje detectadas",
    };
  }
  if (
    /fitness|gimnasio|peso|kilo|m[uú]sculo|adelgaz|cardio|rutina|entrenar|dieta|nutrici/.test(
      s
    )
  ) {
    return {
      intent: "fitness",
      confidence: 0.6,
      reasoning: "Heurística local (fallback): palabras de fitness detectadas",
    };
  }
  if (
    /aprend|programa|c[oó]digo|stack|react|node|python|javascript|backend|frontend|fullstack|developer|roadmap/.test(
      s
    )
  ) {
    return {
      intent: "development",
      confidence: 0.6,
      reasoning: "Heurística local (fallback): palabras de desarrollo detectadas",
    };
  }
  return {
    intent: "generic",
    confidence: 0.4,
    reasoning: "Sin LLM y sin coincidencia heurística; intent genérico",
  };
}
