"use client";

import {
  MealExample,
  NutritionGuide as NutritionType,
} from "../types";
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  type LucideIcon,
} from "lucide-react";

interface NutritionGuideProps {
  nutrition: NutritionType;
}

interface MacroItem {
  label: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
}

export function NutritionGuide({ nutrition }: NutritionGuideProps) {
  const macros: MacroItem[] = [
    {
      label: "Calorías",
      value: nutrition.calories,
      unit: "kcal",
      icon: Flame,
      bgClass: "bg-orange-100",
      textClass: "text-orange-600",
    },
    {
      label: "Proteína",
      value: nutrition.protein,
      unit: "g",
      icon: Beef,
      bgClass: "bg-red-100",
      textClass: "text-red-600",
    },
    {
      label: "Carbohidratos",
      value: nutrition.carbs,
      unit: "g",
      icon: Wheat,
      bgClass: "bg-yellow-100",
      textClass: "text-yellow-600",
    },
    {
      label: "Grasas",
      value: nutrition.fats,
      unit: "g",
      icon: Droplets,
      bgClass: "bg-blue-100",
      textClass: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Macros Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {macros.map((macro) => {
          const Icon = macro.icon;
          return (
            <div
              key={macro.label}
              className="bg-white rounded-xl p-6 border border-gray-200 text-center"
            >
              <div
                className={`${macro.bgClass} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}
              >
                <Icon className={`w-6 h-6 ${macro.textClass}`} />
              </div>
              <div
                className={`text-3xl font-bold ${macro.textClass} mb-1`}
              >
                {macro.value}
              </div>
              <div className="text-sm text-gray-600">{macro.unit}</div>
              <div className="text-xs text-gray-500 mt-1">
                {macro.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meal Examples */}
      {nutrition.meals && nutrition.meals.length > 0 ? (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Ejemplos de Comidas
          </h3>
          <div className="space-y-4">
            {nutrition.meals.map((meal, idx) => (
              <MealCard key={idx} meal={meal} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Hydration Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-lg p-2">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Hidratación</h4>
            <p className="text-sm text-gray-600">
              Bebe al menos 2-3 litros de agua al día. Aumenta la cantidad
              en días de entrenamiento intenso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: MealExample }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{meal.meal}</h4>
        {meal.macros ? (
          <div className="flex gap-2 text-xs">
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
              P: {meal.macros.protein}g
            </span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              C: {meal.macros.carbs}g
            </span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
              G: {meal.macros.fats}g
            </span>
          </div>
        ) : null}
      </div>

      <ul className="space-y-1">
        {meal.foods.map((food, idx) => (
          <li
            key={idx}
            className="text-sm text-gray-600 flex items-center gap-2"
          >
            <span className="text-green-500">•</span>
            {food}
          </li>
        ))}
      </ul>
    </div>
  );
}
