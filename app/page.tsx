"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useCallback, useState } from "react";
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
  ConversationManager,
  validateContext,
  stripConversationMeta,
  applyOmitDefaults,
} from "@/lib/conversation-manager";
import {
  FitnessPlan,
  TravelPlan,
  DevRoadmap,
  TravelRealTimeData,
} from "./components/templates/types";

// ============================================================
// Tool result rendered directly in the chat
// ============================================================

type ToolBubbleVariant = "info" | "success" | "error";

const TOOL_BUBBLE_PALETTE: Record<ToolBubbleVariant, string> = {
  info: "border-slate-300 bg-slate-50 text-slate-700 italic",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

function ToolBubble({
  variant = "info",
  children,
}: {
  variant?: ToolBubbleVariant;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border rounded-xl px-4 py-3 my-1 leading-relaxed text-sm ${TOOL_BUBBLE_PALETTE[variant]}`}
    >
      {children}
    </div>
  );
}

// ============================================================
// Form → context mappers (used when the user uses the modal forms)
// ============================================================

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

// ============================================================
// Pure helpers (no React state) — kept outside the component so
// they don't get recreated on every render and are safe to use
// inside `useCallback` deps.
// ============================================================

async function generateUI(
  intent: "travel" | "fitness" | "development",
  context: unknown
) {
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
  return (await res.json()) as {
    content: string;
    context: unknown;
    realData?: TravelRealTimeData;
  };
}

function CopilotActionBubble({
  status,
  result,
  pendingLabel,
}: {
  status: string;
  result: unknown;
  pendingLabel: string;
}) {
  if (status === "executing" || status === "inProgress") {
    return <ToolBubble variant="info">{pendingLabel}</ToolBubble>;
  }
  if (status === "complete") {
    const text = typeof result === "string" ? result : "";
    const isFollowUp = text.includes("¿") || text.includes("(opcional");
    return (
      <ToolBubble variant={isFollowUp ? "info" : "success"}>{text}</ToolBubble>
    );
  }
  return <></>;
}

function mapSpanishToExperience(
  raw?: string
): "beginner" | "intermediate" | "advanced" | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const x = raw.trim().toLowerCase();
  if (/principiante|novato|iniciante|beginner/.test(x)) return "beginner";
  if (/intermedio|intermediate/.test(x)) return "intermediate";
  if (/avanzado|experto|advanced/.test(x)) return "advanced";
  return undefined;
}

function mapTravelStyle(
  raw?: string
): "budget" | "standard" | "luxury" | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const x = raw.trim().toLowerCase();
  if (/mochilero|barato|económico|budget/.test(x)) return "budget";
  if (/estandar|estándar|medio|standard/.test(x)) return "standard";
  if (/lujo|premium|luxury/.test(x)) return "luxury";
  return undefined;
}

type FitnessGoalEnum =
  | "weight_loss"
  | "muscle_gain"
  | "endurance"
  | "flexibility"
  | "general";

function mapFitnessGoal(raw?: unknown): FitnessGoalEnum | undefined {
  if (typeof raw !== "string") return undefined;
  const x = raw.trim().toLowerCase();
  if (!x) return undefined;
  // Si ya viene como enum válido, devuélvelo tal cual.
  if (
    x === "weight_loss" ||
    x === "muscle_gain" ||
    x === "endurance" ||
    x === "flexibility" ||
    x === "general"
  ) {
    return x;
  }
  if (/baj(ar|o)\s*(de\s*)?peso|perder\s*peso|adelgaz|weight\s*loss|quemar\s*grasa|definir/i.test(x)) {
    return "weight_loss";
  }
  if (/m[uú]sculo|hipertrofia|ganar\s*masa|muscle|bulk/i.test(x)) {
    return "muscle_gain";
  }
  if (/resistencia|cardio|endurance|aer[oó]bic|correr|running/i.test(x)) {
    return "endurance";
  }
  if (/flexibilidad|movilidad|yoga|stretch/i.test(x)) {
    return "flexibility";
  }
  if (/tonificar|forma|general|salud|bienestar/i.test(x)) {
    return "general";
  }
  return "general";
}

function finalizeFitnessCollected(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...data };
  const mapped = mapFitnessGoal(out.goal);
  if (mapped) out.goal = mapped;
  return out;
}

function finalizeDevCollected(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  const g = typeof out.goal === "string" ? out.goal.trim() : "";
  if (g) {
    if (!out.learningGoal) out.learningGoal = g;
    if (!out.projectType) out.projectType = g;
    delete out.goal;
  }
  return out;
}

// NOTE: previously the chat handlers called `/api/analyze` on every tool
// invocation to re-extract context from a synthesized sentence. That added
// 5–25s of latency per turn for ~zero benefit — the CopilotKit tool already
// gave us a structured `args` object. We now rely solely on those args + the
// persisted conversation state. The `/api/analyze` endpoint stays intact for
// external callers / form flows.

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
    currentWeight: data.currentWeight,
    targetWeight: data.targetWeight,
    height: data.height,
    age: data.age,
    gender: data.gender,
  };
}

export default function Home() {
  // ----------------------------------------------------------
  // 1. State
  // ----------------------------------------------------------
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [fitnessPlan, setFitnessPlan] = useState<FitnessPlan | null>(null);
  const [devPlan, setDevPlan] = useState<DevRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [showFitnessForm, setShowFitnessForm] = useState(false);
  const [showDevForm, setShowDevForm] = useState(false);

  // ----------------------------------------------------------
  // 2. Core flows (validate → generate-ui → parse → setState)
  // ----------------------------------------------------------
  const runTravelFlow = useCallback(
    async (rawCtx: Record<string, unknown>): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const ctx = TravelContextSchema.parse(stripNullish(rawCtx));
        console.log("✅ Travel context validated:", ctx);
        const data = await generateUI("travel", ctx);
        const plan = parseTravelPlan(data.content, ctx);
        if (data.realData) {
          plan.realData = data.realData;
        }
        console.log("🗺️ Travel plan parsed:", plan);
        setTravelPlan(plan);
        setFitnessPlan(null);
        setDevPlan(null);
        return `¡Plan de viaje a ${ctx.destination} listo! Mira el itinerario, presupuesto y recomendaciones en la pantalla principal.`;
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error
            ? err.message
            : "Hubo un error generando el plan de viaje";
        console.error("❌ Travel error:", err);
        const friendly = friendlyErrorMessage(rawMsg, "viaje");
        setError(friendly);
        throw new Error(friendly);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const runFitnessFlow = useCallback(
    async (rawCtx: Record<string, unknown>): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const ctx = FitnessContextSchema.parse(stripNullish(rawCtx));
        console.log("✅ Fitness context validated:", ctx);
        const data = await generateUI("fitness", ctx);
        const plan = parseFitnessPlan(data.content, ctx);
        console.log("🏋️ Fitness plan parsed:", plan);
        setFitnessPlan(plan);
        setTravelPlan(null);
        setDevPlan(null);
        return "¡Plan de fitness generado! Mira tu rutina semanal y guía nutricional en la pantalla principal.";
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error
            ? err.message
            : "Hubo un error generando el plan de fitness";
        console.error("❌ Fitness error:", err);
        const friendly = friendlyErrorMessage(rawMsg, "fitness");
        setError(friendly);
        throw new Error(friendly);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const runDevFlow = useCallback(
    async (rawCtx: Record<string, unknown>): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const ctx = DevContextSchema.parse(stripNullish(rawCtx));
        console.log("✅ Dev context validated:", ctx);
        const data = await generateUI("development", ctx);
        const plan = parseDevRoadmap(data.content, ctx);
        console.log("📚 Dev roadmap parsed:", plan);
        setDevPlan(plan);
        setTravelPlan(null);
        setFitnessPlan(null);
        return `¡Roadmap para "${ctx.projectType}" listo! Mira fases, stack y recursos en la pantalla principal.`;
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error
            ? err.message
            : "Hubo un error generando el roadmap de desarrollo";
        console.error("❌ Dev error:", err);
        const friendly = friendlyErrorMessage(rawMsg, "desarrollo");
        setError(friendly);
        throw new Error(friendly);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ----------------------------------------------------------
  // 3. Chat tool handlers — structured args (todos opcionales).
  //    Reconstruimos una frase con lo que mandó el LLM, lo
  //    pasamos a /api/analyze para extraer el contexto completo
  //    y mergeamos los args primitivos sobre el resultado para no
  //    perder lo que el modelo SÍ acertó.
  // ----------------------------------------------------------
  const handleGenerateTravelFromChat = useCallback(
    async (args: {
      destination?: string;
      duration?: number;
      budget?: number;
      travelers?: number;
      interests?: string;
      travelStyle?: string;
      omit?: boolean;
    }): Promise<string> => {
      console.log("🌍 Travel tool called with args:", args);

      try {
        let conversation = ConversationManager.load();
        if (!conversation || conversation.intent !== "travel") {
          conversation = {
            intent: "travel",
            collectedData: {},
            missingFields: [],
            isComplete: false,
          };
          ConversationManager.save(conversation);
        }

        const mappedStyle = mapTravelStyle(args.travelStyle);
        const prevEmpty = Number(
          conversation.collectedData._emptyAttempts ?? 0
        );
        const hasNewData =
          args.omit === true ||
          (args.destination != null &&
            String(args.destination).trim() !== "") ||
          (args.duration != null && Number.isFinite(args.duration)) ||
          (args.budget != null && Number.isFinite(args.budget)) ||
          (args.travelers != null && Number.isFinite(args.travelers)) ||
          (args.interests != null && String(args.interests).trim() !== "") ||
          mappedStyle != null;

        if (!hasNewData) {
          console.warn(
            "⚠️ Travel tool called without new fields — possible loop"
          );
          const emptyAttempts = prevEmpty + 1;
          if (emptyAttempts > 2) {
            console.error("❌ Too many empty travel tool calls, clearing state");
            ConversationManager.clear();
            return "Parece que hay un problema. Empecemos de nuevo: ¿a dónde quieres viajar?";
          }
          ConversationManager.mergeData({ _emptyAttempts: emptyAttempts });
          conversation = ConversationManager.load()!;
        } else {
          ConversationManager.mergeData({ _emptyAttempts: 0 });
          conversation = ConversationManager.load()!;
        }

        const patch: Record<string, unknown> = {};
        if (args.destination != null && String(args.destination).trim() !== "") {
          patch.destination = String(args.destination).trim();
        }
        if (args.duration != null && Number.isFinite(args.duration)) {
          patch.duration = args.duration;
        }
        if (args.budget != null && Number.isFinite(args.budget)) {
          patch.budget = args.budget;
        }
        if (args.travelers != null && Number.isFinite(args.travelers)) {
          patch.travelers = args.travelers;
        }
        if (args.interests != null && String(args.interests).trim() !== "") {
          const list = String(args.interests)
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (list.length > 0) patch.interests = list;
        }
        if (mappedStyle) patch.travelStyle = mappedStyle;

        conversation = ConversationManager.mergeData(patch);

        let merged: Record<string, unknown> = { ...conversation.collectedData };
        if (args.omit === true) {
          merged = applyOmitDefaults("travel", merged);
        }

        conversation = {
          ...conversation,
          collectedData: merged,
        };
        ConversationManager.save(conversation);

        console.log("═══════════════════════════════════");
        console.log("📊 CURRENT STATE (travel):");
        console.log("  Intent:", conversation.intent);
        console.log(
          "  Collected:",
          JSON.stringify(conversation.collectedData, null, 2)
        );
        console.log("  Patch / tool args:", JSON.stringify(patch, null, 2));
        console.log("═══════════════════════════════════");

        const validation = validateContext(conversation);
        console.log("✅ Validation:", validation);

        if (!validation.isComplete && validation.nextQuestion) {
          console.log(`❓ Asking for: ${validation.nextField}`);
          return validation.nextQuestion;
        }

        ConversationManager.clear();
        return await runTravelFlow(stripConversationMeta(merged));
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error
            ? err.message
            : "Error generando el plan de viaje";
        console.error("❌ Travel chat error:", err);
        const friendly = friendlyErrorMessage(rawMsg, "viaje");
        setError(friendly);
        ConversationManager.clear();
        throw new Error(friendly);
      }
    },
    [runTravelFlow]
  );

  const handleGenerateFitnessFromChat = useCallback(
    async (args: {
      goal?: string;
      currentWeight?: number;
      targetWeight?: number;
      height?: number;
      age?: number;
      currentLevel?: string;
      daysPerWeek?: number;
      omit?: boolean;
    }): Promise<string> => {
      console.log("💪 Fitness tool called with args:", args);

      try {
        let conversation = ConversationManager.load();
        if (!conversation || conversation.intent !== "fitness") {
          conversation = {
            intent: "fitness",
            collectedData: {},
            missingFields: [],
            isComplete: false,
          };
          ConversationManager.save(conversation);
        }

        const mappedLevel = mapSpanishToExperience(args.currentLevel);
        const prevEmpty = Number(
          conversation.collectedData._emptyAttempts ?? 0
        );
        const hasNewData =
          args.omit === true ||
          (args.goal != null && String(args.goal).trim() !== "") ||
          (args.currentWeight != null && Number.isFinite(args.currentWeight)) ||
          (args.targetWeight != null && Number.isFinite(args.targetWeight)) ||
          (args.height != null && Number.isFinite(args.height)) ||
          (args.age != null && Number.isFinite(args.age)) ||
          mappedLevel != null ||
          (args.daysPerWeek != null && Number.isFinite(args.daysPerWeek));

        if (!hasNewData) {
          console.warn(
            "⚠️ Fitness tool called without new fields — possible loop"
          );
          const emptyAttempts = prevEmpty + 1;
          if (emptyAttempts > 2) {
            ConversationManager.clear();
            return "Parece que hay un problema. Empecemos de nuevo: ¿cuál es tu objetivo de fitness?";
          }
          ConversationManager.mergeData({ _emptyAttempts: emptyAttempts });
          conversation = ConversationManager.load()!;
        } else {
          ConversationManager.mergeData({ _emptyAttempts: 0 });
          conversation = ConversationManager.load()!;
        }

        const patch: Record<string, unknown> = {};
        if (args.goal != null && String(args.goal).trim() !== "") {
          // Guardamos el goal como enum desde el principio para que el
          // contexto persistido sea consistente con FitnessContextSchema.
          // Si no logramos mapear, dejamos el texto crudo y dejamos que
          // finalizeFitnessCollected lo convierta antes de validar.
          const mappedGoal = mapFitnessGoal(args.goal);
          patch.goal = mappedGoal ?? String(args.goal).trim();
        }
        if (args.currentWeight != null && Number.isFinite(args.currentWeight)) {
          patch.currentWeight = args.currentWeight;
        }
        if (args.targetWeight != null && Number.isFinite(args.targetWeight)) {
          patch.targetWeight = args.targetWeight;
        }
        if (args.height != null && Number.isFinite(args.height)) {
          patch.height = args.height;
        }
        if (args.age != null && Number.isFinite(args.age) && args.age > 0) {
          patch.age = args.age;
        }
        if (mappedLevel) patch.currentLevel = mappedLevel;
        if (
          args.daysPerWeek != null &&
          Number.isFinite(args.daysPerWeek) &&
          args.daysPerWeek > 0
        ) {
          patch.daysPerWeek = Math.min(7, Math.max(1, Math.round(args.daysPerWeek)));
        }

        conversation = ConversationManager.mergeData(patch);

        let merged: Record<string, unknown> = finalizeFitnessCollected({
          ...conversation.collectedData,
        });
        if (args.omit === true) {
          merged = applyOmitDefaults("fitness", merged);
        }

        conversation = {
          ...conversation,
          collectedData: merged,
        };
        ConversationManager.save(conversation);

        console.log("═══════════════════════════════════");
        console.log("📊 CURRENT STATE (fitness):");
        console.log("  Intent:", conversation.intent);
        console.log(
          "  Collected:",
          JSON.stringify(conversation.collectedData, null, 2)
        );
        console.log("  Patch / tool args:", JSON.stringify(patch, null, 2));
        console.log("═══════════════════════════════════");

        const validation = validateContext(conversation);
        console.log("✅ Validation:", validation);

        if (!validation.isComplete && validation.nextQuestion) {
          console.log(`❓ Asking for: ${validation.nextField}`);
          return validation.nextQuestion;
        }

        ConversationManager.clear();
        return await runFitnessFlow(stripConversationMeta(merged));
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error
            ? err.message
            : "Error generando el plan de fitness";
        console.error("❌ Fitness chat error:", err);
        const friendly = friendlyErrorMessage(rawMsg, "fitness");
        setError(friendly);
        ConversationManager.clear();
        throw new Error(friendly);
      }
    },
    [runFitnessFlow]
  );

  const handleGenerateDevFromChat = useCallback(
    async (args: {
      goal?: string;
      currentLevel?: string;
      timeframe?: string;
      targetStack?: string;
      studyTimePerWeek?: number;
      omit?: boolean;
    }): Promise<string> => {
      console.log("💻 Dev tool called with args:", args);

      try {
        let conversation = ConversationManager.load();
        if (!conversation || conversation.intent !== "development") {
          conversation = {
            intent: "development",
            collectedData: {},
            missingFields: [],
            isComplete: false,
          };
          ConversationManager.save(conversation);
        }

        const exp = mapSpanishToExperience(args.currentLevel);
        const stackList =
          args.targetStack != null && String(args.targetStack).trim() !== ""
            ? String(args.targetStack)
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

        const prevEmpty = Number(
          conversation.collectedData._emptyAttempts ?? 0
        );
        const hasNewData =
          args.omit === true ||
          (args.goal != null && String(args.goal).trim() !== "") ||
          exp != null ||
          (args.timeframe != null && String(args.timeframe).trim() !== "") ||
          stackList.length > 0 ||
          (args.studyTimePerWeek != null &&
            Number.isFinite(args.studyTimePerWeek));

        if (!hasNewData) {
          console.warn("⚠️ Dev tool called without new fields — possible loop");
          const emptyAttempts = prevEmpty + 1;
          if (emptyAttempts > 2) {
            ConversationManager.clear();
            return "Parece que hay un problema. Empecemos de nuevo: ¿qué quieres aprender?";
          }
          ConversationManager.mergeData({ _emptyAttempts: emptyAttempts });
          conversation = ConversationManager.load()!;
        } else {
          ConversationManager.mergeData({ _emptyAttempts: 0 });
          conversation = ConversationManager.load()!;
        }

        const patch: Record<string, unknown> = {};
        if (args.goal != null && String(args.goal).trim() !== "") {
          patch.goal = String(args.goal).trim();
        }
        if (exp) patch.experience = exp;
        if (args.timeframe != null && String(args.timeframe).trim() !== "") {
          patch.timeframe = String(args.timeframe).trim();
        }
        if (stackList.length > 0) patch.targetStack = stackList;
        if (
          args.studyTimePerWeek != null &&
          Number.isFinite(args.studyTimePerWeek) &&
          args.studyTimePerWeek > 0
        ) {
          patch.studyTimePerWeek = args.studyTimePerWeek;
        }

        conversation = ConversationManager.mergeData(patch);

        let merged: Record<string, unknown> = finalizeDevCollected({
          ...conversation.collectedData,
        });
        if (args.omit === true) {
          merged = applyOmitDefaults("development", merged);
        }

        conversation = {
          ...conversation,
          collectedData: merged,
        };
        ConversationManager.save(conversation);

        console.log("═══════════════════════════════════");
        console.log("📊 CURRENT STATE (development):");
        console.log("  Intent:", conversation.intent);
        console.log(
          "  Collected:",
          JSON.stringify(conversation.collectedData, null, 2)
        );
        console.log("  Patch / tool args:", JSON.stringify(patch, null, 2));
        console.log("═══════════════════════════════════");

        const validation = validateContext(conversation);
        console.log("✅ Validation:", validation);

        if (!validation.isComplete && validation.nextQuestion) {
          console.log(`❓ Asking for: ${validation.nextField}`);
          return validation.nextQuestion;
        }

        ConversationManager.clear();
        return await runDevFlow(stripConversationMeta(merged));
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error
            ? err.message
            : "Error generando el roadmap de desarrollo";
        console.error("❌ Dev chat error:", err);
        const friendly = friendlyErrorMessage(rawMsg, "desarrollo");
        setError(friendly);
        ConversationManager.clear();
        throw new Error(friendly);
      }
    },
    [runDevFlow]
  );

  // ----------------------------------------------------------
  // 4. Register Copilot actions with stable handler refs.
  //    Status-based render → bubble in chat reflects progress.
  // ----------------------------------------------------------
  useCopilotAction(
    {
      name: COPILOT_ACTIONS.generateTravelPlan.name,
      description: COPILOT_ACTIONS.generateTravelPlan.description,
      parameters: COPILOT_ACTIONS.generateTravelPlan.parameters,
      handler: handleGenerateTravelFromChat,
      render: ({ status, result }) => (
        <CopilotActionBubble
          status={status}
          result={result}
          pendingLabel="Generando tu plan de viaje…"
        />
      ),
    },
    [handleGenerateTravelFromChat]
  );

  useCopilotAction(
    {
      name: COPILOT_ACTIONS.generateFitnessPlan.name,
      description: COPILOT_ACTIONS.generateFitnessPlan.description,
      parameters: COPILOT_ACTIONS.generateFitnessPlan.parameters,
      handler: handleGenerateFitnessFromChat,
      render: ({ status, result }) => (
        <CopilotActionBubble
          status={status}
          result={result}
          pendingLabel="Generando tu plan de fitness…"
        />
      ),
    },
    [handleGenerateFitnessFromChat]
  );

  useCopilotAction(
    {
      name: COPILOT_ACTIONS.generateDevRoadmap.name,
      description: COPILOT_ACTIONS.generateDevRoadmap.description,
      parameters: COPILOT_ACTIONS.generateDevRoadmap.parameters,
      handler: handleGenerateDevFromChat,
      render: ({ status, result }) => (
        <CopilotActionBubble
          status={status}
          result={result}
          pendingLabel="Generando tu roadmap…"
        />
      ),
    },
    [handleGenerateDevFromChat]
  );

  const showHero =
    !travelPlan && !fitnessPlan && !devPlan && !loading && !error;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
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

        {loading ? (
          <LoadingSpinner message="Generando tu plan personalizado..." />
        ) : null}

        {error && !loading ? (
          <ErrorMessage message={error} onRetry={() => setError(null)} />
        ) : null}

        {travelPlan && !loading && !error ? (
          <div className="max-w-6xl mx-auto animate-fade-in px-4">
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <button
                type="button"
                onClick={() => {
                  setTravelPlan(null);
                  ConversationManager.clear();
                }}
                className="text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
              >
                ← Volver al inicio
              </button>
              <button
                type="button"
                onClick={() => {
                  ConversationManager.clear();
                  window.alert(
                    "Conversación reiniciada. Puedes empezar de nuevo en el chat."
                  );
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-2 ml-auto text-sm"
              >
                🔄 Nueva conversación
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
              <TravelPlanUI plan={travelPlan} />
            </div>
          </div>
        ) : null}

        {fitnessPlan && !loading && !error && !travelPlan ? (
          <div className="max-w-6xl mx-auto animate-fade-in px-4">
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <button
                type="button"
                onClick={() => {
                  setFitnessPlan(null);
                  ConversationManager.clear();
                }}
                className="text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
              >
                ← Volver al inicio
              </button>
              <button
                type="button"
                onClick={() => {
                  ConversationManager.clear();
                  window.alert(
                    "Conversación reiniciada. Puedes empezar de nuevo en el chat."
                  );
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-2 ml-auto text-sm"
              >
                🔄 Nueva conversación
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
              <FitnessPlanUI plan={fitnessPlan} />
            </div>
          </div>
        ) : null}

        {devPlan && !loading && !error && !travelPlan && !fitnessPlan ? (
          <div className="max-w-6xl mx-auto animate-fade-in px-4">
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <button
                type="button"
                onClick={() => {
                  setDevPlan(null);
                  ConversationManager.clear();
                }}
                className="text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
              >
                ← Volver al inicio
              </button>
              <button
                type="button"
                onClick={() => {
                  ConversationManager.clear();
                  window.alert(
                    "Conversación reiniciada. Puedes empezar de nuevo en el chat."
                  );
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-2 ml-auto text-sm"
              >
                🔄 Nueva conversación
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
              <DevRoadmapUI roadmap={devPlan} />
            </div>
          </div>
        ) : null}
      </div>

      {showTravelForm ? (
        <TravelPlanForm
          onClose={() => setShowTravelForm(false)}
          onSubmit={(data) => {
            setShowTravelForm(false);
            ConversationManager.clear();
            void runTravelFlow(travelFormToContext(data));
          }}
        />
      ) : null}

      {showFitnessForm ? (
        <FitnessPlanForm
          onClose={() => setShowFitnessForm(false)}
          onSubmit={(data) => {
            setShowFitnessForm(false);
            ConversationManager.clear();
            void runFitnessFlow(fitnessFormToContext(data));
          }}
        />
      ) : null}

      {showDevForm ? (
        <DevRoadmapForm
          onClose={() => setShowDevForm(false)}
          onSubmit={(data) => {
            setShowDevForm(false);
            ConversationManager.clear();
            void runDevFlow(devFormToContext(data));
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
