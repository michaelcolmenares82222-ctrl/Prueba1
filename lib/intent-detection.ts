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
      temperature: 0.3,
      maxTokens: 500,
    });

    // Validar con Zod
    const validated = validateIntentDetection(response);

    console.log("✅ Intent detected:", validated);

    return validated;
  } catch (error: any) {
    console.error("❌ Error detecting intent:", error);

    // Fallback a generic si falla
    return {
      intent: "generic",
      confidence: 0.5,
      reasoning: "Error en detección, usando fallback",
    };
  }
}
