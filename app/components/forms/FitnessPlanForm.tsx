"use client";

import { useState } from "react";
import { X, Dumbbell, Target, Flame } from "lucide-react";

export type FitnessFormData = {
  goal: "bajar peso" | "ganar músculo" | "tonificar" | "resistencia";
  currentWeight: number;
  targetWeight: number;
  height: number;
  age: number;
  gender: "masculino" | "femenino" | "otro";
  fitnessLevel: "principiante" | "intermedio" | "avanzado";
  daysPerWeek: number;
  equipment:
    | "gimnasio completo"
    | "en casa con equipo"
    | "solo peso corporal";
  dietPreference:
    | "sin restricciones"
    | "vegetariano"
    | "vegano"
    | "bajo en carbos"
    | "alto en proteína";
  restrictions: string[];
  timeframe: "4 semanas" | "8 semanas" | "12 semanas" | "16 semanas";
};

interface FitnessPlanFormProps {
  onSubmit: (data: FitnessFormData) => void;
  onClose: () => void;
}

const goalOptions: {
  id: FitnessFormData["goal"];
  label: string;
  emoji: string;
  ringClass: string;
}[] = [
  {
    id: "bajar peso",
    label: "Bajar de Peso",
    emoji: "⬇️",
    ringClass: "border-red-600 bg-red-50",
  },
  {
    id: "ganar músculo",
    label: "Ganar Músculo",
    emoji: "💪",
    ringClass: "border-blue-600 bg-blue-50",
  },
  {
    id: "tonificar",
    label: "Tonificar",
    emoji: "✨",
    ringClass: "border-purple-600 bg-purple-50",
  },
  {
    id: "resistencia",
    label: "Resistencia",
    emoji: "🏃",
    ringClass: "border-green-600 bg-green-50",
  },
];

const restrictionOptions = [
  "Lesión de rodilla",
  "Lesión de espalda",
  "Lesión de hombro",
  "Problemas cardíacos",
  "Diabetes",
  "Hipertensión",
];

export function FitnessPlanForm({ onSubmit, onClose }: FitnessPlanFormProps) {
  const [formData, setFormData] = useState<FitnessFormData>({
    goal: "bajar peso",
    currentWeight: 70,
    targetWeight: 65,
    height: 170,
    age: 30,
    gender: "otro",
    fitnessLevel: "principiante",
    daysPerWeek: 3,
    equipment: "gimnasio completo",
    dietPreference: "sin restricciones",
    restrictions: [],
    timeframe: "8 semanas",
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const toggleRestriction = (restriction: string) => {
    setFormData((prev) => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter((r) => r !== restriction)
        : [...prev.restrictions, restriction],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const bmi = (
    formData.currentWeight /
    (formData.height / 100) ** 2
  ).toFixed(1);
  const bmiNum = parseFloat(bmi);
  const bmiLabel =
    bmiNum < 18.5
      ? "Bajo peso"
      : bmiNum < 25
        ? "Normal"
        : bmiNum < 30
          ? "Sobrepeso"
          : "Obesidad";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Plan de Fitness</h2>
                <p className="text-green-100 text-sm">Paso {step} de 3</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Cerrar formulario"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 text-gray-900">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-3">
                  ¿Cuál es tu objetivo principal? *
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {goalOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, goal: option.id })
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.goal === option.id
                          ? option.ringClass
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{option.emoji}</div>
                        <div className="font-medium text-sm">
                          {option.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="fit-current-weight"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Peso Actual (kg) *
                  </label>
                  <input
                    id="fit-current-weight"
                    type="number"
                    required
                    min={30}
                    max={300}
                    value={formData.currentWeight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentWeight: Math.max(
                          1,
                          parseInt(e.target.value) || 0
                        ),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fit-target-weight"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Peso Meta (kg) *
                  </label>
                  <input
                    id="fit-target-weight"
                    type="number"
                    required
                    min={30}
                    max={300}
                    value={formData.targetWeight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetWeight: Math.max(
                          1,
                          parseInt(e.target.value) || 0
                        ),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fit-height"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Altura (cm) *
                  </label>
                  <input
                    id="fit-height"
                    type="number"
                    required
                    min={100}
                    max={250}
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        height: Math.max(1, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">Tu IMC: {bmi}</span>
                  <span className="text-green-600">({bmiLabel})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fit-age"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Edad *
                  </label>
                  <input
                    id="fit-age"
                    type="number"
                    required
                    min={13}
                    max={100}
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age: Math.max(13, parseInt(e.target.value) || 13),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fit-gender"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Género
                  </label>
                  <select
                    id="fit-gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as FitnessFormData["gender"],
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Prefiero no decir</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-3">
                  Nivel de Experiencia
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    ["principiante", "intermedio", "avanzado"] as const
                  ).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, fitnessLevel: level })
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.fitnessLevel === level
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center capitalize font-medium">
                        {level}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fit-days"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Días por Semana *
                  </label>
                  <select
                    id="fit-days"
                    value={formData.daysPerWeek}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daysPerWeek: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                  >
                    {[3, 4, 5, 6, 7].map((days) => (
                      <option key={days} value={days}>
                        {days} días
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="fit-timeframe"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Tiempo Objetivo
                  </label>
                  <select
                    id="fit-timeframe"
                    value={formData.timeframe}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        timeframe: e.target
                          .value as FitnessFormData["timeframe"],
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                  >
                    <option value="4 semanas">4 semanas</option>
                    <option value="8 semanas">8 semanas</option>
                    <option value="12 semanas">12 semanas</option>
                    <option value="16 semanas">16 semanas</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="fit-equipment"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Equipamiento Disponible
                </label>
                <select
                  id="fit-equipment"
                  value={formData.equipment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      equipment: e.target
                        .value as FitnessFormData["equipment"],
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="gimnasio completo">Gimnasio Completo</option>
                  <option value="en casa con equipo">
                    Casa con Equipo Básico
                  </option>
                  <option value="solo peso corporal">Solo Peso Corporal</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="fit-diet"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Preferencia Alimenticia
                </label>
                <select
                  id="fit-diet"
                  value={formData.dietPreference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dietPreference: e.target
                        .value as FitnessFormData["dietPreference"],
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="sin restricciones">Sin Restricciones</option>
                  <option value="vegetariano">Vegetariano</option>
                  <option value="vegano">Vegano</option>
                  <option value="bajo en carbos">
                    Bajo en Carbohidratos
                  </option>
                  <option value="alto en proteína">Alto en Proteína</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-3">
                  ¿Tienes alguna lesión o restricción? (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {restrictionOptions.map((restriction) => (
                    <button
                      key={restriction}
                      type="button"
                      onClick={() => toggleRestriction(restriction)}
                      className={`p-3 rounded-xl border-2 transition-all text-left text-sm ${
                        formData.restrictions.includes(restriction)
                          ? "border-orange-600 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {restriction}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900">Resumen de tu Plan</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Objetivo:</span>
                    <span className="font-semibold capitalize">
                      {formData.goal}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cambio de peso:</span>
                    <span className="font-semibold">
                      {formData.currentWeight}kg → {formData.targetWeight}kg (
                      {formData.currentWeight > formData.targetWeight ? "-" : "+"}
                      {Math.abs(formData.currentWeight - formData.targetWeight)}kg)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nivel:</span>
                    <span className="font-semibold capitalize">
                      {formData.fitnessLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frecuencia:</span>
                    <span className="font-semibold">
                      {formData.daysPerWeek} días/semana
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-semibold">{formData.timeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equipamiento:</span>
                    <span className="font-semibold">{formData.equipment}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Recordatorio:</strong> Consulta con un profesional
                  de la salud antes de iniciar cualquier programa de ejercicio,
                  especialmente si tienes condiciones médicas preexistentes.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Atrás
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Dumbbell className="w-5 h-5" />
                Generar Plan de Fitness
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
