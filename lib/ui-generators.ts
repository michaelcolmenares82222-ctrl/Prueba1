import { groqCompletion } from "./groq";
import {
  TravelContext,
  DevContext,
  FitnessContext,
} from "./types";
import {
  enrichTravelContext,
  type EnrichedTravelContext,
} from "./mcp";
// Perf logs: silence with PERF_LOG=0.
import { logStep, perfStart } from "./perf-log";

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

  const prompt = `Plan de viaje a ${context.destination}, ${context.duration} días, ${
    totalBudget > 0 ? `presupuesto ${totalBudget} ${currency}` : "presupuesto flexible"
  }, ${context.travelers} viajero(s), estilo ${context.travelStyle} (${styleHint}). Intereses: ${interests}.${
    context.departureDate ? ` Salida: ${context.departureDate}.` : ""
  }

Reglas:
1. NOMBRES REALES de barrios/restaurantes/atracciones de ${context.destination}. NADA de "Exploración matutina" o "Cena y descanso".
2. Cubre los ${context.duration} días con morning, afternoon, evening. Cada actividad: title, description (1-2 frases), duration, location, cost (número en ${currency}; 0 si gratis).
3. budgetBreakdown suma ${totalBudget > 0 ? `≈ ${totalBudget}` : "cifra realista"} ${currency}. Referencia: ${JSON.stringify(exampleBreakdown)}.
4. recommendations: 6-8 ítems con category, title (nombre real), description, price opcional ("$"/"$$"/"$$$").
5. SOLO JSON, sin markdown.

Esquema:
{"itinerary":[{"day":1,"date":"Día 1","morning":{"title":"","description":"","duration":"","location":"","cost":0},"afternoon":{...},"evening":{...}}],"budgetBreakdown":{"flights":0,"accommodation":0,"food":0,"activities":0,"transport":0,"emergency":0,"total":0},"recommendations":[{"category":"","title":"","description":"","price":"$$"}]}`;

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un planificador de viajes con conocimiento real. Respondes SOLO un objeto JSON válido (sin markdown, sin texto extra). La palabra json es obligatoria.",
    // temperature 0 → más determinístico y ligeramente más rápido.
    // El cache de /api/generate-ui sólo depende del contexto, así que
    // bajar la temperatura no rompe nada.
    temperature: 0,
    maxTokens: 2200,
    responseFormat: { type: "json_object" },
  });

  return {
    type: "travel" as const,
    context,
    content: response,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Travel plan generator that fans out to the LLM **and** the MCP toolbox in
 * parallel via `Promise.all`, then merges the live enrichment back in as
 * `realData`. Falls back gracefully:
 *
 * - If MCP fails (rejection or `null`), the field is simply omitted; the LLM
 *   plan is still returned untouched.
 * - The LLM call is awaited the same way as `generateTravelUI`, so latency is
 *   `max(LLM, MCP)` rather than `LLM + MCP`.
 *
 * Not wired into `app/page.tsx` by default to avoid risk on the existing
 * Copilot flow; consumers can opt in (e.g. behind
 * `NEXT_PUBLIC_ENABLE_MCP_ENRICHMENT === "1"`).
 */
export async function generateTravelPlanEnriched(context: TravelContext) {
  // `t_total ≈ max(t_llm, t_mcp)` por Promise.all. Si ves
  // `t_total ≈ t_llm + t_mcp` algo está bloqueando.
  const t_total = perfStart();
  const t_llm = perfStart();
  const llmPromise = generateTravelUI(context).then((r) => {
    logStep("travel:llm", t_llm);
    return r;
  });

  const t_mcp = perfStart();
  const mcpPromise = enrichTravelContext(
    context.destination,
    context.currency ?? "USD"
  )
    .catch((err) => {
      console.error("[ui-generators] MCP enrichment failed:", err);
      return null;
    })
    .then((r) => {
      logStep("travel:mcp", t_mcp, { ok: r != null });
      return r;
    });

  const [llm, mcp] = await Promise.all([llmPromise, mcpPromise]);
  logStep("travel:enriched-total", t_total, { mcp: mcp != null });

  if (!mcp) {
    return llm;
  }

  return {
    ...llm,
    realData: mcp satisfies EnrichedTravelContext,
  };
}

// ============================================
// Development UI Generator
// ============================================

export async function generateDevUI(context: DevContext) {
  const weeks =
    context.timeframeWeeks ?? Math.max(4, Math.round(context.studyTimePerWeek ?? 8));

  const prompt = `Roadmap para: ${context.projectType}. Plazo: ${context.timeframe} (~${weeks} semanas). Nivel: ${context.experience}. Horas/semana: ${
    context.studyTimePerWeek ?? 8
  }. Objetivo: ${context.learningGoal}.${
    context.currentSkills.length > 0
      ? ` Skills actuales: ${context.currentSkills.join(", ")}.`
      : ""
  }${
    context.targetStack.length > 0
      ? ` Stack objetivo: ${context.targetStack.join(", ")}.`
      : ""
  }

Reglas:
1. timeline: 3-4 fases. Cada una: name, weeks (número), objectives (3-4 puntos concretos), deliverables (medibles, ej "App CRUD en Vercel").
2. techStack: 5-7 tecnologías con name, category (framework/lenguaje/herramienta...), difficulty (beginner/intermediate/advanced), reason (por qué encaja).
3. resources: 5-7 ítems con title, type (course/doc/video/project), url (REAL: react.dev, nextjs.org, developer.mozilla.org, freecodecamp.org...), description corta.
4. SOLO JSON, sin markdown.

Esquema:
{"timeline":[{"name":"","weeks":0,"objectives":[""],"deliverables":[""]}],"techStack":[{"name":"","category":"","difficulty":"beginner","reason":""}],"resources":[{"title":"","type":"course","url":"https://","description":""}]}`;

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un mentor senior de software con conocimiento actualizado. Respondes SOLO un objeto JSON válido (sin texto extra ni markdown). La palabra json es obligatoria.",
    temperature: 0,
    maxTokens: 1800,
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

  const prompt = `Plan de fitness. Objetivo: ${goalLabel}. ${context.timeframe} semanas. Nivel: ${context.currentLevel}. Equipo: ${context.equipment}. ${days} días/semana entrenables.${
    context.restrictions.length > 0
      ? ` Restricciones: ${context.restrictions.join(", ")}.`
      : ""
  }${
    context.dietaryPreferences && context.dietaryPreferences.length > 0
      ? ` Dieta: ${context.dietaryPreferences.join(", ")}.`
      : ""
  }

Reglas:
1. weeklyPlan: claves EXACTAS "lunes","martes","miércoles","jueves","viernes","sábado","domingo" (con tilde). Cada día: focus, exercises[], restDay opcional. ${days} días con entrenamiento enfocado a "${goalLabel}", el resto descanso (exercises=[] y restDay=true).
2. Cada exercise: name (real), sets (número), reps (string ej "8-12"), rest (ej "60s"). notes opcional.
3. nutrition: calories, protein, carbs, fats (gramos) realistas; meals con 3-4 ejemplos (meal, foods[], macros).
4. progression: 3-5 frases de cómo subir intensidad.
5. SOLO JSON, sin markdown.

Esquema:
{"weeklyPlan":{"lunes":{"focus":"","exercises":[{"name":"","sets":4,"reps":"8-12","rest":"90s"}]},"martes":{...},"miércoles":{"focus":"Descanso","exercises":[],"restDay":true},"jueves":{...},"viernes":{...},"sábado":{"focus":"Descanso","exercises":[],"restDay":true},"domingo":{"focus":"Descanso","exercises":[],"restDay":true}},"nutrition":{"calories":0,"protein":0,"carbs":0,"fats":0,"meals":[{"meal":"Desayuno","foods":[""],"macros":{"protein":0,"carbs":0,"fats":0}}]},"progression":[""]}`;

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un entrenador certificado. Respondes SOLO un objeto JSON válido (sin texto extra ni markdown). La palabra json es obligatoria.",
    temperature: 0,
    maxTokens: 1800,
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
