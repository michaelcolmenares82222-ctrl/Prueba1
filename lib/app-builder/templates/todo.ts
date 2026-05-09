import type { GeneratedApp } from "../code-generator";

const APP_TSX = `import { useState, useMemo } from "react";
import { Plus, Trash2, Check, Flag } from "lucide-react";

type Priority = "low" | "medium" | "high";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Write the launch announcement", done: false, priority: "high" },
    { id: "2", text: "Refactor the API layer", done: false, priority: "medium" },
    { id: "3", text: "Read a chapter of a book", done: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const visible = useMemo(() => {
    return todos
      .filter((t) =>
        filter === "all" ? true : filter === "active" ? !t.done : t.done
      )
      .sort((a, b) => {
        const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      });
  }, [todos, filter]);

  const remaining = todos.filter((t) => !t.done).length;

  const addTodo = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text: trimmed, done: false, priority },
      ...prev,
    ]);
    setText("");
  };

  const toggle = (id: string) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const remove = (id: string) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-slate-400 mt-1">
            {remaining} remaining · {todos.length} total
          </p>
        </header>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 shadow-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="What needs to be done?"
              className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="bg-slate-950/60 border border-slate-700 rounded-lg px-2 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={addTodo}
              className="bg-indigo-600 hover:bg-indigo-500 transition rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div className="flex gap-2 mt-4 text-xs">
            {(["all", "active", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  "px-3 py-1 rounded-full border transition " +
                  (filter === f
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-slate-700 text-slate-400 hover:text-slate-200")
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {visible.length === 0 && (
            <li className="text-center text-slate-500 py-8">
              Nothing here yet — add a task above.
            </li>
          )}
          {visible.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-3 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 hover:border-slate-700 transition"
            >
              <button
                onClick={() => toggle(t.id)}
                className={
                  "h-5 w-5 rounded-md border flex items-center justify-center transition " +
                  (t.done
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-600 hover:border-slate-400")
                }
              >
                {t.done && <Check size={14} className="text-white" />}
              </button>
              <span
                className={
                  "flex-1 text-sm " +
                  (t.done ? "line-through text-slate-500" : "text-slate-100")
                }
              >
                {t.text}
              </span>
              <span
                className={
                  "text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 " +
                  PRIORITY_STYLES[t.priority]
                }
              >
                <Flag size={10} /> {t.priority}
              </span>
              <button
                onClick={() => remove(t.id)}
                className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
`;

export const todoTemplate: GeneratedApp = {
  name: "Priority Todo",
  description:
    "A focused task list with priority tags, filters, and keyboard-friendly entry.",
  preview: "Add tasks, tag them low/medium/high, and filter by status.",
  dependencies: ["lucide-react"],
  files: [
    {
      path: "/App.tsx",
      content: APP_TSX,
      language: "tsx",
    },
  ],
};
