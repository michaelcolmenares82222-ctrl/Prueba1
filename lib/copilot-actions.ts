import type { Parameter } from "@copilotkit/shared";
import {
  TravelContextSchema,
  DevContextSchema,
  FitnessContextSchema,
} from "./schemas";

// ============================================
// Action Definitions
// ============================================

const travelParameters: Parameter[] = [
  {
    name: "context",
    type: "object",
    description: "Contexto del viaje extraído del usuario",
    required: true,
  },
];

const devParameters: Parameter[] = [
  {
    name: "context",
    type: "object",
    description: "Contexto del proyecto de desarrollo",
    required: true,
  },
];

const fitnessParameters: Parameter[] = [
  {
    name: "context",
    type: "object",
    description: "Contexto del objetivo fitness",
    required: true,
  },
];

export const COPILOT_ACTIONS = {
  // Acción: Generar plan de viaje
  generateTravelPlan: {
    name: "generate_travel_plan",
    description:
      "Genera un plan de viaje completo con itinerario, presupuesto y recomendaciones",
    parameters: travelParameters,
    schema: TravelContextSchema,
  },

  // Acción: Generar roadmap de desarrollo
  generateDevRoadmap: {
    name: "generate_dev_roadmap",
    description:
      "Genera un roadmap de aprendizaje para desarrollo de software",
    parameters: devParameters,
    schema: DevContextSchema,
  },

  // Acción: Generar plan fitness
  generateFitnessPlan: {
    name: "generate_fitness_plan",
    description:
      "Genera un plan de entrenamiento y nutrición personalizado",
    parameters: fitnessParameters,
    schema: FitnessContextSchema,
  },
};

// ============================================
// Helper Types
// ============================================

export type CopilotActionName = keyof typeof COPILOT_ACTIONS;
