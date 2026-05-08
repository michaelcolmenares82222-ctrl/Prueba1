import type {
  TravelPlan,
  DayPlan,
  BudgetBreakdown,
  DevRoadmap,
  FitnessPlan,
  NutritionGuide,
  WeeklyWorkout,
  Phase,
  Resource,
  TechItem,
  Recommendation,
} from "@/app/components/templates/types";
import type {
  TravelContext,
  DevContext,
  FitnessContext,
} from "@/lib/schemas";

// ============================================
// Parser Helpers
// ============================================

function cleanJsonString(str: string): string {
  let cleaned = str.replace(/```json\n?/g, "").replace(/```\n?/g, "");

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return cleaned.trim();
}

/**
 * Best-effort fixer for the most common JSON slips small models produce:
 *   - `"key","value"` (missing colon)         → `"key":"value"`
 *   - `"key",123` (numbers / true / false)    → `"key":123`
 *   - trailing commas before `}` / `]`
 *   - stray text after the closing brace
 */
function repairJson(input: string): string {
  let s = cleanJsonString(input);

  s = s.replace(/("\s*)(,\s*)(?=")/g, '":');
  s = s.replace(/("\s*)(,\s*)(?=(?:-?\d|true|false|null|\{|\[))/g, '":');
  s = s.replace(/,(\s*[}\]])/g, "$1");

  return s;
}

function extractJsonFromText(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(cleanJsonString(text));
    } catch {
      try {
        return JSON.parse(repairJson(text));
      } catch (lastError) {
        console.error("JSON parse failed even after repair:", lastError);
        return {};
      }
    }
  }
}

// ============================================
// Travel Parser
// ============================================

export function parseTravelPlan(
  content: string,
  context: TravelContext
): TravelPlan {
  const fallbackDuration: number = context.duration ?? 7;
  const fallbackBudget: number | undefined = context.budget;
  const fallbackCurrency: string = context.currency ?? "USD";
  const fallbackDestination: string = context.destination ?? "Destino";

  let data: Record<string, unknown> = {};
  try {
    data = content
      ? (extractJsonFromText(content) as Record<string, unknown>)
      : {};
  } catch (error) {
    console.error("Error parsing travel plan:", error);
    data = {};
  }

  const destJson = data.destination;
  const durationJson = data.duration;
  const budgetJson = data.budget;
  const currencyJson = data.currency;

  return {
    destination:
      fallbackDestination ??
      (typeof destJson === "string" ? destJson : "Destino"),
    duration:
      fallbackDuration ??
      (typeof durationJson === "number" ? durationJson : 7),
    budget:
      fallbackBudget ??
      (typeof budgetJson === "number" ? budgetJson : undefined),
    currency:
      fallbackCurrency ??
      (typeof currencyJson === "string" ? currencyJson : "USD"),
    itinerary:
      Array.isArray(data.itinerary) && data.itinerary.length > 0
        ? (data.itinerary as DayPlan[])
        : generateDefaultItinerary(fallbackDuration),
    budgetBreakdown:
      (data.budgetBreakdown as BudgetBreakdown | undefined) ??
      (typeof data.budget === "object" && data.budget !== null
        ? (data.budget as BudgetBreakdown)
        : undefined) ??
      generateDefaultBudget(fallbackBudget),
    recommendations: Array.isArray(data.recommendations)
      ? (data.recommendations as Recommendation[])
      : [],
  };
}

function generateDefaultItinerary(days: number): DayPlan[] {
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    morning: {
      title: "Exploración matutina",
      description: "Visita los principales puntos de interés",
      duration: "3 horas",
    },
    afternoon: {
      title: "Almuerzo y actividades",
      description: "Prueba la gastronomía local",
      duration: "4 horas",
    },
    evening: {
      title: "Cena y descanso",
      description: "Relájate y disfruta la noche",
      duration: "3 horas",
    },
  }));
}

function generateDefaultBudget(total?: number): BudgetBreakdown {
  const budget = total ?? 2000;
  return {
    flights: Math.round(budget * 0.35),
    accommodation: Math.round(budget * 0.25),
    food: Math.round(budget * 0.2),
    activities: Math.round(budget * 0.15),
    transport: Math.round(budget * 0.03),
    emergency: Math.round(budget * 0.02),
    total: budget,
  };
}

// ============================================
// Dev Parser
// ============================================

function normalizeDifficulty(
  raw: unknown
): "beginner" | "intermediate" | "advanced" {
  const s = String(raw ?? "").toLowerCase();
  if (s === "beginner" || s === "intermediate" || s === "advanced") return s;
  return "beginner";
}

function normalizeResourceType(raw: unknown): Resource["type"] {
  const s = String(raw ?? "").toLowerCase();
  if (s === "course" || s === "doc" || s === "video" || s === "project")
    return s;
  return "doc";
}

function defaultDevRoadmap(context: DevContext): DevRoadmap {
  const pt = context.projectType ?? "Desarrollo";
  const tf = context.timeframe ?? "3 meses";
  return {
    projectType: pt,
    timeframe: tf,
    phases: [
      {
        name: "Fundamentos",
        weeks: 4,
        objectives: [
          "Repasar sintaxis y herramientas base del stack elegido.",
          "Configurar entorno de desarrollo reproducible.",
        ],
        deliverables: [
          "Repo inicial con README y convenciones del proyecto.",
          "Mini-ejercicios o kata completados.",
        ],
      },
      {
        name: "Construcción",
        weeks: 6,
        objectives: [
          "Implementar features guiadas por tu objetivo: " +
            String(context.learningGoal ?? "aprender"),
        ],
        deliverables: [
          "Proyecto demo funcional (local o desplegado).",
          "Tests o checklist de calidad mínima.",
        ],
      },
      {
        name: "Consolidación",
        weeks: 2,
        objectives: [
          "Refinar código, documentar decisiones y preparar portfolio.",
        ],
        deliverables: [
          "README con arquitectura y próximos pasos.",
          "Lista de entrevistas o proyectos siguientes.",
        ],
      },
    ],
    techStack: [
      {
        name: "TypeScript",
        category: "lenguaje",
        difficulty: "intermediate",
        reason: "Tipado estático para escalar el proyecto con menos errores.",
      },
      {
        name: "Git",
        category: "herramienta",
        difficulty: "beginner",
        reason: "Control de versiones imprescindible para cualquier rol.",
      },
    ],
    resources: [
      {
        title: "MDN Web Docs",
        type: "doc",
        url: "https://developer.mozilla.org/",
        description: "Referencia oficial para HTML, CSS y JavaScript.",
      },
      {
        title: "freeCodeCamp",
        type: "course",
        url: "https://www.freecodecamp.org/",
        description: "Cursos gratuitos estructurados por tema.",
      },
    ],
  };
}

export function parseDevRoadmap(content: string, context: DevContext): DevRoadmap {
  let data: Record<string, unknown> = {};
  try {
    data = content ? (extractJsonFromText(content) as Record<string, unknown>) : {};
  } catch (error) {
    console.error("Error parsing dev roadmap JSON:", error);
    data = {};
  }

  const timeline = data.timeline ?? data.phases;
  const rawPhases = Array.isArray(timeline) ? timeline : [];
  const phases: Phase[] = rawPhases.map((p: Record<string, unknown>) => ({
    name: String(p.name ?? "Fase"),
    weeks: typeof p.weeks === "number" && p.weeks > 0 ? p.weeks : 2,
    objectives: Array.isArray(p.objectives)
      ? (p.objectives as unknown[]).map(String)
      : [],
    deliverables: Array.isArray(p.deliverables)
      ? (p.deliverables as unknown[]).map(String)
      : [],
  }));

  const rawStack = Array.isArray(data.techStack) ? data.techStack : [];
  const techStack: TechItem[] = rawStack.map((t: Record<string, unknown>) => ({
    name: String(t.name ?? "Tecnología"),
    category: String(t.category ?? "general"),
    difficulty: normalizeDifficulty(t.difficulty),
    reason: String(t.reason ?? ""),
  }));

  const rawRes = Array.isArray(data.resources) ? data.resources : [];
  const resources: Resource[] = rawRes.map((r: Record<string, unknown>) => ({
    title: String(r.title ?? "Recurso"),
    type: normalizeResourceType(r.type),
    url: String(r.url ?? "https://developer.mozilla.org/"),
    description: String(r.description ?? ""),
  }));

  const base = defaultDevRoadmap(context);
  const merged: DevRoadmap = {
    projectType: context.projectType ?? base.projectType,
    timeframe: context.timeframe ?? base.timeframe,
    phases: phases.length > 0 ? phases : base.phases,
    techStack: techStack.length > 0 ? techStack : base.techStack,
    resources: resources.length > 0 ? resources : base.resources,
  };

  return merged;
}

// ============================================
// Fitness Parser
// ============================================

export function parseFitnessPlan(
  content: string,
  context: FitnessContext
): FitnessPlan {
  const fallbackGoal: string = context.goal ?? "general";
  const fallbackTimeframe: number = context.timeframe ?? 12;

  let data: Record<string, unknown> = {};
  try {
    data = content
      ? (extractJsonFromText(content) as Record<string, unknown>)
      : {};
  } catch (error) {
    console.error("Error parsing fitness plan:", error);
    data = {};
  }

  const goalJson = data.goal;
  const timeframeJson = data.timeframe;

  return {
    goal:
      (typeof goalJson === "string" ? goalJson : fallbackGoal) ?? "general",
    timeframe:
      (typeof timeframeJson === "number" ? timeframeJson : fallbackTimeframe) ??
      12,
    weeklyPlan:
      (data.weeklyPlan as WeeklyWorkout | undefined) ??
      (data.workout as WeeklyWorkout | undefined) ??
      generateDefaultWeeklyPlan(),
    nutrition:
      (data.nutrition as NutritionGuide | undefined) ??
      generateDefaultNutrition(fallbackGoal),
    progression: Array.isArray(data.progression)
      ? data.progression
      : Array.isArray(data.tips)
        ? data.tips
        : [],
  };
}

function generateDefaultWeeklyPlan(): WeeklyWorkout {
  return {
    lunes: {
      focus: "Pecho y Tríceps",
      exercises: [
        { name: "Press de banca", sets: 4, reps: "8-12", rest: "90s" },
        {
          name: "Press inclinado",
          sets: 3,
          reps: "10-12",
          rest: "60s",
        },
        { name: "Fondos", sets: 3, reps: "hasta fallo", rest: "60s" },
      ],
    },
    martes: {
      focus: "Espalda y Bíceps",
      exercises: [
        { name: "Dominadas", sets: 4, reps: "8-12", rest: "90s" },
        { name: "Remo con barra", sets: 4, reps: "8-12", rest: "90s" },
        {
          name: "Curl con barra",
          sets: 3,
          reps: "10-12",
          rest: "60s",
        },
      ],
    },
    miércoles: {
      focus: "Descanso",
      exercises: [],
      restDay: true,
    },
    jueves: {
      focus: "Piernas",
      exercises: [
        { name: "Sentadillas", sets: 4, reps: "8-12", rest: "120s" },
        {
          name: "Peso muerto rumano",
          sets: 4,
          reps: "10-12",
          rest: "90s",
        },
        {
          name: "Zancadas",
          sets: 3,
          reps: "12 por pierna",
          rest: "60s",
        },
      ],
    },
    viernes: {
      focus: "Hombros y Core",
      exercises: [
        { name: "Press militar", sets: 4, reps: "8-12", rest: "90s" },
        {
          name: "Elevaciones laterales",
          sets: 3,
          reps: "12-15",
          rest: "60s",
        },
        { name: "Plancha", sets: 3, reps: "60s", rest: "60s" },
      ],
    },
    sábado: { focus: "Descanso", exercises: [], restDay: true },
    domingo: { focus: "Descanso", exercises: [], restDay: true },
  };
}

function generateDefaultNutrition(goal: string): NutritionGuide {
  const baseCalories =
    goal === "weight_loss"
      ? 1800
      : goal === "muscle_gain"
        ? 2800
        : 2200;

  return {
    calories: baseCalories,
    protein: Math.round((baseCalories * 0.3) / 4),
    carbs: Math.round((baseCalories * 0.45) / 4),
    fats: Math.round((baseCalories * 0.25) / 9),
    meals: [
      {
        meal: "Desayuno",
        foods: ["3 huevos", "Avena con frutas", "Café"],
        macros: { protein: 25, carbs: 45, fats: 15 },
      },
      {
        meal: "Almuerzo",
        foods: [
          "Pechuga de pollo 200g",
          "Arroz integral",
          "Vegetales",
        ],
        macros: { protein: 45, carbs: 60, fats: 10 },
      },
      {
        meal: "Cena",
        foods: ["Salmón 150g", "Batata", "Ensalada"],
        macros: { protein: 35, carbs: 40, fats: 20 },
      },
    ],
  };
}
