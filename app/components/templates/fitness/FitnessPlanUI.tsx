"use client";

import { FitnessPlan } from "../types";
import { WeeklySchedule } from "./WeeklySchedule";
import { NutritionGuide } from "./NutritionGuide";
import { ProgressTracker } from "./ProgressTracker";
import { Dumbbell, Apple, TrendingUp, Target } from "lucide-react";

interface FitnessPlanUIProps {
  plan: FitnessPlan;
}

export function FitnessPlanUI({ plan }: FitnessPlanUIProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">
                Tu plan de
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4 capitalize">
              {plan.goal.replace(/_/g, " ")}
            </h1>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>{plan.timeframe} semanas</span>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Plan progresivo</span>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Target className="w-8 h-8" />
          </div>
        </div>

        {/* Health Disclaimer */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm">
          <p className="font-medium mb-1">⚕️ Importante</p>
          <p className="opacity-90">
            Este plan es una guía general. Consulta con un profesional de
            salud antes de comenzar cualquier programa de ejercicio o
            nutrición, especialmente si tienes condiciones médicas.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        <section id="workout">
          <SectionHeader
            icon={<Dumbbell className="w-5 h-5" />}
            title="Plan de Entrenamiento"
            subtitle="Rutina semanal estructurada"
          />
          <WeeklySchedule weeklyPlan={plan.weeklyPlan} />
        </section>

        <section id="nutrition">
          <SectionHeader
            icon={<Apple className="w-5 h-5" />}
            title="Guía Nutricional"
            subtitle="Macros y ejemplos de comidas"
          />
          <NutritionGuide nutrition={plan.nutrition} />
        </section>

        <section id="progress">
          <SectionHeader
            icon={<TrendingUp className="w-5 h-5" />}
            title="Progresión"
            subtitle="Cómo aumentar intensidad"
          />
          <ProgressTracker
            progression={plan.progression}
            timeframe={plan.timeframe}
          />
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-green-600">{icon}</div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  );
}
