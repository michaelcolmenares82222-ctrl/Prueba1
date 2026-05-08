import { z } from "zod";

// ============================================
// Intent Detection Schema
// ============================================

export const IntentTypeSchema = z.enum([
  "travel",
  "development",
  "fitness",
  "learning",
  "generic",
]);

export const IntentDetectionSchema = z.object({
  intent: IntentTypeSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

// ============================================
// Context Extraction Schemas
// ============================================

export const TravelContextSchema = z.object({
  destination: z.string(),
  duration: z.number().positive(),
  budget: z.number().positive().optional(),
  currency: z.string().default("USD"),
  interests: z.array(z.string()).default([]),
  travelers: z.number().positive().default(1),
  travelStyle: z.enum(["budget", "standard", "luxury"]).default("standard"),
  departureDate: z.string().optional(),
  flexibility: z.enum(["fixed", "flexible"]).default("flexible"),
});

export const DevContextSchema = z.object({
  projectType: z.string(),
  timeframe: z.string(),
  timeframeWeeks: z.number().positive().optional(),
  currentSkills: z.array(z.string()).default([]),
  targetStack: z.array(z.string()).default([]),
  learningGoal: z.string(),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  studyTimePerWeek: z.number().positive().default(10),
});

export const FitnessContextSchema = z.object({
  goal: z.enum([
    "weight_loss",
    "muscle_gain",
    "endurance",
    "general",
    "flexibility",
  ]),
  timeframe: z.number().positive(),
  currentLevel: z.enum(["beginner", "intermediate", "advanced"]),
  restrictions: z.array(z.string()).default([]),
  equipment: z.enum(["none", "basic", "full_gym"]),
  daysPerWeek: z.number().min(1).max(7).default(4),
  dietaryPreferences: z.array(z.string()).default([]),
});

export const LearningContextSchema = z.object({
  subject: z.string(),
  timeframe: z.string(),
  currentLevel: z.string(),
  learningStyle: z.enum(["visual", "reading", "practical", "mixed"]),
  goal: z.string(),
  studyTimePerDay: z.number().positive().optional(),
});

export const GenericContextSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  additionalInfo: z.record(z.any()).optional(),
});

// ============================================
// Utility Functions
// ============================================

export function validateIntentDetection(data: unknown) {
  return IntentDetectionSchema.parse(data);
}

export function validateTravelContext(data: unknown) {
  return TravelContextSchema.parse(data);
}

export function validateDevContext(data: unknown) {
  return DevContextSchema.parse(data);
}

export function validateFitnessContext(data: unknown) {
  return FitnessContextSchema.parse(data);
}

export function validateLearningContext(data: unknown) {
  return LearningContextSchema.parse(data);
}

export function validateGenericContext(data: unknown) {
  return GenericContextSchema.parse(data);
}
