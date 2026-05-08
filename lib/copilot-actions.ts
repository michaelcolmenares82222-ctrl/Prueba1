import type { Parameter } from "@copilotkit/shared";
import {
  TravelContextSchema,
  DevContextSchema,
  FitnessContextSchema,
} from "./schemas";

const OMIT = "Omit if user did not mention it.";

const travelParameters: Parameter[] = [
  {
    name: "destination",
    type: "string",
    description: "City or region (e.g. 'Tokyo', 'Barcelona, Spain'). Required.",
    required: true,
  },
  {
    name: "duration",
    type: "number",
    description: `Trip length in days (positive integer). ${OMIT}`,
    required: false,
  },
  {
    name: "budget",
    type: "number",
    description: `Total budget as a number. ${OMIT}`,
    required: false,
  },
  {
    name: "travelers",
    type: "number",
    description: `Number of travelers (positive integer). ${OMIT}`,
    required: false,
  },
  {
    name: "interests",
    type: "string[]",
    description: `User interests as strings. ${OMIT}`,
    required: false,
  },
];

const devParameters: Parameter[] = [
  {
    name: "projectType",
    type: "string",
    description: "Project type or target role (e.g. 'Frontend Developer'). Required.",
    required: true,
  },
  {
    name: "learningGoal",
    type: "string",
    description: "Main learning goal (e.g. 'land first junior job'). Required.",
    required: true,
  },
  {
    name: "timeframe",
    type: "string",
    description: `Target timeframe in plain text (e.g. '3 months'). ${OMIT}`,
    required: false,
  },
  {
    name: "currentSkills",
    type: "string[]",
    description: `Skills the user already has, as strings. ${OMIT}`,
    required: false,
  },
];

const fitnessParameters: Parameter[] = [
  {
    name: "goal",
    type: "string",
    description: `Main fitness goal in plain text. ${OMIT}`,
    required: false,
  },
  {
    name: "timeframe",
    type: "number",
    description: `Plan length in weeks (positive integer). ${OMIT}`,
    required: false,
  },
  {
    name: "daysPerWeek",
    type: "number",
    description: `Training days per week (1-7). ${OMIT}`,
    required: false,
  },
  {
    name: "restrictions",
    type: "string[]",
    description: `Injuries or limitations as strings. ${OMIT}`,
    required: false,
  },
];

export const COPILOT_ACTIONS = {
  generateTravelPlan: {
    name: "generate_travel_plan",
    description:
      "Generate a full travel plan (day-by-day itinerary, budget, recommendations). " +
      "Only `destination` is required; omit any parameter the user did not mention.",
    parameters: travelParameters,
    schema: TravelContextSchema,
  },

  generateDevRoadmap: {
    name: "generate_dev_roadmap",
    description:
      "Generate a development learning roadmap. Requires `projectType` and `learningGoal`; " +
      "omit other parameters if the user did not mention them.",
    parameters: devParameters,
    schema: DevContextSchema,
  },

  generateFitnessPlan: {
    name: "generate_fitness_plan",
    description:
      "Generate a personalized training and nutrition plan. All parameters are optional; " +
      "omit any the user did not mention.",
    parameters: fitnessParameters,
    schema: FitnessContextSchema,
  },
};

export type CopilotActionName = keyof typeof COPILOT_ACTIONS;
