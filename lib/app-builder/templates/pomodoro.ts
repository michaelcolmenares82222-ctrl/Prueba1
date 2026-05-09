import type { GeneratedApp } from "../code-generator";

const APP_TSX = `import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";

type Mode = "focus" | "short" | "long";

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

const COLORS: Record<Mode, string> = {
  focus: "from-rose-500 to-orange-500",
  short: "from-emerald-400 to-teal-500",
  long: "from-sky-400 to-indigo-500",
};

export default function App() {
  const [mode, setMode] = useState<Mode>("focus");
  const [seconds, setSeconds] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          if (mode === "focus") {
            setCompleted((c) => c + 1);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setSeconds(DURATIONS[next]);
    setRunning(false);
  };

  const reset = () => {
    setSeconds(DURATIONS[mode]);
    setRunning(false);
  };

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  const total = DURATIONS[mode];
  const progress = ((total - seconds) / total) * 100;

  const formatted =
    String(minutes).padStart(2, "0") + ":" + String(remaining).padStart(2, "0");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Pomodoro</h1>
          <p className="text-slate-400 text-sm mt-1">
            {completed} session{completed === 1 ? "" : "s"} completed today
          </p>
        </header>

        <div className="flex justify-center gap-2 mb-6">
          {(Object.keys(DURATIONS) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={
                "px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1 " +
                (mode === m
                  ? "bg-white text-slate-900 border-white"
                  : "border-slate-700 text-slate-300 hover:border-slate-500")
              }
            >
              {m === "focus" ? <Brain size={12} /> : <Coffee size={12} />}
              {LABELS[m]}
            </button>
          ))}
        </div>

        <div className="relative aspect-square max-w-xs mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgb(30 41 59)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={(2 * Math.PI * 45) * (1 - progress / 100)}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" className={
                  mode === "focus" ? "text-rose-500" : mode === "short" ? "text-emerald-400" : "text-sky-400"
                } />
                <stop offset="100%" stopColor="currentColor" className={
                  mode === "focus" ? "text-orange-500" : mode === "short" ? "text-teal-500" : "text-indigo-500"
                } />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={"text-6xl font-light tracking-tight bg-gradient-to-r " + COLORS[mode] + " bg-clip-text text-transparent"}>
              {formatted}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mt-2">
              {LABELS[mode]}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => setRunning((r) => !r)}
            className={
              "h-14 w-14 rounded-full bg-gradient-to-br " +
              COLORS[mode] +
              " flex items-center justify-center shadow-lg hover:scale-105 transition"
            }
          >
            {running ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="h-14 w-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
`;

export const pomodoroTemplate: GeneratedApp = {
  name: "Pomodoro Timer",
  description:
    "A focus timer with focus / short break / long break modes and a circular progress ring.",
  preview: "25-minute focus blocks with breaks and a session counter.",
  dependencies: ["lucide-react"],
  files: [
    {
      path: "/App.tsx",
      content: APP_TSX,
      language: "tsx",
    },
  ],
};
