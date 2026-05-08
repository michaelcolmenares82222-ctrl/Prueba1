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
  const prompt = `
Genera un plan de viaje detallado para:
- Destino: ${context.destination}
- Duración: ${context.duration} días
- Presupuesto: ${context.budget ? `$${context.budget} ${context.currency}` : "Flexible"}
- Viajeros: ${context.travelers}
- Intereses: ${context.interests.join(", ") || "General"}
- Estilo: ${context.travelStyle}

Estructura la respuesta como un JSON con:
1. itinerary: array de días, cada día con actividades por momento (mañana/tarde/noche)
2. budget: desglose detallado (vuelos, alojamiento, comidas, actividades, transporte, emergencias)
3. recommendations: lugares específicos, restaurantes, tips
4. bookingLinks: sugerencias de dónde buscar/reservar

Sé específico, práctico y realista con los precios.
  `.trim();

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un experto planificador de viajes con conocimiento actualizado de destinos, precios y logística.",
    temperature: 0.7,
    maxTokens: 2000,
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
  const prompt = `
Crea un roadmap de desarrollo para:
- Proyecto: ${context.projectType}
- Plazo: ${context.timeframe} (${context.timeframeWeeks || "?"} semanas)
- Skills actuales: ${context.currentSkills.join(", ") || "Ninguno"}
- Stack objetivo: ${context.targetStack.join(", ")}
- Objetivo: ${context.learningGoal}
- Nivel: ${context.experience}
- Horas/semana: ${context.studyTimePerWeek}

Estructura la respuesta como JSON con:
1. timeline: fases con semanas, objetivos y entregables
2. techStack: tecnologías recomendadas con justificación
3. resources: cursos, docs, tutoriales, proyectos práctica
4. milestones: checkpoints importantes con criterios de éxito

Sé realista con los tiempos y progresivo en dificultad.
  `.trim();

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un mentor senior de desarrollo de software con experiencia en enseñanza y arquitectura.",
    temperature: 0.7,
    maxTokens: 2000,
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
  const prompt = `
Diseña un plan de fitness para:
- Objetivo: ${context.goal}
- Plazo: ${context.timeframe} semanas
- Nivel: ${context.currentLevel}
- Equipo: ${context.equipment}
- Días/semana: ${context.daysPerWeek}
- Restricciones: ${context.restrictions.join(", ") || "Ninguna"}
- Dieta: ${context.dietaryPreferences?.join(", ") || "Sin restricciones"}

Estructura la respuesta como JSON con:
1. workout: plan semanal con ejercicios específicos (sets, reps, descanso)
2. nutrition: macros diarios, ejemplos de comidas, hidratación
3. progression: cómo aumentar intensidad semana a semana
4. tips: consejos de forma, prevención lesiones, motivación

IMPORTANTE: Incluye disclaimers de salud apropiados.
Sé específico pero seguro.
  `.trim();

  const response = await groqCompletion(prompt, {
    systemPrompt:
      "Eres un entrenador certificado con conocimiento en nutrición deportiva y prevención de lesiones.",
    temperature: 0.7,
    maxTokens: 2000,
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

export async function generateUI(intent: string, context: any) {
  switch (intent) {
    case "travel":
      return generateTravelUI(context);
    case "development":
      return generateDevUI(context);
    case "fitness":
      return generateFitnessUI(context);
    default:
      throw new Error(`Unsupported intent: ${intent}`);
  }
}
