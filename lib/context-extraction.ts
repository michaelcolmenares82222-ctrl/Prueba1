import { groqJsonCompletion } from "./groq";
import {
  validateTravelPartialExtract,
  validateDevPartialExtract,
  validateFitnessPartialExtract,
  validateLearningContext,
  validateGenericContext,
} from "./schemas";
import {
  IntentType,
  TravelContext,
  DevContext,
  FitnessContext,
  LearningContext,
  GenericContext,
} from "./types";
import { readFileSync } from "fs";
import { join } from "path";

// Cargar prompts
const SYSTEM_PROMPT = readFileSync(
  join(process.cwd(), "prompts/system.md"),
  "utf-8"
);

const CONTEXT_EXTRACTOR_PROMPT = readFileSync(
  join(process.cwd(), "prompts/context-extractor.md"),
  "utf-8"
);

type ContextResult =
  | TravelContext
  | DevContext
  | FitnessContext
  | LearningContext
  | GenericContext;

export async function extractContext(
  intent: IntentType,
  userInput: string
): Promise<ContextResult> {
  try {
    // Seleccionar sección del prompt según intent
    const section = getPromptSection(intent);
    const prompt = section.replace(/\{USER_INPUT\}/g, userInput).trim();

    // Llamar a Groq
    const response = await groqJsonCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.4,
      maxTokens: 1000,
    });

    // Validar según el tipo
    const validated = validateContext(intent, response);

    console.log("✅ Context extracted:", validated);

    return validated;
  } catch (error: unknown) {
    console.error("❌ Error extracting context:", error);

    // Fallback genérico
    return {
      query: userInput,
      category: "unknown",
    } as GenericContext;
  }
}

function getPromptSection(intent: IntentType): string {
  const sections = CONTEXT_EXTRACTOR_PROMPT.split("---");

  // El primer bloque del markdown contiene las "Reglas generales".
  // Se anteponen a la sección específica de cada intent para que el
  // modelo no invente campos no mencionados por el usuario.
  const preamble = sections[0] ?? "";

  let section = "";
  switch (intent) {
    case "travel":
      section = sections[1] ?? "";
      break;
    case "development":
      section = sections[2] ?? sections[1] ?? "";
      break;
    case "fitness":
      section = sections[3] ?? sections[1] ?? "";
      break;
    case "learning":
      section = sections[4] ?? sections[1] ?? "";
      break;
    default:
      section = sections[5] ?? sections[1] ?? "";
  }

  return `${preamble}\n\n---\n\n${section}`;
}

function validateContext(intent: IntentType, data: unknown): ContextResult {
  switch (intent) {
    case "travel":
      return validateTravelPartialExtract(data) as TravelContext;
    case "development":
      return validateDevPartialExtract(data) as DevContext;
    case "fitness":
      return validateFitnessPartialExtract(data) as FitnessContext;
    case "learning":
      return validateLearningContext(data) as LearningContext;
    default:
      return validateGenericContext(data) as GenericContext;
  }
}
