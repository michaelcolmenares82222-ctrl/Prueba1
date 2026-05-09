export type ConversationIntent = "travel" | "fitness" | "development";

export interface ConversationContext {
  intent: ConversationIntent | null;
  collectedData: Record<string, unknown>;
  missingFields: string[];
  isComplete: boolean;
}

export interface ValidationResult {
  isComplete: boolean;
  nextQuestion: string | null;
  missingRequired: string[];
  nextField: string | null;
}

const STORAGE_KEY = "conversation_state";

export class ConversationManager {
  static save(context: ConversationContext): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  }

  static load(): ConversationContext | null {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as ConversationContext;
    } catch {
      return null;
    }
  }

  static clear(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEY);
  }

  static update(updates: Partial<ConversationContext>): void {
    const current =
      this.load() ?? {
        intent: null,
        collectedData: {},
        missingFields: [],
        isComplete: false,
      };
    this.save({ ...current, ...updates });
  }

  /** Combina nuevos datos en `collectedData` y persiste. */
  static mergeData(newData: Record<string, unknown>): ConversationContext {
    const current =
      this.load() ?? {
        intent: null,
        collectedData: {},
        missingFields: [],
        isComplete: false,
      };
    const merged: ConversationContext = {
      ...current,
      collectedData: {
        ...current.collectedData,
        ...newData,
      },
    };
    this.save(merged);
    return merged;
  }
}

export const REQUIRED_FIELDS: Record<ConversationIntent, string[]> = {
  travel: ["destination"],
  fitness: ["goal"],
  development: [],
};

/** Campos que pedimos en orden, uno por turno, tras cubrir los requeridos. */
export const PROGRESSIVE_FIELDS: Record<ConversationIntent, string[]> = {
  travel: ["duration", "budget", "travelers", "interests"],
  fitness: ["currentWeight", "height", "age", "currentLevel", "daysPerWeek"],
  development: ["experience", "timeframe", "targetStack"],
};

function hasDevRequired(data: Record<string, unknown>): boolean {
  const lg =
    typeof data.learningGoal === "string" ? data.learningGoal.trim() : "";
  const pt =
    typeof data.projectType === "string" ? data.projectType.trim() : "";
  const g = typeof data.goal === "string" ? data.goal.trim() : "";
  return Boolean(lg || pt || g);
}

export function fieldPresent(
  intent: ConversationIntent,
  field: string,
  data: Record<string, unknown>
): boolean {
  const v = data[field];
  switch (field) {
    case "interests":
      return Array.isArray(v) && v.length > 0;
    case "targetStack":
      return Array.isArray(v) && v.length > 0;
    case "travelers":
      return typeof v === "number" && Number.isFinite(v) && v >= 1;
    case "duration":
    case "budget":
    case "currentWeight":
    case "height":
    case "age":
    case "daysPerWeek":
      return typeof v === "number" && Number.isFinite(v) && v > 0;
    case "destination":
    case "timeframe":
      return typeof v === "string" && v.trim().length > 0;
    case "goal":
      return typeof v === "string" && v.trim().length > 0;
    case "experience":
      return (
        v === "beginner" || v === "intermediate" || v === "advanced"
      );
    case "currentLevel":
      return (
        v === "beginner" || v === "intermediate" || v === "advanced"
      );
    default:
      return v !== undefined && v !== null && v !== "";
  }
}

export function generateQuestion(field: string, intent: ConversationIntent): string {
  const questions: Record<string, Record<string, string>> = {
    travel: {
      destination: "🌍 ¿A dónde quieres viajar?",
      duration: "📅 ¿Cuántos días planeas estar?",
      budget: "💰 ¿Cuál es tu presupuesto aproximado? (en USD)",
      travelers:
        "👥 ¿Viajas solo o acompañado? ¿Cuántas personas sois?",
      interests:
        "✨ ¿Qué te interesa más? (cultura, gastronomía, playa, vida nocturna, naturaleza…)",
      travelStyle:
        "🎒 ¿Qué estilo de viaje prefieres? (mochilero / estándar / lujo)",
    },
    fitness: {
      goal:
        "🎯 ¿Cuál es tu objetivo? (bajar peso, ganar músculo, tonificar, mejorar resistencia…)",
      currentWeight: "⚖️ ¿Cuánto pesas actualmente? (en kg)",
      targetWeight: "🎯 ¿Cuál es tu peso objetivo? (en kg)",
      height: "📏 ¿Cuánto mides? (en cm; si dices metros, ej. 1,75, también vale)",
      age: "👤 ¿Cuántos años tienes?",
      fitnessLevel:
        "💪 ¿Cuál es tu nivel? (principiante, intermedio, avanzado)",
      currentLevel:
        "💪 ¿Cuál es tu nivel? (principiante, intermedio, avanzado)",
      daysPerWeek: "📆 ¿Cuántos días a la semana puedes entrenar?",
    },
    development: {
      goal: "💻 ¿Qué quieres aprender o mejorar?",
      experience:
        "📊 ¿Cuál es tu nivel actual? (principiante, intermedio, avanzado)",
      timeframe: "⏱️ ¿En cuánto tiempo quieres lograrlo?",
      targetStack:
        "🛠️ ¿Qué tecnologías te interesan? (puedes listar varias separadas por coma)",
    },
  };

  return (
    questions[intent]?.[field] ??
    `¿Podrías darme un poco más de detalle sobre «${field}»?`
  );
}

export function validateContext(
  context: ConversationContext
): ValidationResult {
  if (!context.intent) {
    return {
      isComplete: false,
      nextQuestion: null,
      missingRequired: [],
      nextField: null,
    };
  }

  const intent = context.intent;
  const data = context.collectedData;

  if (intent === "development") {
    if (!hasDevRequired(data)) {
      console.log("❌ Missing REQUIRED dev goal / learningGoal / projectType");
      return {
        isComplete: false,
        nextQuestion: generateQuestion("goal", intent),
        missingRequired: ["goal"],
        nextField: "goal",
      };
    }
    console.log("✅ Dev required satisfied");
    for (const field of PROGRESSIVE_FIELDS.development) {
      const ok = fieldPresent(intent, field, data);
      console.log(`🔍 Progressive "${field}":`, data[field], "ok:", ok);
      if (!ok) {
        console.log(`❌ Missing PROGRESSIVE field: ${field}`);
        return {
          isComplete: false,
          nextQuestion: `${generateQuestion(field, intent)} (si prefieres, di «omitir» y usaré un valor por defecto razonable.)`,
          missingRequired: [],
          nextField: field,
        };
      }
    }
    console.log("✅ All dev fields complete");
    return {
      isComplete: true,
      nextQuestion: null,
      missingRequired: [],
      nextField: null,
    };
  }

  const required = REQUIRED_FIELDS[intent] ?? [];
  const missingRequired = required.filter(
    (field) => !fieldPresent(intent, field, data)
  );

  if (missingRequired.length > 0) {
    const nextField = missingRequired[0];
    console.log(`❌ Missing REQUIRED field: ${nextField}`);
    return {
      isComplete: false,
      nextQuestion: generateQuestion(nextField, intent),
      missingRequired,
      nextField,
    };
  }

  console.log("✅ All required fields present");

  const progressive = PROGRESSIVE_FIELDS[intent] ?? [];
  for (const field of progressive) {
    const ok = fieldPresent(intent, field, data);
    console.log(`🔍 Checking progressive "${field}":`, data[field], "ok:", ok);
    if (!ok) {
      console.log(`❌ Missing PROGRESSIVE field: ${field}`);
      return {
        isComplete: false,
        nextQuestion: `${generateQuestion(field, intent)} (si prefieres, di «omitir» y usaré un valor por defecto razonable.)`,
        missingRequired: [],
        nextField: field,
      };
    }
  }

  console.log("✅ All fields complete!");
  return {
    isComplete: true,
    nextQuestion: null,
    missingRequired: [],
    nextField: null,
  };
}

/** Quita metadatos internos antes de validar con Zod / generate-ui. */
export function stripConversationMeta(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of Object.keys(out)) {
    if (key.startsWith("_")) delete out[key];
  }
  return out;
}

const TRAVEL_KEYS = [
  "destination",
  "duration",
  "budget",
  "currency",
  "interests",
  "travelers",
  "travelStyle",
  "departureDate",
  "flexibility",
] as const;

const FITNESS_KEYS = [
  "goal",
  "timeframe",
  "currentLevel",
  "restrictions",
  "equipment",
  "daysPerWeek",
  "dietaryPreferences",
  "currentWeight",
  "targetWeight",
  "height",
  "age",
  "gender",
] as const;

const DEV_KEYS = [
  "projectType",
  "timeframe",
  "timeframeWeeks",
  "currentSkills",
  "targetStack",
  "learningGoal",
  "experience",
  "studyTimePerWeek",
] as const;

function takeExtractedValue(key: string, v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  if (key === "interests" || key === "targetStack" || key === "restrictions" || key === "dietaryPreferences" || key === "currentSkills") {
    return Array.isArray(v) && v.length > 0;
  }
  return true;
}

/** Fusiona solo claves conocidas del objeto devuelto por /api/analyze. */
export function mergeExtractedIntoCollected(
  intent: ConversationIntent,
  collected: Record<string, unknown>,
  extracted: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...collected };
  const keys =
    intent === "travel"
      ? TRAVEL_KEYS
      : intent === "fitness"
        ? FITNESS_KEYS
        : DEV_KEYS;
  for (const key of keys) {
    const v = extracted[key];
    if (takeExtractedValue(key, v)) out[key] = v;
  }
  return out;
}
