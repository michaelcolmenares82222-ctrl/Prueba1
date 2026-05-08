// ============================================
// Core Types
// ============================================

export type IntentType =
  | 'travel'      // Planificación de viajes
  | 'development' // Roadmaps de desarrollo
  | 'fitness'     // Planes fitness/nutrición
  | 'learning'    // Planes de estudio
  | 'generic';    // Fallback genérico

export interface UserContext {
  intent: IntentType;
  parameters: Record<string, any>;
  confidence: number;
  rawInput: string;
  timestamp: Date;
}

// ============================================
// Intent-Specific Context Types
// ============================================

export interface TravelContext {
  destination: string;
  duration: number; // días
  budget?: number;
  currency?: string;
  interests: string[];
  travelers: number;
  travelStyle: 'budget' | 'standard' | 'luxury';
  departureDate?: string;
  flexibility?: 'fixed' | 'flexible';
}

export interface DevContext {
  projectType: string;
  timeframe: string;
  timeframeWeeks?: number;
  currentSkills: string[];
  targetStack: string[];
  learningGoal: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  studyTimePerWeek?: number;
}

export interface FitnessContext {
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'general' | 'flexibility';
  timeframe: number; // semanas
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  restrictions: string[]; // lesiones, alergias, etc
  equipment: 'none' | 'basic' | 'full_gym';
  daysPerWeek?: number;
  dietaryPreferences?: string[];
}

export interface LearningContext {
  subject: string;
  timeframe: string;
  currentLevel: string;
  learningStyle: 'visual' | 'reading' | 'practical' | 'mixed';
  goal: string;
  studyTimePerDay?: number;
}

export interface GenericContext {
  query: string;
  category?: string;
  additionalInfo?: Record<string, any>;
}

// ============================================
// API Response Types
// ============================================

export interface IntentDetectionResponse {
  intent: IntentType;
  confidence: number;
  reasoning?: string;
}

export interface ContextExtractionResponse<T = any> {
  context: T;
  missing_fields?: string[];
  suggestions?: string[];
}

export interface UIGenerationResponse {
  component: string;
  props: Record<string, any>;
  metadata?: {
    generatedAt: Date;
    model: string;
    tokens?: number;
  };
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}
