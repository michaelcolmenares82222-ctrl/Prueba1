"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Loader2,
  AlertCircle,
  Code2,
  Eye,
  RefreshCw,
  X,
} from "lucide-react";
import { CodePreview } from "./CodePreview";
import { CodeEditor } from "./CodeEditor";
import type { GeneratedApp } from "@/lib/app-builder/code-generator";

// ============================================
// Example prompts for the empty state
// ============================================

const EXAMPLES: Array<{ label: string; prompt: string }> = [
  {
    label: "Todo list with priorities",
    prompt:
      "Build a beautiful todo app where each task has a priority (low/medium/high), can be filtered, and the UI is dark-themed.",
  },
  {
    label: "Pomodoro timer",
    prompt:
      "Build a pomodoro timer with focus, short break, and long break modes, a circular progress ring, and a session counter.",
  },
  {
    label: "Tip calculator",
    prompt:
      "Build a tip calculator with a custom tip slider, party-size splitter, and a clean iOS-style design.",
  },
  {
    label: "Markdown preview",
    prompt:
      "Build a side-by-side markdown editor and live preview using Tailwind only — no extra dependencies.",
  },
];

// ============================================
// API helpers
// ============================================

async function callBuildApp(
  body:
    | { mode: "create"; prompt: string }
    | { mode: "refine"; currentApp: GeneratedApp; feedback: string }
): Promise<GeneratedApp> {
  const res = await fetch("/api/build-app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // We always try to parse JSON — the route returns JSON for both
  // success and failure modes.
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* fall through */
  }

  if (!res.ok || !payload || typeof payload !== "object") {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  const data = payload as {
    success?: boolean;
    app?: GeneratedApp;
    error?: string;
  };

  if (!data.success || !data.app) {
    throw new Error(data.error || "The builder didn't return an app.");
  }

  return data.app;
}

// ============================================
// Main component
// ============================================

type View = "preview" | "code";

export function AppBuilder() {
  const [prompt, setPrompt] = useState("");
  const [feedback, setFeedback] = useState("");
  const [app, setApp] = useState<GeneratedApp | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("preview");

  const isBusy = loading || refining;

  const handleCreate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const result = await callBuildApp({ mode: "create", prompt: trimmed });
      setApp(result);
      setView("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [prompt, loading]);

  const handleRefine = useCallback(async () => {
    const trimmed = feedback.trim();
    if (!trimmed || !app || refining) return;

    setRefining(true);
    setError(null);
    try {
      const result = await callBuildApp({
        mode: "refine",
        currentApp: app,
        feedback: trimmed,
      });
      setApp(result);
      setFeedback("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refinement failed.");
    } finally {
      setRefining(false);
    }
  }, [feedback, app, refining]);

  const handleReset = useCallback(() => {
    setApp(null);
    setPrompt("");
    setFeedback("");
    setError(null);
  }, []);

  const heroVisible = !app;

  return (
    <div className="min-h-[640px] w-full bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/30 text-slate-100 rounded-3xl border border-slate-800/80 overflow-hidden">
      <Header onReset={app ? handleReset : undefined} />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="px-6 pb-8">
        <AnimatePresence mode="wait">
          {heroVisible ? (
            <HeroView
              key="hero"
              prompt={prompt}
              onPromptChange={setPrompt}
              loading={loading}
              onCreate={handleCreate}
            />
          ) : (
            <BuiltView
              key="built"
              app={app!}
              view={view}
              onViewChange={setView}
              feedback={feedback}
              onFeedbackChange={setFeedback}
              refining={refining}
              onRefine={handleRefine}
              isBusy={isBusy}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AppBuilder;

// ============================================
// Sub-components
// ============================================

function Header({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">App Builder</h2>
          <p className="text-[11px] text-slate-400">
            Describe an app — get React + TS + Tailwind code, live.
          </p>
        </div>
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-100 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> New app
        </button>
      )}
    </div>
  );
}

function ErrorBanner({
  error,
  onDismiss,
}: {
  error: string | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Something went wrong</div>
            <div className="text-rose-200/80 text-xs mt-0.5">{error}</div>
          </div>
          <button
            onClick={onDismiss}
            className="text-rose-200/60 hover:text-rose-100 transition"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HeroView({
  prompt,
  onPromptChange,
  loading,
  onCreate,
}: {
  prompt: string;
  onPromptChange: (v: string) => void;
  loading: boolean;
  onCreate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="pt-8 max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
          What should we build?
        </h1>
        <p className="text-slate-400 mt-3">
          Type a prompt and we&apos;ll generate a full React app in seconds.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-3 shadow-2xl">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onCreate();
            }
          }}
          rows={4}
          placeholder="e.g. A habit tracker that lets me check off habits each day with a streak counter and a weekly heatmap."
          className="w-full bg-transparent resize-none text-base placeholder:text-slate-500 focus:outline-none px-3 py-2"
        />
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[11px] text-slate-500">
            Tip: ⌘/Ctrl + Enter to generate.
          </span>
          <button
            onClick={onCreate}
            disabled={!prompt.trim() || loading}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-40 disabled:cursor-not-allowed transition rounded-xl px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/30"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Building…
              </>
            ) : (
              <>
                <Wand2 size={14} /> Build app
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs text-slate-500 mb-2 px-1">
          Or start from an example:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => onPromptChange(ex.prompt)}
              className="text-xs text-slate-300 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full px-3 py-1.5 transition"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <BuildingIndicator visible={loading} />
    </motion.div>
  );
}

function BuildingIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-center gap-3"
        >
          <Loader2 size={18} className="animate-spin text-indigo-300" />
          <div className="text-sm">
            <div className="font-medium text-indigo-100">Generating your app</div>
            <div className="text-xs text-indigo-200/70">
              The free model can take 30–90 seconds. Hang tight.
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BuiltView({
  app,
  view,
  onViewChange,
  feedback,
  onFeedbackChange,
  refining,
  onRefine,
  isBusy,
}: {
  app: GeneratedApp;
  view: View;
  onViewChange: (v: View) => void;
  feedback: string;
  onFeedbackChange: (v: string) => void;
  refining: boolean;
  onRefine: () => void;
  isBusy: boolean;
}) {
  const fileCount = useMemo(() => app.files.length, [app]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="pt-6 grid lg:grid-cols-[1fr_320px] gap-6"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">{app.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{app.description}</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 p-1 bg-slate-900/60">
            <ViewToggle
              active={view === "preview"}
              onClick={() => onViewChange("preview")}
              icon={<Eye size={12} />}
              label="Preview"
            />
            <ViewToggle
              active={view === "code"}
              onClick={() => onViewChange("code")}
              icon={<Code2 size={12} />}
              label="Code"
            />
          </div>
        </div>

        {view === "preview" ? (
          <CodePreview app={app} layout="split" />
        ) : (
          <CodeEditor app={app} />
        )}

        <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
          <span>{fileCount} file{fileCount === 1 ? "" : "s"}</span>
          <span>·</span>
          <span>
            {app.dependencies.length === 0
              ? "no extra deps"
              : `${app.dependencies.length} dep${
                  app.dependencies.length === 1 ? "" : "s"
                }`}
          </span>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={14} className="text-fuchsia-300" />
            <h4 className="text-sm font-semibold">Refine the app</h4>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onRefine();
              }
            }}
            rows={5}
            placeholder="e.g. Add a search bar, switch to a light theme, and persist data in localStorage."
            disabled={isBusy}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500/60 resize-none disabled:opacity-60"
          />
          <button
            onClick={onRefine}
            disabled={!feedback.trim() || isBusy}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-400 hover:to-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition rounded-lg px-3 py-2 text-sm font-medium"
          >
            {refining ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Refining…
              </>
            ) : (
              <>
                <Sparkles size={14} /> Apply changes
              </>
            )}
          </button>
        </div>

        {app.preview && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              About this app
            </h4>
            <p className="text-sm text-slate-200">{app.preview}</p>
          </div>
        )}

        {app.dependencies.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2">
              Dependencies
            </h4>
            <ul className="space-y-1">
              {app.dependencies.map((d) => (
                <li
                  key={d}
                  className="text-xs text-slate-300 flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </motion.div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition " +
        (active
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:text-slate-200")
      }
    >
      {icon}
      {label}
    </button>
  );
}
