import { groqCompletion } from "./groq";
import {
  TravelContext,
  DevContext,
  FitnessContext,
} from "./types";

// ============================================
// Travel UI Generator
// ============================================

export async function generateTravelUI(context: TravelContext) {
  const totalBudget = context.budget ?? 0;
  const currency = context.currency ?? "USD";
  const interests =
    context.interests.length > 0 ? context.interests.join(", ") : "general";

  const styleHint =
    context.travelStyle === "luxury"
      ? "Hoteles 4-5*, restaurantes premium, transporte privado, experiencias exclusivas."
      : context.travelStyle === "budget"
        ? "Hostales o Airbnb económicos, comida callejera local, transporte público, atracciones gratuitas o low-cost."
        : "Hoteles 3*, mezcla de comida local y restaurantes mid-range, transporte público + algún taxi.";

  const sampleBudget = totalBudget > 0 ? totalBudget : 2000;
  const exampleBreakdown = {
    flights: Math.round(sampleBudget * 0.35),
    accommodation: Math.round(sampleBudget * 0.25),
    food: Math.round(sampleBudget * 0.2),
    activities: Math.round(sampleBudget * 0.15),
    transport: Math.round(sampleBudget * 0.03),
    emergency: Math.round(sampleBudget * 0.02),
    total: sampleBudget,
  };

  const prompt = `
Eres un planificador de viajes experto. Genera un plan REAL y ESPECÍFICO.

DATOS DEL VIAJE
- Destino: ${context.destination}
- Duración: ${context.duration} días
- Presupuesto total: ${totalBudget > 0 ? `${totalBudget} ${currency}` : "flexible"}
- Viajeros: ${context.travelers}
- Estilo: ${context.travelStyle} (${styleHint})
- Intereses: ${interests}
${context.departureDate ? `- Salida estimada: ${context.departureDate}` : ""}

REGLAS OBLIGATORIAS
1. Usa NOMBRES REALES de lugares, barrios, restaurantes y atracciones de ${context.destination}.
   PROHIBIDO escribir frases genéricas como "Exploración matutina", "Visita los principales puntos de interés",
   "Almuerzo y actividades" o "Cena y descanso". Cada actividad debe identificar un lugar concreto.
2. Cubre los ${context.duration} días. Cada día con \`morning\`, \`afternoon\` y \`evening\`.
3. Cada actividad debe incluir: \`title\` (nombre real), \`description\` (qué se hace, por qué importa),
   \`duration\` (ej: "2-3 horas"), \`location\` (barrio o dirección breve) y \`cost\` (número en ${currency},
   estimado real para ese lugar; usa 0 si es gratuito). NO inventes precios absurdos.
4. \`budgetBreakdown\` debe sumar ${totalBudget > 0 ? `≈ ${totalBudget}` : "una cifra realista"} ${currency}
   y respetar el estilo "${context.travelStyle}". Usa esta proporción base como referencia y ajusta:
   ${JSON.stringify(exampleBreakdown)}.
5. \`recommendations\` debe traer entre 6 y 10 ítems agrupables por \`category\`. Categorías sugeridas:
   "Lugares imperdibles", "Gastronomía", "Tips de viaje", "Para tus intereses (${interests})".
   Cada recomendación con \`title\` (nombre real), \`description\` (1-2 frases concretas) y opcionalmente
   \`price\` ("$", "$$", "$$$" o un rango como "20-40 ${currency}").
6. NO incluyas explicaciones ni texto fuera del JSON. NO uses bloques markdown.

ESQUEMA JSON EXACTO
{
  "itinerary": [
    {
      "day": 1,
      "date": "Día 1",
      "morning": { "title": "...", "description": "...", "duration": "...", "location": "...", "cost": 0 },
      "afternoon": { "title": "...", "description": "...", "duration": "...", "location": "...", "cost": 0 },
      "evening":   { "title": "...", "description": "...", "duration": "...", "location": "...", "cost": 0 }
    }
  ],
  "budgetBreakdown": {
    "flights": 0, "accommodation": 0, "food": 0,
    "activities": 0, "transport": 0, "emergency": 0, "total": 0
  },
  "recommendations": [
    { "category": "Lugares imperdibles", "title": "Nombre real", "description": "...", "price": "$$" }
  ]
}
`.trim();

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un planificador de viajes con conocimiento actualizado de destinos, precios y atracciones reales. Respondes SIEMPRE con un único objeto JSON válido (sin texto extra, sin markdown). La palabra json es obligatoria.",
    temperature: 0.6,
    maxTokens: 4000,
    responseFormat: { type: "json_object" },
  });

  return {
    type: "travel" as const,
    context,
    content: response,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// Development UI Generator
// ============================================

export async function generateDevUI(context: DevContext) {
  const weeks =
    context.timeframeWeeks ?? Math.max(4, Math.round(context.studyTimePerWeek ?? 8));

  const prompt = `
Eres un mentor senior de software. Genera un roadmap REAL y específico.

DATOS
- Tipo de proyecto / rol objetivo: ${context.projectType}
- Plazo: ${context.timeframe} (~${weeks} semanas)
- Skills actuales: ${context.currentSkills.join(", ") || "ninguno relevante"}
- Stack objetivo: ${context.targetStack.join(", ") || "a recomendar"}
- Objetivo: ${context.learningGoal}
- Nivel: ${context.experience}
- Horas/semana disponibles: ${context.studyTimePerWeek ?? 8}

REGLAS
1. \`timeline\` debe traer 3 a 5 fases. Cada fase con \`name\`, \`weeks\` (número), \`objectives\` (3-5 frases con
   conceptos concretos) y \`deliverables\` (entregables medibles, ej. "App CRUD desplegada en Vercel").
2. \`techStack\` debe listar 5-8 tecnologías con \`name\`, \`category\` ("framework", "lenguaje", "herramienta", etc.),
   \`difficulty\` ("beginner" | "intermediate" | "advanced") y \`reason\` (por qué encaja con el objetivo).
3. \`resources\` debe traer 5-8 ítems con \`title\`, \`type\` ("course" | "doc" | "video" | "project"),
   \`url\` (enlace REAL a recurso oficial: docs, freeCodeCamp, MDN, YouTube channels conocidos, etc.) y
   \`description\` corta. NO inventes URLs; usa dominios oficiales (react.dev, nextjs.org, developer.mozilla.org, etc.).
4. NO uses markdown ni texto fuera del JSON.

ESQUEMA JSON EXACTO
{
  "timeline": [
    { "name": "...", "weeks": 0, "objectives": ["..."], "deliverables": ["..."] }
  ],
  "techStack": [
    { "name": "...", "category": "...", "difficulty": "beginner", "reason": "..." }
  ],
  "resources": [
    { "title": "...", "type": "course", "url": "https://...", "description": "..." }
  ]
}
`.trim();

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un mentor senior de software con conocimiento actualizado. Respondes con un único objeto JSON válido (sin texto extra ni markdown). La palabra json es obligatoria.",
    temperature: 0.5,
    maxTokens: 3500,
    responseFormat: { type: "json_object" },
  });

  return {
    type: "development" as const,
    context,
    content: response,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// Fitness UI Generator
// ============================================

export async function generateFitnessUI(context: FitnessContext) {
  const days = context.daysPerWeek ?? 4;
  const goalLabel = context.goal.replace(/_/g, " ");

  const prompt = `
Eres un entrenador certificado. Genera un plan de fitness REAL y específico.

DATOS
- Objetivo: ${goalLabel}
- Plazo: ${context.timeframe} semanas
- Nivel: ${context.currentLevel}
- Equipo disponible: ${context.equipment}
- Días entrenables: ${days} por semana
- Restricciones: ${context.restrictions.join(", ") || "ninguna"}
- Preferencias dietarias: ${context.dietaryPreferences?.join(", ") || "sin restricciones"}

REGLAS
1. \`weeklyPlan\` es un objeto cuyas claves DEBEN ser exactamente:
   "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo" (en español, minúsculas, con tilde).
   Cada día con \`focus\` (string), \`exercises\` (array) y opcional \`restDay\` (true sólo si es descanso).
   En días de descanso \`exercises\` es \`[]\`.
2. Asigna ${days} días a entrenamientos enfocados al objetivo ("${goalLabel}") y los restantes como descanso.
3. Cada \`exercise\` debe traer \`name\` (ejercicio real), \`sets\` (número), \`reps\` (string, ej. "8-12" o "60s")
   y \`rest\` (string, ej. "60s", "90s"). Opcional \`notes\` con tips de forma o seguridad.
4. \`nutrition\` con \`calories\`, \`protein\`, \`carbs\`, \`fats\` (gramos) realistas para el objetivo,
   y \`meals\` con 3-4 ejemplos. Cada meal con \`meal\` (Desayuno/Almuerzo/Cena/Snack), \`foods\` (array de strings)
   y \`macros\` (\`protein\`, \`carbs\`, \`fats\` en gramos).
5. \`progression\` array de 3-6 strings con cómo subir intensidad semana a semana.
6. NO uses markdown ni texto fuera del JSON.

ESQUEMA JSON EXACTO
{
  "weeklyPlan": {
    "lunes":     { "focus": "...", "exercises": [ { "name": "...", "sets": 4, "reps": "8-12", "rest": "90s" } ] },
    "martes":    { "focus": "...", "exercises": [ ... ] },
    "miércoles": { "focus": "Descanso", "exercises": [], "restDay": true },
    "jueves":    { "focus": "...", "exercises": [ ... ] },
    "viernes":   { "focus": "...", "exercises": [ ... ] },
    "sábado":    { "focus": "Descanso", "exercises": [], "restDay": true },
    "domingo":   { "focus": "Descanso", "exercises": [], "restDay": true }
  },
  "nutrition": {
    "calories": 0, "protein": 0, "carbs": 0, "fats": 0,
    "meals": [
      { "meal": "Desayuno", "foods": ["..."], "macros": { "protein": 0, "carbs": 0, "fats": 0 } }
    ]
  },
  "progression": ["..."]
}
`.trim();

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un entrenador certificado con conocimiento en nutrición deportiva y prevención de lesiones. Respondes con un único objeto JSON válido (sin texto extra ni markdown). La palabra json es obligatoria.",
    temperature: 0.5,
    maxTokens: 3500,
    responseFormat: { type: "json_object" },
  });

  return {
    type: "fitness" as const,
    context,
    content: response,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// Router
// ============================================

export async function generateUI(intent: string, context: unknown) {
  switch (intent) {
    case "travel":
      return generateTravelUI(context as TravelContext);
    case "development":
      return generateDevUI(context as DevContext);
    case "fitness":
      return generateFitnessUI(context as FitnessContext);
    default:
      throw new Error(`Unsupported intent: ${intent}`);
  }
}
