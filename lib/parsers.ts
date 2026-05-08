import type {
  TravelPlan,
  DayPlan,
  BudgetBreakdown,
  DevRoadmap,
  FitnessPlan,
  NutritionGuide,
  WeeklyWorkout,
} from "@/app/components/templates/types";

// ============================================
// Parser Helpers
// ============================================

function cleanJsonString(str: string): string {
  // Remover markdown code blocks
  let cleaned = str.replace(/```json\n?/g, "").replace(/```\n?/g, "");

  // Remover texto antes/después del JSON
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  return cleaned.trim();
}

function extractJsonFromText(text: string): any {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = cleanJsonString(text);
    return JSON.parse(cleaned);
  }
}

// ============================================
// Travel Parser
// ============================================

export function parseTravelPlan(
  content: string,
  context: any
): TravelPlan {
  const fallbackDuration: number = context?.duration ?? 7;
  const fallbackBudget: number | undefined = context?.budget;
  const fallbackCurrency: string = context?.currency ?? "USD";
  const fallbackDestination: string = context?.destination ?? "Destino";

  let data: any = {};
  try {
    data = content ? extractJsonFromText(content) : {};
  } catch (error) {
    console.error("Error parsing travel plan:", error);
    data = {};
  }

  return {
    destination: fallbackDestination ?? data.destination ?? "Destino",
    duration: fallbackDuration ?? data.duration ?? 7,
    budget: fallbackBudget ?? data.budget,
    currency: fallbackCurrency ?? data.currency ?? "USD",
    itinerary:
      Array.isArray(data.itinerary) && data.itinerary.length > 0
        ? (data.itinerary as DayPlan[])
        : generateDefaultItinerary(fallbackDuration),
    budgetBreakdown:
      data.budgetBreakdown ??
      (typeof data.budget === "object" ? data.budget : undefined) ??
      generateDefaultBudget(fallbackBudget),
    recommendations: Array.isArray(data.recommendations)
      ? data.recommendations
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
// Dev Parser (placeholder para siguiente fase)
// ============================================

export function parseDevRoadmap(
  _content: string,
  _context: any
): DevRoadmap {
  // Implementar después
  return {} as DevRoadmap;
}

// ============================================
// Fitness Parser
// ============================================

export function parseFitnessPlan(
  content: string,
  context: any
): FitnessPlan {
  const fallbackGoal: string = context?.goal ?? "general";
  const fallbackTimeframe: number = context?.timeframe ?? 12;

  let data: any = {};
  try {
    data = content ? extractJsonFromText(content) : {};
  } catch (error) {
    console.error("Error parsing fitness plan:", error);
    data = {};
  }

  return {
    goal: fallbackGoal ?? data.goal ?? "general",
    timeframe: fallbackTimeframe ?? data.timeframe ?? 12,
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
