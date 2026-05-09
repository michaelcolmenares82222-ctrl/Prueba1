// Travel Types
export interface TravelPlan {
  destination: string;
  duration: number;
  budget?: number;
  currency?: string;
  itinerary: DayPlan[];
  budgetBreakdown: BudgetBreakdown;
  recommendations: Recommendation[];
  /**
   * Optional MCP enrichment payload (live weather, Wikipedia summary, top
   * places). When present, `TravelPlanUI` renders an extra "Datos en tiempo
   * real" block. When absent, the existing UI is rendered unchanged.
   */
  realData?: TravelRealTimeData;
}

export interface TravelRealTimeData {
  destination: string;
  userCurrency?: string;
  weather: TravelWeather | null;
  wiki: TravelWikiInfo | null;
  topPlaces: TravelPlace[];
  timestamp: string;
}

export interface TravelWeather {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  forecast: TravelWeatherDay[];
}

export interface TravelWeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
}

export interface TravelWikiInfo {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

export interface TravelPlace {
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
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
