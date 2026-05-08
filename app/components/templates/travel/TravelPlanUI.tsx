"use client";

import { TravelPlan } from "../types";
import { ItineraryTimeline } from "./ItineraryTimeline";
import { BudgetBreakdown } from "./BudgetBreakdown";
import { Recommendations } from "./Recommendations";
import { MapPin, Calendar, DollarSign, Sparkles } from "lucide-react";

interface TravelPlanUIProps {
  plan: TravelPlan;
}

export function TravelPlanUI({ plan }: TravelPlanUIProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">
                Tu viaje a
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{plan.destination}</h1>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{plan.duration} días</span>
              </div>

              {plan.budget ? (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {plan.budget.toLocaleString()} {plan.currency}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <TabButton active>Itinerario</TabButton>
        <TabButton>Presupuesto</TabButton>
        <TabButton>Recomendaciones</TabButton>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        <section id="itinerary">
          <SectionHeader
            icon={<Calendar className="w-5 h-5" />}
            title="Itinerario Día a Día"
            subtitle={`Plan completo para tus ${plan.duration} días`}
          />
          <ItineraryTimeline itinerary={plan.itinerary} />
        </section>

        <section id="budget">
          <SectionHeader
            icon={<DollarSign className="w-5 h-5" />}
            title="Desglose de Presupuesto"
            subtitle="Distribución estimada de gastos"
          />
          <BudgetBreakdown
            breakdown={plan.budgetBreakdown}
            currency={plan.currency}
            days={plan.duration}
          />
        </section>

        <section id="recommendations">
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" />}
            title="Recomendaciones"
            subtitle="Lugares, tips y consejos útiles"
          />
          <Recommendations
            recommendations={plan.recommendations}
            destination={plan.destination}
          />
        </section>
      </div>
    </div>
  );
}

function TabButton({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`px-4 py-2 font-medium transition-colors ${
        active
          ? "text-purple-600 border-b-2 border-purple-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
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
        <div className="text-purple-600">{icon}</div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  );
}
