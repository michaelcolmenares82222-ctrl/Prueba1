import type { Parameter } from "@copilotkit/shared";
import {
  TravelContextSchema,
  DevContextSchema,
  FitnessContextSchema,
} from "./schemas";

// ============================================================
// Esquemas de tools para CopilotKit.
// ------------------------------------------------------------
// Reglas de oro aprendidas:
//   - TODOS los parámetros opcionales (LLM rellena solo lo que el
//     usuario mencionó en ese turno).
//   - Tipos primitivos (string|number|boolean). Sin arrays anidados,
//     sin enums Zod-style: para listas usamos string CSV y partimos
//     en el handler.
//   - Hay UN parámetro por cada campo que el ConversationManager
//     puede llegar a pedir; si falta, el LLM no tiene dónde meter la
//     respuesta del usuario y entramos en loop.
//   - `omit` (boolean) → el usuario quiere saltar la pregunta actual;
//     el handler rellena ese campo con un default razonable.
// ============================================================

const OMIT_PARAM: Parameter = {
  name: "omit",
  type: "boolean",
  description:
    "true si el usuario dijo 'omitir', 'no sé', 'da igual', 'cualquiera' o similar — el sistema rellenará un valor por defecto razonable.",
  required: false,
};

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
  {
    name: "travelStyle",
    type: "string",
    description:
      "Estilo de viaje: 'mochilero' (budget), 'estandar' (standard) o 'lujo' (luxury).",
    required: false,
  },
  OMIT_PARAM,
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
    name: "targetWeight",
    type: "number",
    description: "Peso objetivo del usuario en kilogramos.",
    required: false,
  },
  {
    name: "height",
    type: "number",
    description:
      "Altura del usuario en centímetros (si dice 1.75 m, conviértelo a 175).",
    required: false,
  },
  {
    name: "age",
    type: "number",
    description: "Edad del usuario en años.",
    required: false,
  },
  {
    name: "currentLevel",
    type: "string",
    description:
      "Nivel actual del usuario: 'principiante', 'intermedio' o 'avanzado'.",
    required: false,
  },
  {
    name: "daysPerWeek",
    type: "number",
    description: "Días que el usuario puede entrenar a la semana (1-7).",
    required: false,
  },
  OMIT_PARAM,
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
  {
    name: "timeframe",
    type: "string",
    description:
      "Plazo para lograr el objetivo (texto libre): '3 meses', '6 semanas', 'un año'…",
    required: false,
  },
  {
    name: "targetStack",
    type: "string",
    description:
      "Tecnologías de interés separadas por coma: 'React, Node, PostgreSQL'.",
    required: false,
  },
  {
    name: "studyTimePerWeek",
    type: "number",
    description: "Horas a la semana que el usuario puede dedicar a aprender.",
    required: false,
  },
  OMIT_PARAM,
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
