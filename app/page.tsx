"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useState } from "react";
import { TravelPlanUI } from "./components/templates/travel/TravelPlanUI";
import { FitnessPlanUI } from "./components/templates/fitness/FitnessPlanUI";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { ErrorMessage } from "./components/ui/ErrorMessage";
import { parseTravelPlan, parseFitnessPlan } from "@/lib/parsers";
import {
  FitnessPlan,
  TravelPlan,
} from "./components/templates/types";

type Context = unknown;

function contextToMessage(context: Context): string {
  return typeof context === "string"
    ? context
    : JSON.stringify(context);
}

export default function Home() {
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTravel = async (
    context: Context
  ): Promise<string> => {
    console.log("🌍 Generating travel plan:", context);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextToMessage(context) }),
      });

      if (!response.ok) {
        throw new Error("Error al analizar tu solicitud");
      }

      const result = await response.json();

      if (result.intent === "travel" && result.context) {
        const plan = parseTravelPlan("", result.context);
        setTravelPlan(plan);
        setFitnessPlan(null);
        // TODO: clear devRoadmap when its template is implemented
      }

      return "¡Plan de viaje generado! Revisa tu itinerario personalizado.";
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Hubo un error generando el plan";
      setError(errorMsg);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDev = async (context: Context): Promise<string> => {
    console.log("💻 Generating dev roadmap:", context);
    return "Roadmap en desarrollo...";
  };

  const handleGenerateFitness = async (
    context: Context
  ): Promise<string> => {
    console.log("💪 Generating fitness plan:", context);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextToMessage(context) }),
      });

      if (!response.ok) {
        throw new Error("Error al analizar tu solicitud");
      }

      const result = await response.json();

      if (result.intent === "fitness" && result.context) {
        const plan = parseFitnessPlan("", result.context);
        setFitnessPlan(plan);
        setTravelPlan(null);
        // TODO: clear devRoadmap when its template is implemented
      }

      return "¡Plan de fitness generado! Revisa tu rutina personalizada.";
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Hubo un error generando el plan";
      setError(errorMsg);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  };

  useCopilotAction({
    name: "generate_travel_plan",
    description: "Genera un plan de viaje completo",
    parameters: [
      {
        name: "context",
        type: "object",
        description: "Contexto del viaje",
      },
    ],
    handler: async ({ context }) => handleGenerateTravel(context),
  });

  useCopilotAction({
    name: "generate_dev_roadmap",
    description: "Genera un roadmap de desarrollo",
    parameters: [
      {
        name: "context",
        type: "object",
        description: "Contexto del proyecto",
      },
    ],
    handler: async ({ context }) => handleGenerateDev(context),
  });

  useCopilotAction({
    name: "generate_fitness_plan",
    description: "Genera un plan de fitness",
    parameters: [
      {
        name: "context",
        type: "object",
        description: "Contexto fitness",
      },
    ],
    handler: async ({ context }) => handleGenerateFitness(context),
  });

  const showHero =
    !travelPlan && !fitnessPlan && !loading && !error;

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
              />
              <FeatureCard
                icon="💻"
                title="Roadmaps de Desarrollo"
                description="Planes de aprendizaje, tech stacks, recursos curados"
                example="Cómo aprendo React en 3 meses"
              />
              <FeatureCard
                icon="💪"
                title="Planes de Fitness"
                description="Rutinas personalizadas, guías nutricionales, tracking"
                example="Necesito bajar 10kg en 2 meses"
              />
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-400 text-lg">
                👉 Abre el chat en la barra lateral y dime qué necesitas
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
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  example,
}: {
  icon: string;
  title: string;
  description: string;
  example: string;
}) {
  return (
    <div className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="text-sm text-purple-300 bg-purple-900/30 px-3 py-2 rounded-lg">
        💬 &ldquo;{example}&rdquo;
      </div>
    </div>
  );
}
