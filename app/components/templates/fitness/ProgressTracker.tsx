"use client";

import { TrendingUp, CheckCircle2 } from "lucide-react";

interface ProgressTrackerProps {
  progression: string[];
  timeframe: number;
}

export function ProgressTracker({
  progression,
  timeframe,
}: ProgressTrackerProps) {
  const items =
    progression && progression.length > 0
      ? progression
      : generateDefaultProgression(timeframe);

  return (
    <div className="space-y-6">
      {/* Progress Cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Estrategia de Progresión
        </h3>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Checklist Template */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Seguimiento Semanal</h3>

        <div className="grid grid-cols-7 gap-2">
          {["L", "M", "M", "J", "V", "S", "D"].map((day, idx) => (
            <div
              key={idx}
              className="aspect-square bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center font-semibold text-gray-400 hover:border-green-400 hover:text-green-600 cursor-pointer transition-colors"
            >
              {day}
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-600 mt-4">
          💡 Marca cada día que completes tu entrenamiento
        </p>
      </div>

      {/* Tips Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-3">
          Consejos para el Éxito
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Prioriza la forma correcta sobre el peso</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Descansa adecuadamente entre sesiones</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Escucha a tu cuerpo y ajusta según sea necesario</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>La consistencia es más importante que la intensidad</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function generateDefaultProgression(weeks: number): string[] {
  const phase1End = Math.ceil(weeks / 3);
  const phase2End = Math.ceil((weeks * 2) / 3);
  return [
    `Semanas 1-${phase1End}: Enfócate en dominar la técnica con pesos moderados`,
    `Semanas ${phase1End + 1}-${phase2End}: Aumenta progresivamente el peso o las repeticiones`,
    `Semanas ${phase2End + 1}-${weeks}: Maximiza intensidad y volumen, mantén la forma`,
  ];
}
