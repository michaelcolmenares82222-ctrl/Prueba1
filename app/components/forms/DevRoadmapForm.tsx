"use client";

import { useState } from "react";
import { X, Code2, Target, BookOpen, Sparkles } from "lucide-react";

export type DevFormData = {
  projectType: string;
  learningGoal: string;
  timeframeLabel: "1 mes" | "3 meses" | "6 meses" | "12 meses";
  experience: "principiante" | "intermedio" | "avanzado";
  studyTimePerWeek: number;
  currentSkillsRaw: string;
  targetStackRaw: string;
};

interface DevRoadmapFormProps {
  onSubmit: (data: DevFormData) => void;
  onClose: () => void;
}

const timeframeWeeksMap: Record<DevFormData["timeframeLabel"], number> = {
  "1 mes": 4,
  "3 meses": 12,
  "6 meses": 24,
  "12 meses": 48,
};

export function DevRoadmapForm({ onSubmit, onClose }: DevRoadmapFormProps) {
  const [formData, setFormData] = useState<DevFormData>({
    projectType: "",
    learningGoal: "",
    timeframeLabel: "3 meses",
    experience: "principiante",
    studyTimePerWeek: 10,
    currentSkillsRaw: "",
    targetStackRaw: "",
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const canAdvanceStep1 =
    formData.projectType.trim().length > 0 &&
    formData.learningGoal.trim().length > 0;

  const weeks = timeframeWeeksMap[formData.timeframeLabel];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-indigo-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tu roadmap de desarrollo</h2>
                <p className="text-sky-100 text-sm">Paso {step} de 3</p>
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
                  htmlFor="dev-project"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  ¿Qué quieres construir o en qué rol quieres enfocarte? *
                </label>
                <input
                  id="dev-project"
                  type="text"
                  required
                  value={formData.projectType}
                  onChange={(e) =>
                    setFormData({ ...formData, projectType: e.target.value })
                  }
                  placeholder="Ej: Frontend React, App móvil con Expo, Backend Node…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="dev-goal"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Objetivo de aprendizaje *
                </label>
                <textarea
                  id="dev-goal"
                  required
                  rows={4}
                  value={formData.learningGoal}
                  onChange={(e) =>
                    setFormData({ ...formData, learningGoal: e.target.value })
                  }
                  placeholder="Ej: Conseguir mi primer empleo junior, lanzar un SaaS MVP, dominar TypeScript…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 resize-y min-h-[100px]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label
                  htmlFor="dev-timeframe"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Plazo aproximado
                </label>
                <select
                  id="dev-timeframe"
                  value={formData.timeframeLabel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timeframeLabel: e.target
                        .value as DevFormData["timeframeLabel"],
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="1 mes">1 mes (~4 semanas)</option>
                  <option value="3 meses">3 meses (~12 semanas)</option>
                  <option value="6 meses">6 meses (~24 semanas)</option>
                  <option value="12 meses">12 meses (~48 semanas)</option>
                </select>
              </div>

              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-3">
                  Tu nivel actual
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    ["principiante", "intermedio", "avanzado"] as const
                  ).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, experience: level })
                      }
                      className={`p-4 rounded-xl border-2 transition-all capitalize ${
                        formData.experience === level
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="dev-hours"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Horas de estudio por semana
                </label>
                <input
                  id="dev-hours"
                  type="number"
                  min={2}
                  max={60}
                  value={formData.studyTimePerWeek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      studyTimePerWeek: Math.max(
                        2,
                        parseInt(e.target.value, 10) || 2
                      ),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Entre 2 y 60 horas; sé realista para mantener el plan.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label
                  htmlFor="dev-skills"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Skills que ya dominas (opcional)
                </label>
                <textarea
                  id="dev-skills"
                  rows={2}
                  value={formData.currentSkillsRaw}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentSkillsRaw: e.target.value,
                    })
                  }
                  placeholder="Separadas por coma: HTML, CSS, JavaScript…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              <div>
                <label
                  htmlFor="dev-stack"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Stack o tecnologías objetivo (opcional)
                </label>
                <textarea
                  id="dev-stack"
                  rows={2}
                  value={formData.targetStackRaw}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetStackRaw: e.target.value,
                    })
                  }
                  placeholder="Separadas por coma: React, Next.js, PostgreSQL…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-indigo-50 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Resumen</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    <span className="text-gray-500">Enfoque:</span>{" "}
                    <span className="font-medium">{formData.projectType}</span>
                  </li>
                  <li>
                    <span className="text-gray-500">Plazo:</span>{" "}
                    <span className="font-medium">
                      {formData.timeframeLabel} (~{weeks} sem.)
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-500">Nivel:</span>{" "}
                    <span className="font-medium capitalize">
                      {formData.experience}
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-500">Horas/semana:</span>{" "}
                    <span className="font-medium">
                      {formData.studyTimePerWeek} h
                    </span>
                  </li>
                </ul>
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
                disabled={step === 1 && !canAdvanceStep1}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generar roadmap
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export { timeframeWeeksMap };
