"use client";

import { useState } from "react";
import {
  X,
  Plane,
  Calendar,
  DollarSign,
  Users,
  Sparkles,
} from "lucide-react";

export type TravelFormData = {
  destination: string;
  duration: number;
  budget: number;
  travelers: number;
  travelStyle: "mochilero" | "estándar" | "lujo";
  interests: string[];
  departureDate: string;
};

interface TravelPlanFormProps {
  onSubmit: (data: TravelFormData) => void;
  onClose: () => void;
}

const interestOptions = [
  { id: "cultura", label: "Cultura e Historia", emoji: "🏛️" },
  { id: "comida", label: "Gastronomía", emoji: "🍜" },
  { id: "aventura", label: "Aventura", emoji: "🏔️" },
  { id: "playa", label: "Playa y Relax", emoji: "🏖️" },
  { id: "ciudad", label: "Vida Urbana", emoji: "🏙️" },
  { id: "naturaleza", label: "Naturaleza", emoji: "🌿" },
  { id: "shopping", label: "Compras", emoji: "🛍️" },
  { id: "nocturna", label: "Vida Nocturna", emoji: "🎉" },
];

export function TravelPlanForm({ onSubmit, onClose }: TravelPlanFormProps) {
  const [formData, setFormData] = useState<TravelFormData>({
    destination: "",
    duration: 7,
    budget: 2000,
    travelers: 1,
    travelStyle: "estándar",
    interests: [],
    departureDate: "",
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const toggleInterest = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const canAdvanceFromStep1 =
    formData.destination.trim().length > 0 &&
    formData.duration > 0 &&
    formData.budget > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Planifica tu Viaje</h2>
                <p className="text-blue-100 text-sm">Paso {step} de 3</p>
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
                <label
                  htmlFor="travel-destination"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  ¿A dónde quieres viajar? *
                </label>
                <input
                  id="travel-destination"
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  placeholder="Ej: París, Francia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puedes escribir ciudad, país o región.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="travel-duration"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Duración (días) *
                  </label>
                  <input
                    id="travel-duration"
                    type="number"
                    required
                    min={1}
                    max={90}
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="travel-travelers"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    <Users className="w-4 h-4 inline mr-1" />
                    Viajeros
                  </label>
                  <input
                    id="travel-travelers"
                    type="number"
                    min={1}
                    max={20}
                    value={formData.travelers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        travelers: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="travel-budget"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Presupuesto Total (USD) *
                </label>
                <input
                  id="travel-budget"
                  type="number"
                  required
                  min={100}
                  step={100}
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Por día: $
                  {Math.round(formData.budget / Math.max(1, formData.duration))} USD
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-3">
                  Estilo de Viaje
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(["mochilero", "estándar", "lujo"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, travelStyle: style })
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.travelStyle === style
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">
                          {style === "mochilero"
                            ? "🎒"
                            : style === "estándar"
                              ? "🏨"
                              : "✨"}
                        </div>
                        <div className="font-medium capitalize">{style}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-3">
                  ¿Qué te interesa? (Selecciona varios)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleInterest(option.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        formData.interests.includes(option.id)
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <span className="text-xl mr-2">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Resumen de tu Viaje</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destino:</span>
                    <span className="font-semibold">{formData.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-semibold">{formData.duration} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Viajeros:</span>
                    <span className="font-semibold">{formData.travelers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Presupuesto:</span>
                    <span className="font-semibold">${formData.budget} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estilo:</span>
                    <span className="font-semibold capitalize">
                      {formData.travelStyle}
                    </span>
                  </div>
                  {formData.interests.length > 0 && (
                    <div>
                      <span className="text-gray-600">Intereses:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.interests.map((id) => {
                          const option = interestOptions.find(
                            (o) => o.id === id
                          );
                          return (
                            <span
                              key={id}
                              className="px-2 py-1 bg-white rounded-full text-xs"
                            >
                              {option?.emoji} {option?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="travel-date"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Fecha de Salida (Opcional)
                </label>
                <input
                  id="travel-date"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) =>
                    setFormData({ ...formData, departureDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
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
                disabled={step === 1 && !canAdvanceFromStep1}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generar Plan de Viaje
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
