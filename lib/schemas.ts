import { z } from "zod";
import { coerceTravelStyle } from "./coerce-travel-style";

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

// `.nullish()` accepts both `undefined` and `null`; we then normalise null → undefined
// in handlers via `stripNullish()` so .default() values can kick in.
export const TravelContextSchema = z.object({
  destination: z.string().min(1, "destination is required"),
  duration: z.number().positive().default(7),
  budget: z.number().positive().nullish().transform((v) => v ?? undefined),
  currency: z.string().nullish().transform((v) => v ?? "USD"),
  interests: z.array(z.string()).nullish().transform((v) => v ?? []),
  travelers: z.number().positive().nullish().transform((v) => v ?? 1),
  travelStyle: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => coerceTravelStyle(v)),
  departureDate: z.string().nullish().transform((v) => v ?? undefined),
  flexibility: z
    .enum(["fixed", "flexible"])
    .nullish()
    .transform((v) => v ?? "flexible"),
});

export const DevContextSchema = z.object({
  projectType: z.string().min(1, "projectType is required"),
  timeframe: z.string().nullish().transform((v) => v ?? "3 meses"),
  timeframeWeeks: z.number().positive().nullish().transform((v) => v ?? undefined),
  currentSkills: z.array(z.string()).nullish().transform((v) => v ?? []),
  targetStack: z.array(z.string()).nullish().transform((v) => v ?? []),
  learningGoal: z.string().min(1, "learningGoal is required"),
  experience: z
    .enum(["beginner", "intermediate", "advanced"])
    .nullish()
    .transform((v) => v ?? "beginner"),
  studyTimePerWeek: z
    .number()
    .positive()
    .nullish()
    .transform((v) => v ?? 10),
});

export const FitnessContextSchema = z.object({
  goal: z
    .enum(["weight_loss", "muscle_gain", "endurance", "general", "flexibility"])
    .nullish()
    .transform((v) => v ?? "general"),
  timeframe: z.number().positive().nullish().transform((v) => v ?? 8),
  currentLevel: z
    .enum(["beginner", "intermediate", "advanced"])
    .nullish()
    .transform((v) => v ?? "beginner"),
  restrictions: z.array(z.string()).nullish().transform((v) => v ?? []),
  equipment: z
    .enum(["none", "basic", "full_gym"])
    .nullish()
    .transform((v) => v ?? "basic"),
  daysPerWeek: z.number().min(1).max(7).nullish().transform((v) => v ?? 4),
  dietaryPreferences: z.array(z.string()).nullish().transform((v) => v ?? []),
});

export type TravelContext = z.infer<typeof TravelContextSchema>;
export type DevContext = z.infer<typeof DevContextSchema>;
export type FitnessContext = z.infer<typeof FitnessContextSchema>;

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
