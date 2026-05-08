"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useState } from "react";

export default function Home() {
  const [generatedUI, setGeneratedUI] = useState<unknown>(null);

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
    handler: async ({ context }) => {
      console.log("🌍 Generating travel plan:", context);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: JSON.stringify(context) }),
      });

      const result = await response.json();
      setGeneratedUI(result);

      return "Plan de viaje generado exitosamente";
    },
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
    handler: async ({ context }) => {
      console.log("💻 Generating dev roadmap:", context);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: JSON.stringify(context) }),
      });

      const result = await response.json();
      setGeneratedUI(result);

      return "Roadmap generado exitosamente";
    },
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
    handler: async ({ context }) => {
      console.log("💪 Generating fitness plan:", context);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: JSON.stringify(context) }),
      });

      const result = await response.json();
      setGeneratedUI(result);

      return "Plan de fitness generado exitosamente";
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
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

        {/* Features Grid */}
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

        {/* Generated UI Display */}
        {generatedUI ? (
          <div className="mt-12 p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              UI Generada
            </h2>
            <pre className="text-sm text-gray-300 overflow-auto">
              {JSON.stringify(generatedUI, null, 2)}
            </pre>
          </div>
        ) : null}

        {/* Instructions */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-lg">
            👉 Abre el chat en la barra lateral y dime qué necesitas
          </p>
        </div>
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
