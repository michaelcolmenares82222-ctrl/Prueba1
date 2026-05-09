import type { GeneratedApp } from "../code-generator";
import { todoTemplate } from "./todo";
import { calculatorTemplate } from "./calculator";
import { pomodoroTemplate } from "./pomodoro";

export { todoTemplate, calculatorTemplate, pomodoroTemplate };

export const ALL_TEMPLATES: GeneratedApp[] = [
  todoTemplate,
  calculatorTemplate,
  pomodoroTemplate,
];

/**
 * Pick a sensible fallback template by sniffing keywords in the user prompt.
 * Used when the LLM is unavailable or returns invalid JSON, so demos never
 * see a hard error.
 */
export function pickTemplateFromPrompt(prompt: string): GeneratedApp {
  const p = prompt.toLowerCase();

  if (
    /\b(pomodoro|tomato|timer|focus|cronómetro|cronometro)\b/.test(p)
  ) {
    return pomodoroTemplate;
  }
  if (/\b(calc|calculadora|calculator|math|matem)/.test(p)) {
    return calculatorTemplate;
  }
  // Default to the todo template — it's the most generic CRUD-like app.
  return todoTemplate;
}
