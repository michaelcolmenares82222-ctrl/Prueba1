// Travel Types
export interface TravelPlan {
  destination: string;
  duration: number;
  budget?: number;
  currency?: string;
  itinerary: DayPlan[];
  budgetBreakdown: BudgetBreakdown;
  recommendations: Recommendation[];
}

export interface DayPlan {
  day: number;
  date?: string;
  morning?: Activity;
  afternoon?: Activity;
  evening?: Activity;
}

export interface Activity {
  title: string;
  description: string;
  duration?: string;
  cost?: number;
  location?: string;
}

export interface BudgetBreakdown {
  flights?: number;
  accommodation?: number;
  food?: number;
  activities?: number;
  transport?: number;
  emergency?: number;
  total: number;
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  link?: string;
  price?: string;
}

// Dev Types (para siguiente fase)
export interface DevRoadmap {
  projectType: string;
  timeframe: string;
  phases: Phase[];
  techStack: TechItem[];
  resources: Resource[];
}

export interface Phase {
  name: string;
  weeks: number;
  objectives: string[];
  deliverables: string[];
}

export interface TechItem {
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  reason: string;
}

export interface Resource {
  title: string;
  type: "course" | "doc" | "video" | "project";
  url: string;
  description: string;
}

// Fitness Types (para siguiente fase)
export interface FitnessPlan {
  goal: string;
  timeframe: number;
  weeklyPlan: WeeklyWorkout;
  nutrition: NutritionGuide;
  progression: string[];
}

export interface WeeklyWorkout {
  [day: string]: Workout;
}

export interface Workout {
  focus: string;
  exercises: Exercise[];
  restDay?: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface NutritionGuide {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: MealExample[];
}

export interface MealExample {
  meal: string;
  foods: string[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}
