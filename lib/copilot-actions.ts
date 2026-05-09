import type { Parameter } from "@copilotkit/shared";
import {
  TravelContextSchema,
  DevContextSchema,
  FitnessContextSchema,
} from "./schemas";

// ============================================================
// Esquemas estructurados pero MUY simples para Groq.
// ------------------------------------------------------------
// Aprendizaje del bug `tool_use_failed`:
//   - Un solo `userMessage: string` también confunde al modelo.
//   - Schemas con arrays / objects anidados / enums lo rompen.
//   - Lo que SÍ funciona: 2-3 parámetros primitivos
//     (string|number) TODOS opcionales, con descripciones claras.
// El handler en `app/page.tsx` reconstruye una frase a partir de
// estos args, llama a /api/analyze para extraer el resto del
// contexto y luego ejecuta el flujo correspondiente.
// ============================================================

const TRAVEL_PARAMS: Parameter[] = [
  {
    name: "destination",
    type: "string",
    description: "Ciudad o país que el usuario quiere visitar.",
    required: false,
  },
  {
    name: "duration",
    type: "number",
    description: "Duración del viaje en días.",
    required: false,
  },
  {
    name: "budget",
    type: "number",
    description: "Presupuesto total del viaje en USD.",
    required: false,
  },
  {
    name: "travelers",
    type: "number",
    description: "Número de personas que viajan (1 si va solo).",
    required: false,
  },
  {
    name: "interests",
    type: "string",
    description:
      "Intereses separados por coma: cultura, gastronomía, playa, naturaleza…",
    required: false,
  },
];

const FITNESS_PARAMS: Parameter[] = [
  {
    name: "goal",
    type: "string",
    description:
      "Objetivo en español del usuario. Ejemplos: 'bajar peso', 'ganar músculo', 'tonificar', 'mejorar resistencia'.",
    required: false,
  },
  {
    name: "currentWeight",
    type: "number",
    description: "Peso actual del usuario en kilogramos.",
    required: false,
  },
  {
    name: "height",
    type: "number",
    description: "Altura del usuario en centímetros.",
    required: false,
  },
];

const DEV_PARAMS: Parameter[] = [
  {
    name: "goal",
    type: "string",
    description:
      "Qué quiere aprender el usuario. Ejemplos: 'React', 'Python para data science', 'desarrollo backend'.",
    required: false,
  },
  {
    name: "currentLevel",
    type: "string",
    description:
      "Nivel actual del usuario: 'principiante', 'intermedio' o 'avanzado'.",
    required: false,
  },
];

export const COPILOT_ACTIONS = {
  generateTravelPlan: {
    name: "generate_travel_plan",
    description:
      "Genera un plan de viaje personalizado cuando el usuario menciona viajar, visitar o conocer un lugar.",
    parameters: TRAVEL_PARAMS,
    schema: TravelContextSchema,
  },
  generateFitnessPlan: {
    name: "generate_fitness_plan",
    description:
      "Genera un plan de fitness personalizado cuando el usuario menciona objetivos físicos (bajar peso, ganar músculo, tonificar, resistencia, etc.).",
    parameters: FITNESS_PARAMS,
    schema: FitnessContextSchema,
  },
  generateDevRoadmap: {
    name: "generate_dev_roadmap",
    description:
      "Genera un roadmap de aprendizaje cuando el usuario quiere aprender a programar, una tecnología, un stack o un rol técnico.",
    parameters: DEV_PARAMS,
    schema: DevContextSchema,
  },
};

export type CopilotActionName = keyof typeof COPILOT_ACTIONS;
