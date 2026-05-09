/**
 * UI Context Detector
 *
 * Heuristic engine that turns a free-form user prompt into a typed `UIContext`
 * describing which morphic widgets, mood, density, and color scheme should be
 * used to render the response. The result is consumed by
 * `app/components/morphic/MorphicRenderer.tsx`.
 *
 * Design notes
 * ------------
 * - Color scheme fields are FULL Tailwind class strings (e.g. `"bg-blue-600"`,
 *   `"from-blue-600 to-indigo-700"`). Tailwind v4's JIT can only see classes
 *   that appear as literal strings in the source, so we keep the full utility
 *   names in the lookup table rather than just the color tokens.
 * - All keyword patterns are lowercase and stripped of accents; we normalise
 *   the input the same way before matching so "móvil" matches "movil".
 * - Detection is intentionally deterministic and dependency-free (no LLM
 *   round-trip) so it can run client-side and is cheap to call on every
 *   render.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type UIDomain =
  | "travel"
  | "fitness"
  | "dev"
  | "finance"
  | "food"
  | "event"
  | "generic";

export type UIMood =
  | "professional"
  | "playful"
  | "minimalist"
  | "luxury"
  | "adventurous";

export type UIDensity = "compact" | "normal" | "spacious";

/**
 * A color scheme expressed as ready-to-use Tailwind utility classes. Each
 * field is intended to be dropped into `className` directly.
 */
export interface UIColorScheme {
  /** Solid background utility, e.g. `"bg-blue-600"`. */
  primary: string;
  /** Solid background utility for secondary surfaces, e.g. `"bg-indigo-600"`. */
  secondary: string;
  /** Text/border accent utility, e.g. `"text-cyan-400"`. */
  accent: string;
  /**
   * Tailwind gradient stops to use after `bg-gradient-to-*`,
   * e.g. `"from-blue-600 to-indigo-700"`.
   */
  gradient: string;
}

export interface UIContext {
  domain: UIDomain;
  subtype: string;
  mood: UIMood;
  density: UIDensity;
  colorScheme: UIColorScheme;
  components: string[];
}

// ---------------------------------------------------------------------------
// Subtype patterns
// ---------------------------------------------------------------------------

/**
 * Per-domain keyword tables used to pick a `subtype`. Order inside each
 * domain matters: the first pattern with at least one keyword match wins.
 * Keep the most specific subtypes near the top.
 */
export const SUBTYPE_PATTERNS: Record<UIDomain, Record<string, string[]>> = {
  travel: {
    luxury: ["lujo", "luxury", "premium", "5 estrellas", "first class"],
    adventure: [
      "aventura",
      "adventure",
      "trekking",
      "senderismo",
      "extremo",
      "mochilero",
      "backpack",
    ],
    road_trip: [
      "carretera",
      "road trip",
      "ruta",
      "manejo",
      "coche",
      "auto",
      "rv",
      "camper",
    ],
    beach: ["playa", "mar", "costa", "isla", "beach", "tropical", "caribe"],
    city_break: [
      "ciudad",
      "city break",
      "weekend",
      "fin de semana",
      "europa",
      "capital",
    ],
    cultural: [
      "cultura",
      "museo",
      "historia",
      "patrimonio",
      "ruinas",
      "arqueolog",
    ],
  },
  fitness: {
    weight_loss: [
      "perder peso",
      "bajar peso",
      "adelgazar",
      "weight loss",
      "quemar grasa",
      "definicion",
    ],
    muscle_gain: [
      "musculo",
      "muscle",
      "ganar masa",
      "hipertrofia",
      "volumen",
      "bulk",
    ],
    strength: [
      "fuerza",
      "strength",
      "powerlifting",
      "levantar",
      "1rm",
      "press",
    ],
    endurance: [
      "resistencia",
      "endurance",
      "cardio",
      "correr",
      "maraton",
      "running",
      "ciclismo",
    ],
    flexibility: [
      "flexibilidad",
      "yoga",
      "movilidad",
      "estiramiento",
      "pilates",
      "stretch",
    ],
    home_workout: [
      "casa",
      "en casa",
      "home workout",
      "sin gym",
      "sin equipo",
      "sin material",
    ],
  },
  dev: {
    mobile_app: [
      "movil",
      "mobile",
      "ios",
      "android",
      "app movil",
      "react native",
      "flutter",
      "swift",
    ],
    fullstack: ["fullstack", "full-stack", "full stack"],
    backend: [
      "backend",
      "back-end",
      "api",
      "servidor",
      "microservicios",
      "rest",
      "graphql",
    ],
    frontend: ["frontend", "front-end", "ui", "interfaz", "spa"],
    web_app: ["web app", "react", "next", "vue", "svelte", "sitio web"],
    data: [
      "data",
      "datos",
      "ml",
      "machine learning",
      "ai",
      "ia",
      "analytics",
      "dashboard",
    ],
    devops: [
      "devops",
      "docker",
      "kubernetes",
      "ci/cd",
      "infra",
      "pipeline",
      "terraform",
    ],
  },
  finance: {},
  food: {},
  event: {},
  generic: {},
};

// ---------------------------------------------------------------------------
// Mood lookup
// ---------------------------------------------------------------------------

/**
 * Maps a `subtype` string to a `mood`. Subtypes that are not listed here
 * fall back to `'professional'`.
 */
export const MOOD_BY_SUBTYPE: Record<string, UIMood> = {
  // travel
  road_trip: "adventurous",
  beach: "playful",
  city_break: "professional",
  adventure: "adventurous",
  luxury: "luxury",
  cultural: "professional",
  // fitness
  weight_loss: "professional",
  muscle_gain: "adventurous",
  endurance: "adventurous",
  strength: "professional",
  flexibility: "minimalist",
  home_workout: "minimalist",
  // dev
  web_app: "professional",
  mobile_app: "playful",
  backend: "minimalist",
  frontend: "playful",
  fullstack: "professional",
  data: "professional",
  devops: "minimalist",
  // generic / fallbacks
  generic: "professional",
};

// ---------------------------------------------------------------------------
// Color schemes
// ---------------------------------------------------------------------------

/**
 * Each entry is a complete set of Tailwind utility classes. The `gradient`
 * field is meant to be combined with a `bg-gradient-to-*` direction class
 * by the consumer.
 */
export const COLOR_SCHEMES: Record<UIMood, UIColorScheme> = {
  adventurous: {
    primary: "bg-orange-600",
    secondary: "bg-amber-500",
    accent: "text-red-400",
    gradient: "from-orange-500 to-red-600",
  },
  playful: {
    primary: "bg-pink-500",
    secondary: "bg-purple-500",
    accent: "text-yellow-400",
    gradient: "from-pink-500 to-purple-600",
  },
  professional: {
    primary: "bg-blue-600",
    secondary: "bg-indigo-600",
    accent: "text-cyan-400",
    gradient: "from-blue-600 to-indigo-700",
  },
  luxury: {
    primary: "bg-amber-700",
    secondary: "bg-yellow-600",
    accent: "text-amber-300",
    gradient: "from-amber-700 to-yellow-600",
  },
  minimalist: {
    primary: "bg-slate-700",
    secondary: "bg-zinc-600",
    accent: "text-slate-400",
    gradient: "from-slate-700 to-zinc-800",
  },
};

// ---------------------------------------------------------------------------
// Component mapping
// ---------------------------------------------------------------------------

/**
 * Maps a `${domain}/${subtype}` key to the ordered list of widget names that
 * should be rendered. Widget names match files in
 * `app/components/morphic/widgets/`.
 */
const COMPONENTS_BY_CONTEXT: Record<string, string[]> = {
  // travel
  "travel/road_trip": ["RouteMap", "Timeline", "WeatherCards", "GenericCard"],
  "travel/beach": ["WeatherCards", "Timeline", "RestaurantMap", "GenericCard"],
  "travel/city_break": ["Timeline", "RestaurantMap", "GenericCard"],
  "travel/adventure": ["RouteMap", "Timeline", "WeatherCards"],
  "travel/luxury": ["Timeline", "RestaurantMap", "GenericCard"],
  "travel/cultural": ["Timeline", "RestaurantMap", "GenericCard"],
  // fitness
  "fitness/weight_loss": ["CalorieTracker", "Timeline", "GenericCard"],
  "fitness/muscle_gain": ["StrengthChart", "CalorieTracker", "Timeline"],
  "fitness/endurance": ["Timeline", "GenericCard"],
  "fitness/strength": ["StrengthChart", "Timeline", "GenericCard"],
  "fitness/flexibility": ["Timeline", "GenericCard"],
  "fitness/home_workout": ["Timeline", "GenericCard"],
  // dev
  "dev/web_app": ["ComponentTree", "Timeline", "GenericCard"],
  "dev/mobile_app": ["ComponentTree", "Timeline", "GenericCard"],
  "dev/backend": ["Timeline", "ComponentTree", "GenericCard"],
  "dev/frontend": ["ComponentTree", "Timeline", "GenericCard"],
  "dev/fullstack": ["ComponentTree", "Timeline", "GenericCard"],
  "dev/data": ["Timeline", "GenericCard"],
  "dev/devops": ["Timeline", "GenericCard"],
};

const DEFAULT_DOMAIN_COMPONENTS: Record<UIDomain, string[]> = {
  travel: ["Timeline", "GenericCard"],
  fitness: ["Timeline", "GenericCard"],
  dev: ["Timeline", "GenericCard"],
  finance: ["GenericCard"],
  food: ["RestaurantMap", "GenericCard"],
  event: ["Timeline", "GenericCard"],
  generic: ["GenericCard"],
};

/**
 * Returns the ordered list of widget names for a given `(domain, subtype)`.
 * Falls back to a sensible per-domain default when the pair is not in the
 * lookup table.
 */
export function getComponentsForContext(
  domain: UIDomain,
  subtype: string
): string[] {
  const exact = COMPONENTS_BY_CONTEXT[`${domain}/${subtype}`];
  if (exact) return [...exact];
  return [...DEFAULT_DOMAIN_COMPONENTS[domain]];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lower-cases the input and removes diacritics so accented Spanish text
 * matches plain ASCII keyword tables (e.g. "música" → "musica").
 */
function normalise(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectSubtype(userInput: string, domain: UIDomain): string {
  const normalised = normalise(userInput);
  const patterns = SUBTYPE_PATTERNS[domain];
  for (const [subtype, keywords] of Object.entries(patterns)) {
    if (keywords.some((kw) => normalised.includes(kw))) {
      return subtype;
    }
  }
  return "generic";
}

function detectDensity(userInput: string): UIDensity {
  const wordCount = userInput.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount <= 6) return "compact";
  if (wordCount >= 30) return "spacious";
  return "normal";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds a `UIContext` from a free-form prompt and a known domain.
 *
 * The function never throws: unknown subtypes degrade to `"generic"` and
 * unknown moods degrade to `"professional"`.
 */
export function detectUIContext(
  userInput: string,
  domain: UIDomain
): UIContext {
  const subtype = detectSubtype(userInput, domain);
  const mood = MOOD_BY_SUBTYPE[subtype] ?? "professional";
  const density = detectDensity(userInput);
  const colorScheme = COLOR_SCHEMES[mood];
  const components = getComponentsForContext(domain, subtype);

  return {
    domain,
    subtype,
    mood,
    density,
    colorScheme,
    components,
  };
}
