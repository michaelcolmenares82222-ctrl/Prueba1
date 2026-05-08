import { groqJsonCompletion } from "./groq";
import {
  validateTravelContext,
  validateDevContext,
  validateFitnessContext,
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
  } catch (error: any) {
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

  switch (intent) {
    case "travel":
      return sections[0] ?? "";
    case "development":
      return sections[1] ?? sections[0] ?? "";
    case "fitness":
      return sections[2] ?? sections[0] ?? "";
    case "learning":
      return sections[3] ?? sections[0] ?? "";
    default:
      return sections[4] ?? sections[0] ?? "";
  }
}

function validateContext(intent: IntentType, data: unknown): ContextResult {
  switch (intent) {
    case "travel":
      return validateTravelContext(data) as TravelContext;
    case "development":
      return validateDevContext(data) as DevContext;
    case "fitness":
      return validateFitnessContext(data) as FitnessContext;
    case "learning":
      return validateLearningContext(data) as LearningContext;
    default:
      return validateGenericContext(data) as GenericContext;
  }
}
