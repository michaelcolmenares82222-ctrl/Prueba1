"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useState } from "react";
import { TravelPlanUI } from "./components/templates/travel/TravelPlanUI";
import { FitnessPlanUI } from "./components/templates/fitness/FitnessPlanUI";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { ErrorMessage } from "./components/ui/ErrorMessage";
import {
  TravelPlanForm,
  type TravelFormData,
} from "./components/forms/TravelPlanForm";
import {
  FitnessPlanForm,
  type FitnessFormData,
} from "./components/forms/FitnessPlanForm";
import {
  DevRoadmapForm,
  type DevFormData,
  timeframeWeeksMap,
} from "./components/forms/DevRoadmapForm";
import { DevRoadmapUI } from "./components/templates/dev/DevRoadmapUI";
import { parseTravelPlan, parseFitnessPlan, parseDevRoadmap } from "@/lib/parsers";
import {
  TravelContextSchema,
  FitnessContextSchema,
  DevContextSchema,
} from "@/lib/schemas";
import { COPILOT_ACTIONS } from "@/lib/copilot-actions";
import { stripNullish } from "@/lib/args-utils";
import {
  FitnessPlan,
  TravelPlan,
  DevRoadmap,
} from "./components/templates/types";

// Maps the user-facing Spanish labels emitted by the forms to the canonical
// shape expected by the Zod schemas in lib/schemas.ts.
function travelFormToContext(data: TravelFormData): Record<string, unknown> {
  const styleMap: Record<TravelFormData["travelStyle"], string> = {
    mochilero: "budget",
    "estándar": "standard",
    lujo: "luxury",
  };
  return {
    destination: data.destination,
    duration: data.duration,
    budget: data.budget,
    currency: "USD",
    travelers: data.travelers,
    interests: data.interests,
    travelStyle: styleMap[data.travelStyle],
    departureDate: data.departureDate || undefined,
    flexibility: "flexible",
  };
}

function devFormToContext(data: DevFormData): Record<string, unknown> {
  const expMap: Record<DevFormData["experience"], string> = {
    principiante: "beginner",
    intermedio: "intermediate",
    avanzado: "advanced",
  };
  const skills = data.currentSkillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const stack = data.targetStackRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    projectType: data.projectType.trim(),
    learningGoal: data.learningGoal.trim(),
    timeframe: data.timeframeLabel,
    timeframeWeeks: timeframeWeeksMap[data.timeframeLabel],
    experience: expMap[data.experience],
    studyTimePerWeek: data.studyTimePerWeek,
    currentSkills: skills,
    targetStack: stack,
  };
}

function fitnessFormToContext(data: FitnessFormData): Record<string, unknown> {
  const goalMap: Record<FitnessFormData["goal"], string> = {
    "bajar peso": "weight_loss",
    "ganar músculo": "muscle_gain",
    tonificar: "general",
    resistencia: "endurance",
  };
  const levelMap: Record<FitnessFormData["fitnessLevel"], string> = {
    principiante: "beginner",
    intermedio: "intermediate",
    avanzado: "advanced",
  };
  const equipmentMap: Record<FitnessFormData["equipment"], string> = {
    "gimnasio completo": "full_gym",
    "en casa con equipo": "basic",
    "solo peso corporal": "none",
  };
  const weeksMatch = data.timeframe.match(/(\d+)/);
  const timeframeWeeks = weeksMatch ? parseInt(weeksMatch[1], 10) : 8;
  const dietaryPreferences =
    data.dietPreference === "sin restricciones" ? [] : [data.dietPreference];
  return {
    goal: goalMap[data.goal],
    timeframe: timeframeWeeks,
    currentLevel: levelMap[data.fitnessLevel],
    restrictions: data.restrictions,
    equipment: equipmentMap[data.equipment],
    daysPerWeek: data.daysPerWeek,
    dietaryPreferences,
    // Extra body metrics (Zod strips them; surface for future schema upgrades).
    currentWeight: data.currentWeight,
    targetWeight: data.targetWeight,
    height: data.height,
    age: data.age,
    gender: data.gender,
  };
}

export default function Home() {
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [devPlan, setDevPlan] = useState<DevRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [showFitnessForm, setShowFitnessForm] = useState(false);
  const [showDevForm, setShowDevForm] = useState(false);

  async function generateUI(intent: "travel" | "fitness" | "development", context: unknown) {
    const res = await fetch("/api/generate-ui", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, context }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      throw new Error(
        data.message || data.error || `Error generando ${intent} UI`
      );
    }
    return (await res.json()) as { content: string; context: unknown };
  }

  function friendlyErrorMessage(
    rawMessage: string,
    kind: "viaje" | "fitness" | "desarrollo"
  ): string {
    const msg = rawMessage.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("rate_limit") || msg.includes("429")) {
      return "El asistente está saturado en este momento. Espera unos segundos y vuelve a intentar.";
    }
    if (msg.includes("tool_use_failed") || msg.includes("failed to call a function")) {
      return "No pude entender bien la solicitud. Intenta reformularla con menos detalle a la vez.";
    }
    if (msg.includes("invalid_enum_value") || msg.includes("zoderror")) {
      const label =
        kind === "desarrollo" ? "roadmap de desarrollo" : `plan de ${kind}`;
      return `Algunos datos no encajaron. Intenta describir tu ${label} de forma más simple.`;
    }
    if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
      return "No pude conectarme al servidor. Revisa tu conexión y vuelve a intentar.";
    }
    return rawMessage;
  }

  const handleGenerateTravel = async (
    args: Record<string, unknown>
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const ctx = TravelContextSchema.parse(stripNullish(args));
      const data = await generateUI("travel", ctx);
      const plan = parseTravelPlan(data.content, ctx);
      setTravelPlan(plan);
      setFitnessPlan(null);
      setDevPlan(null);
      return `¡Plan de viaje a ${ctx.destination} listo! Revisa el itinerario, presupuesto y recomendaciones.`;
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Hubo un error generando el plan de viaje";
      console.error("Error generating travel plan:", err);
      const friendly = friendlyErrorMessage(rawMsg, "viaje");
      setError(friendly);
      return friendly;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFitness = async (
    args: Record<string, unknown>
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const ctx = FitnessContextSchema.parse(stripNullish(args));
      const data = await generateUI("fitness", ctx);
      const plan = parseFitnessPlan(data.content, ctx);
      setFitnessPlan(plan);
      setTravelPlan(null);
      setDevPlan(null);
      return "¡Plan de fitness generado! Revisa tu rutina y guía nutricional personalizada.";
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Hubo un error generando el plan de fitness";
      console.error("Error generating fitness plan:", err);
      const friendly = friendlyErrorMessage(rawMsg, "fitness");
      setError(friendly);
      return friendly;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDev = async (
    args: Record<string, unknown>
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const ctx = DevContextSchema.parse(stripNullish(args));
      const data = await generateUI("development", ctx);
      const plan = parseDevRoadmap(data.content, ctx);
      setDevPlan(plan);
      setTravelPlan(null);
      setFitnessPlan(null);
      return `¡Roadmap para "${ctx.projectType}" listo! Revisa fases, stack y recursos.`;
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Hubo un error generando el roadmap de desarrollo";
      console.error("Error generating dev roadmap:", err);
      const friendly = friendlyErrorMessage(rawMsg, "desarrollo");
      setError(friendly);
      return friendly;
    } finally {
      setLoading(false);
    }
  };

  useCopilotAction({
    name: COPILOT_ACTIONS.generateTravelPlan.name,
    description: COPILOT_ACTIONS.generateTravelPlan.description,
    parameters: COPILOT_ACTIONS.generateTravelPlan.parameters,
    handler: (args) => handleGenerateTravel(args),
  });

  useCopilotAction({
    name: COPILOT_ACTIONS.generateDevRoadmap.name,
    description: COPILOT_ACTIONS.generateDevRoadmap.description,
    parameters: COPILOT_ACTIONS.generateDevRoadmap.parameters,
    handler: (args) => handleGenerateDev(args),
  });

  useCopilotAction({
    name: COPILOT_ACTIONS.generateFitnessPlan.name,
    description: COPILOT_ACTIONS.generateFitnessPlan.description,
    parameters: COPILOT_ACTIONS.generateFitnessPlan.parameters,
    handler: (args) => handleGenerateFitness(args),
  });

  const showHero =
    !travelPlan && !fitnessPlan && !devPlan && !loading && !error;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        {showHero ? (
          <div className="animate-fade-in">
            <div className="text-center mb-16">
              <h1 className="text-6xl font-bold text-white mb-6">
                Universal AI Assistant
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Tu asistente inteligente que genera interfaces interactivas
                completas, no solo texto. Viajes, desarrollo, fitness y más.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 rounded-full text-purple-300 text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                Generative UI Hackathon 2024
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <FeatureCard
                icon="✈️"
                title="Planificación de Viajes"
                description="Itinerarios detallados, presupuestos, recomendaciones y más"
                example="Quiero viajar a Japón por una semana"
                onClick={() => setShowTravelForm(true)}
                accentClass="hover:border-purple-400"
              />
              <FeatureCard
                icon="💻"
                title="Roadmaps de Desarrollo"
                description="Planes de aprendizaje, tech stacks, recursos curados"
                example="Cómo aprendo React en 3 meses"
                onClick={() => setShowDevForm(true)}
                accentClass="hover:border-blue-400"
              />
              <FeatureCard
                icon="💪"
                title="Planes de Fitness"
                description="Rutinas personalizadas, guías nutricionales, tracking"
                example="Necesito bajar 10kg en 2 meses"
                onClick={() => setShowFitnessForm(true)}
                accentClass="hover:border-green-400"
              />
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-400 text-lg">
                👉 Haz click en una tarjeta para abrir el formulario, o usa el
                chat lateral para describir tu plan en lenguaje natural.
              </p>
            </div>
          </div>
        ) : null}

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner message="Generando tu plan personalizado..." />
        ) : null}

        {/* Error State */}
        {error && !loading ? (
          <ErrorMessage
            message={error}
            onRetry={() => setError(null)}
          />
        ) : null}

        {/* Travel Plan UI */}
        {travelPlan && !loading && !error ? (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <button
              type="button"
              onClick={() => setTravelPlan(null)}
              className="mb-6 text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
            >
              ← Volver al inicio
            </button>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
              <TravelPlanUI plan={travelPlan} />
            </div>
          </div>
        ) : null}

        {/* Fitness Plan UI */}
        {fitnessPlan && !loading && !error && !travelPlan ? (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <button
              type="button"
              onClick={() => setFitnessPlan(null)}
              className="mb-6 text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
            >
              ← Volver al inicio
            </button>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
              <FitnessPlanUI plan={fitnessPlan} />
            </div>
          </div>
        ) : null}

        {/* Dev Roadmap UI */}
        {devPlan && !loading && !error && !travelPlan && !fitnessPlan ? (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <button
              type="button"
              onClick={() => setDevPlan(null)}
              className="mb-6 text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
            >
              ← Volver al inicio
            </button>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
              <DevRoadmapUI roadmap={devPlan} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Form Modals */}
      {showTravelForm ? (
        <TravelPlanForm
          onClose={() => setShowTravelForm(false)}
          onSubmit={(data) => {
            setShowTravelForm(false);
            void handleGenerateTravel(travelFormToContext(data));
          }}
        />
      ) : null}

      {showFitnessForm ? (
        <FitnessPlanForm
          onClose={() => setShowFitnessForm(false)}
          onSubmit={(data) => {
            setShowFitnessForm(false);
            void handleGenerateFitness(fitnessFormToContext(data));
          }}
        />
      ) : null}

      {showDevForm ? (
        <DevRoadmapForm
          onClose={() => setShowDevForm(false)}
          onSubmit={(data) => {
            setShowDevForm(false);
            void handleGenerateDev(devFormToContext(data));
          }}
        />
      ) : null}
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  example,
  onClick,
  accentClass,
}: {
  icon: string;
  title: string;
  description: string;
  example: string;
  onClick?: () => void;
  accentClass?: string;
}) {
  const interactive = typeof onClick === "function";
  const baseClass =
    "p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 transition-colors text-left w-full";
  const hoverClass = accentClass ?? "hover:border-purple-500/50";
  const cursorClass = interactive ? "cursor-pointer" : "cursor-default";

  const content = (
    <>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="text-sm text-purple-300 bg-purple-900/30 px-3 py-2 rounded-lg">
        💬 &ldquo;{example}&rdquo;
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} ${hoverClass} ${cursorClass}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClass} ${hoverClass} ${cursorClass}`}>{content}</div>
  );
}
