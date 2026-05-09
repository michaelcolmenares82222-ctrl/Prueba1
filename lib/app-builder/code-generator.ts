import { z } from "zod";
import { groqJsonCompletion } from "@/lib/groq";
import { ALL_TEMPLATES, pickTemplateFromPrompt } from "./templates";
import {
  ALLOWED_DEPS_BY_CATEGORY,
  listSupportedPackages,
  resolveDependencies,
  scanInvalidLucideImports,
  type ResolvedDependencies,
} from "./dependency-resolver";

// ============================================
// Types
// ============================================

export interface GeneratedAppFile {
  path: string;
  content: string;
  language: string;
}

export interface GeneratedApp {
  name: string;
  description: string;
  files: GeneratedAppFile[];
  dependencies: string[];
  preview: string;
}

// ============================================
// Zod schema for LLM output validation
// ============================================

export const GeneratedAppFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .transform((p) => (p.startsWith("/") ? p : "/" + p)),
  content: z.string().min(1),
  language: z.string().min(1),
});

export const GeneratedAppSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1),
  files: z.array(GeneratedAppFileSchema).min(1),
  dependencies: z.array(z.string()).default([]),
  preview: z.string().default(""),
});

// ============================================
// System prompts
// ------------------------------------------------------------
// The allowlist lives in `dependency-resolver.ts`. We project it here
// into the system prompt so the LLM sees the exact same set of libraries
// the runtime will accept.
// ============================================

function renderAllowedDepsBlock(): string {
  return ALLOWED_DEPS_BY_CATEGORY.map(
    (cat) => `- ${cat.label}: ${cat.packages.join(", ")}`
  ).join("\n");
}

const ALLOWED_DEPS_BLOCK = renderAllowedDepsBlock();

/** Hard rules for icons — mirrored in refine prompt; lucide retry enforces at runtime. */
const LUCIDE_ICONS_RULE = `
LUCIDE-REACT ICONS (MANDATORY when you import lucide-react)
- Lucide icon components are PascalCase with NO library prefix: MapPin, Trash2, Delete, ChevronLeft, Equal, Plus, Minus, X, Divide.
- NEVER use react-icons-style names in a lucide-react import: no Ai*, Fi*, Md*, Io*, Fa*, Bs*, Hi* prefixes — those packages are NOT installed and those names are undefined on lucide-react.
- Example: a backspace/delete control must use Delete (or Trash2) from lucide-react, NOT AiOutlineBackspace.
- Pick only names that exist on Lucide; when unsure, prefer common primitives (Circle, Square, ArrowLeft, Home, Settings).`;

/** Shown in create + refine prompts; enforced by a follow-up LLM retry when missing. */
const REACT_LEAFLET_MANDATORY_BLOCK = `
REACT-LEAFLET / MapContainer (MANDATORY whenever you import react-leaflet or use MapContainer)
The Sandpack preview uses React Strict Mode and HMR-style remounts; Leaflet allows only ONE map per DOM container. You MUST follow this pattern exactly (no shortcuts):

1. State + effect gate (client-only first paint):
   const [mapReady, setMapReady] = useState(false);
   useEffect(() => {
     setMapReady(true);
     return () => setMapReady(false);
   }, []);

2. Early return placeholder until the gate opens (use this exact guard or equivalent styling):
   if (!mapReady) {
     return <div className="min-h-[400px] w-full animate-pulse rounded-lg bg-slate-800" />;
   }

3. After the guard, render EXACTLY ONE <MapContainer> (never two nested MapContainers). Do NOT call L.map(...) or leaflet's map constructor manually alongside MapContainer.
   Give it style={{ height: '100%', width: '100%', minHeight: 360 }}.
   Force a single clean lifecycle: use key="leaflet-map-once" OR key={String(mapReady)} on MapContainer.

4. Icons: use ONLY lucide-react (e.g. MapPin). NEVER react-icons / FiMapPin / FaMapMarker.

5. Still import leaflet/dist/leaflet.css where the map lives.`;

const SYSTEM_PROMPT = `You are an expert full-stack engineer who specializes in producing production-quality React + TypeScript + Tailwind CSS single-page apps.

The user describes an idea in natural language and you respond with a complete, runnable app that will be embedded in a CodeSandbox sandbox using the "react-ts" template (in-browser bundler, fetches deps from npm on demand).

OUTPUT FORMAT (strict, machine-parsed)
Reply with a SINGLE JSON object — no markdown, no commentary, no code fences. Schema:
{
  "name": string (short, human-friendly title, max ~60 chars),
  "description": string (1-2 sentences explaining what the app does),
  "files": [
    { "path": "/App.tsx", "content": "<full TSX source>", "language": "tsx" }
  ],
  "dependencies": string[]  // EVERY non-React npm package your code imports
  "preview": string         // one-sentence summary for a tooltip
}

HARD RULES
1. The PRIMARY entry file MUST be "/App.tsx" and MUST default-export a React component named App.
2. Every "path" MUST start with "/". Examples: "/App.tsx", "/components/Map.tsx", "/lib/utils.ts".
3. Keep the app to AT MOST 3 files. Inline small helpers — do not over-split.
4. Each file's "content" must be valid TS/TSX (or whatever its extension implies), with literal newlines escaped as \\n inside the JSON string. Do not truncate.
5. NEVER reference imports of files that are not present in "files". Local imports must use relative paths matching a listed file.
6. Style with Tailwind utility classes only. Do NOT import any local CSS file. (You MAY import a CSS file that ships with an allowed library, e.g. "leaflet/dist/leaflet.css".)
7. Output beautiful, modern UI with thoughtful spacing, transitions, and responsive layout.
8. The component must be self-contained and work with no props. Use useState / useEffect / useMemo / useRef as needed. React 19 only.
${LUCIDE_ICONS_RULE}

ALLOWED DEPENDENCIES (anything else WILL be stripped at runtime — your import will fail)
${ALLOWED_DEPS_BLOCK}

USAGE GUIDANCE
- Simple apps (timer, todo, calculator, tip splitter, color picker, …): import ONLY from react and (optionally) lucide-react. Do NOT pull in zustand, framer-motion, etc. unless they meaningfully help.
- Maps: use react-leaflet + leaflet. ALWAYS import "leaflet/dist/leaflet.css" at the top of the file that uses the map. The Sandpack runtime injects Leaflet's stylesheet, but importing it keeps types/intellisense happy.
${REACT_LEAFLET_MANDATORY_BLOCK}
- Charts: prefer recharts (declarative, smaller). Only use chart.js + react-chartjs-2 if the user explicitly asks for chart.js.
- Markdown: react-markdown (+ remark-gfm if GitHub-flavored).
- Drag & drop: @dnd-kit/core (+ @dnd-kit/sortable for lists).
- "dependencies" in the JSON output MUST list every non-React npm package that any file imports — and ONLY packages in the allowlist above.

DATA POLICY (very important)
- DO NOT invent real-world facts: company addresses, real geographic coordinates, real prices, etc.
- If the app needs sample data (e.g. "Apple Stores in the US"), generate clearly-marked DEMO data: names like "Apple Store Demo 1, NYC" with plausible coordinates around well-known cities. Add a small note in the UI ("demo data — not real locations") so the user knows.
- If a real public, key-less API fits the domain (e.g. Nominatim for geocoding, Open-Meteo for weather), you may call it via "fetch" inside useEffect. Otherwise stick to local demo data.

Failure modes you MUST avoid:
- Importing a package not on the allowlist (it will be stripped and the app will throw "Could not find dependency").
- Forgetting to list an imported package in "dependencies".
- Returning anything other than a single JSON object (no \`\`\`json fences, no preface, no trailing commentary).`;

const REFINE_SYSTEM_PROMPT = `You are an expert React + TypeScript + Tailwind engineer iterating on an existing app.

You will receive the current app (as JSON) plus user feedback. Produce an updated app that incorporates the feedback while preserving features the user did not ask to change.

Reply with a single JSON object matching the same schema as before:
{
  "name": string,
  "description": string,
  "files": [{ "path": "/App.tsx", "content": "<full TSX source>", "language": "tsx" }, ...],
  "dependencies": string[],
  "preview": string
}

Same hard rules apply:
- Single JSON object, no markdown, no commentary.
- "/App.tsx" entry with default-exported App, every path prefixed with "/", at most 3 files.
- Tailwind for styling. You may import CSS that ships with an allowed library (e.g. "leaflet/dist/leaflet.css").
- ONLY import packages from this allowlist (anything else WILL be stripped):
${ALLOWED_DEPS_BLOCK}
- "dependencies" must list every non-React npm package any file imports, and ONLY packages from the allowlist.
- Same data policy: never invent real addresses or coordinates; use clearly-marked demo data or a public key-less API.
${LUCIDE_ICONS_RULE}
${REACT_LEAFLET_MANDATORY_BLOCK}`;

// ============================================
// Retry guidance — appended to the user message
// when the first response uses unsupported deps.
// ============================================
function buildRetryHint(dropped: string[]): string {
  const allowed = listSupportedPackages().join(", ");
  return [
    "",
    "=== Retry feedback ===",
    `Your previous response imported packages that the runtime cannot install: ${dropped.join(", ")}.`,
    "These imports were dropped and the app failed to render.",
    `Regenerate the app using ONLY packages from this allowlist: ${allowed}.`,
    "If the user's idea cannot be fully implemented with these libraries, build the closest sensible variant using clearly-marked DEMO data and only allowlisted imports.",
    "Return the same strict JSON schema as before (no markdown, no commentary).",
  ].join("\n");
}

function buildLucideImportRetryHint(invalidNames: string[]): string {
  const detail =
    invalidNames.length > 0
      ? `Invalid specifiers detected (react-icons-style, not Lucide): ${invalidNames.join(", ")}.`
      : "Some lucide-react imports use invalid names (e.g. Ai*, Fi*, Md* prefixes).";
  return [
    "",
    "=== Retry feedback (lucide-react icons) ===",
    detail,
    "Replace every invalid name with a real Lucide export: PascalCase, no Ai/Fi/Md/Io/Fa/Bs/Hi prefix (e.g. MapPin, Trash2, ChevronLeft).",
    "For backspace/delete use `Delete` from lucide-react, NOT AiOutlineBackspace.",
    "Valid icon names: https://lucide.dev/icons",
    "Return the same strict JSON schema as before (no markdown, no commentary).",
  ].join("\n");
}

function buildLeafletGateRetryHint(): string {
  return [
    "",
    "=== Retry feedback (react-leaflet / Sandpack) ===",
    "Your app imports react-leaflet but omitted the REQUIRED Strict-Mode-safe mount gate.",
    "Regenerate ALL map-related files so they include BOTH strings `mapReady` and `setMapReady`, plus:",
    "`const [mapReady, setMapReady] = useState(false);`",
    "`useEffect(() => { setMapReady(true); return () => setMapReady(false); }, []);`",
    "Before MapContainer: `if (!mapReady) return <div className=\"min-h-[400px] w-full animate-pulse rounded-lg bg-slate-800\" />;`",
    "Exactly ONE MapContainer with style={{ height: '100%', width: '100%', minHeight: 360 }} and key=\"leaflet-map-once\" (or key={String(mapReady)}).",
    "Never nest two MapContainers or use L.map() with MapContainer. Icons: lucide-react only — never react-icons.",
    "Return the same strict JSON schema as before (no markdown, no commentary).",
  ].join("\n");
}

function combinedFileContents(files: GeneratedAppFile[]): string {
  return files.map((f) => f.content).join("\n");
}

/**
 * True when concatenated sources import lucide-react using react-icons-style
 * prefixes (Ai*, Fi*, …) — those exports are undefined and crash React.
 */
export function needsLucideImportRetry(content: string): boolean {
  if (!content.includes("lucide-react")) return false;
  return scanInvalidLucideImports(content).length > 0;
}

/** True when deps include react-leaflet but generated code misses the gate tokens. */
function needsLeafletMountGateRetry(
  files: GeneratedAppFile[],
  resolved: ResolvedDependencies
): boolean {
  if (!resolved.allowed.includes("react-leaflet")) return false;
  const src = combinedFileContents(files);
  if (!src.includes("mapReady") || !src.includes("setMapReady")) return true;
  if (!/if\s*\(\s*!mapReady\s*\)/.test(src)) return true;
  return false;
}

// ============================================
// Public API
// ============================================

export interface GenerateOptions {
  /**
   * Optional override for the system prompt. Mostly for tests.
   */
  systemPrompt?: string;
}

/**
 * Generate a brand-new app from a free-form user prompt.
 *
 * Falls back to a curated template (todo / calculator / pomodoro) if the
 * LLM is unavailable or returns invalid output, so demos never error out.
 *
 * If the first response references packages outside the allowlist, we
 * retry ONCE with explicit feedback about which imports were dropped.
 * If lucide-react imports use invalid react-icons-style names, we retry ONCE.
 * If react-leaflet is used without the Strict-Mode `mapReady` gate, we
 * retry ONCE more with Leaflet-specific feedback.
 * If the retry still fails, we fall back to the closest curated template.
 */
export async function generateApp(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GeneratedApp> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return pickTemplateFromPrompt(prompt);
  }

  const systemPrompt = options.systemPrompt ?? SYSTEM_PROMPT;
  const baseUser = `User idea:\n${trimmed}\n\nReturn the JSON described in the system prompt.`;

  try {
    let app = await runOnce(baseUser, systemPrompt, prompt);
    let resolved = resolveDependencies(app.files, app.dependencies);

    if (resolved.dropped.length > 0) {
      console.warn(
        `[code-generator] retry triggered, dropped: ${resolved.dropped.join(", ")}`
      );
      const retryUser = `${baseUser}\n${buildRetryHint(resolved.dropped)}`;
      try {
        const retried = await runOnce(retryUser, systemPrompt, prompt);
        const retriedResolved = resolveDependencies(
          retried.files,
          retried.dependencies
        );
        if (retriedResolved.dropped.length === 0) {
          app = retried;
          resolved = retriedResolved;
        } else {
          console.warn(
            `[code-generator] retry still dropped: ${retriedResolved.dropped.join(", ")}; falling back to template`
          );
          return pickTemplateFromPrompt(prompt);
        }
      } catch (retryError) {
        console.warn("[code-generator] retry failed:", retryError);
        return pickTemplateFromPrompt(prompt);
      }
    }

    const concatenated = combinedFileContents(app.files);
    if (needsLucideImportRetry(concatenated)) {
      const bad = scanInvalidLucideImports(concatenated);
      console.warn(
        `[code-generator] lucide-react icon retry triggered: ${bad.join(", ")}`
      );
      const lucideUser = `${baseUser}\n${buildLucideImportRetryHint(bad)}`;
      try {
        const fixed = await runOnce(lucideUser, systemPrompt, prompt);
        const fixedResolved = resolveDependencies(
          fixed.files,
          fixed.dependencies
        );
        if (fixedResolved.dropped.length === 0) {
          app = fixed;
          resolved = fixedResolved;
        } else {
          console.warn(
            `[code-generator] lucide icon retry still dropped: ${fixedResolved.dropped.join(", ")}`
          );
        }
      } catch (lucideError) {
        console.warn("[code-generator] lucide icon retry failed:", lucideError);
      }
    }

    if (needsLeafletMountGateRetry(app.files, resolved)) {
      console.warn("[code-generator] leaflet mount gate retry triggered");
      const gateUser = `${baseUser}\n${buildLeafletGateRetryHint()}`;
      try {
        const gated = await runOnce(gateUser, systemPrompt, prompt);
        const gatedResolved = resolveDependencies(
          gated.files,
          gated.dependencies
        );
        if (gatedResolved.dropped.length === 0) {
          app = gated;
          resolved = gatedResolved;
        } else {
          console.warn(
            `[code-generator] leaflet gate retry still dropped deps: ${gatedResolved.dropped.join(", ")}`
          );
        }
      } catch (gateError) {
        console.warn("[code-generator] leaflet gate retry failed:", gateError);
      }
    }

    return finalizeWithResolved(app, resolved);
  } catch (error) {
    console.warn("[code-generator] generateApp failed, falling back:", error);
    return pickTemplateFromPrompt(prompt);
  }
}

/**
 * Refine an existing generated app based on user feedback. Falls back to
 * returning the unchanged `currentApp` if refinement fails. Same retry
 * policy on dropped deps as `generateApp`, plus one lucide-react invalid-icon
 * retry, plus one Leaflet mount-gate retry when `react-leaflet` is used
 * without the gate pattern.
 */
export async function refineApp(
  currentApp: GeneratedApp,
  feedback: string
): Promise<GeneratedApp> {
  const trimmed = feedback.trim();
  if (!trimmed) return currentApp;

  const baseUser = [
    "=== Current app (JSON) ===",
    JSON.stringify(currentApp, null, 2),
    "",
    "=== User feedback ===",
    trimmed,
    "",
    "Apply the feedback and return the full updated JSON.",
  ].join("\n");

  try {
    let app = await runOnce(baseUser, REFINE_SYSTEM_PROMPT, feedback, currentApp);
    let resolved = resolveDependencies(app.files, app.dependencies);

    if (resolved.dropped.length > 0) {
      console.warn(
        `[code-generator] refine retry triggered, dropped: ${resolved.dropped.join(", ")}`
      );
      const retryUser = `${baseUser}\n${buildRetryHint(resolved.dropped)}`;
      try {
        const retried = await runOnce(
          retryUser,
          REFINE_SYSTEM_PROMPT,
          feedback,
          currentApp
        );
        const retriedResolved = resolveDependencies(
          retried.files,
          retried.dependencies
        );
        if (retriedResolved.dropped.length === 0) {
          app = retried;
          resolved = retriedResolved;
        } else {
          console.warn(
            `[code-generator] refine retry still dropped: ${retriedResolved.dropped.join(", ")}; returning previous app`
          );
          return currentApp;
        }
      } catch (retryError) {
        console.warn("[code-generator] refine retry failed:", retryError);
        return currentApp;
      }
    }

    const refineConcat = combinedFileContents(app.files);
    if (needsLucideImportRetry(refineConcat)) {
      const bad = scanInvalidLucideImports(refineConcat);
      console.warn(
        `[code-generator] refine: lucide-react icon retry triggered: ${bad.join(", ")}`
      );
      const lucideUser = `${baseUser}\n${buildLucideImportRetryHint(bad)}`;
      try {
        const fixed = await runOnce(
          lucideUser,
          REFINE_SYSTEM_PROMPT,
          feedback,
          currentApp
        );
        const fixedResolved = resolveDependencies(
          fixed.files,
          fixed.dependencies
        );
        if (fixedResolved.dropped.length === 0) {
          app = fixed;
          resolved = fixedResolved;
        } else {
          console.warn(
            `[code-generator] refine lucide icon retry still dropped: ${fixedResolved.dropped.join(", ")}`
          );
        }
      } catch (lucideError) {
        console.warn(
          "[code-generator] refine lucide icon retry failed:",
          lucideError
        );
      }
    }

    if (needsLeafletMountGateRetry(app.files, resolved)) {
      console.warn("[code-generator] refine: leaflet mount gate retry triggered");
      const gateUser = `${baseUser}\n${buildLeafletGateRetryHint()}`;
      try {
        const gated = await runOnce(
          gateUser,
          REFINE_SYSTEM_PROMPT,
          feedback,
          currentApp
        );
        const gatedResolved = resolveDependencies(
          gated.files,
          gated.dependencies
        );
        if (gatedResolved.dropped.length === 0) {
          app = gated;
          resolved = gatedResolved;
        } else {
          console.warn(
            `[code-generator] refine leaflet gate retry still dropped deps: ${gatedResolved.dropped.join(", ")}`
          );
        }
      } catch (gateError) {
        console.warn("[code-generator] refine leaflet gate retry failed:", gateError);
      }
    }

    return finalizeWithResolved(app, resolved);
  } catch (error) {
    console.warn("[code-generator] refineApp failed, returning current:", error);
    return currentApp;
  }
}

async function runOnce(
  userMessage: string,
  systemPrompt: string,
  userPrompt: string,
  fallback?: GeneratedApp
): Promise<GeneratedApp> {
  const raw = await groqJsonCompletion<unknown>(userMessage, {
    systemPrompt,
    temperature: 0.7,
    maxTokens: 3000,
    responseFormat: { type: "json_object" },
  });
  return validateOrRepair(raw, userPrompt, fallback);
}

function finalizeWithResolved(
  app: GeneratedApp,
  resolved: ResolvedDependencies
): GeneratedApp {
  return {
    ...app,
    dependencies: resolved.allowed,
  };
}

// ============================================
// Validation + repair
// ============================================

function validateOrRepair(
  raw: unknown,
  userPrompt: string,
  fallback?: GeneratedApp
): GeneratedApp {
  // Fast path: full validation succeeds.
  const direct = GeneratedAppSchema.safeParse(raw);
  if (direct.success) {
    return normalize(direct.data);
  }

  // Repair attempt: maybe the LLM wrapped output under a key like { app: ... }.
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const inner =
      (obj.app as unknown) ??
      (obj.application as unknown) ??
      (obj.result as unknown);
    if (inner) {
      const wrapped = GeneratedAppSchema.safeParse(inner);
      if (wrapped.success) return normalize(wrapped.data);
    }

    // Repair attempt: maybe `files` is an object map { "/App.tsx": "..." }.
    if (
      typeof obj.files === "object" &&
      obj.files !== null &&
      !Array.isArray(obj.files)
    ) {
      const filesMap = obj.files as Record<string, unknown>;
      const filesArray = Object.entries(filesMap)
        .map(([path, content]) =>
          typeof content === "string"
            ? { path, content, language: guessLanguage(path) }
            : null
        )
        .filter((f): f is GeneratedAppFile => f !== null);
      const candidate = { ...obj, files: filesArray };
      const repaired = GeneratedAppSchema.safeParse(candidate);
      if (repaired.success) return normalize(repaired.data);
    }

    // Repair attempt: keep only the first file that looks valid.
    if (Array.isArray(obj.files)) {
      const firstValid = obj.files.find((f: unknown) => {
        const parsed = GeneratedAppFileSchema.safeParse(f);
        return parsed.success;
      });
      if (firstValid) {
        const repaired = GeneratedAppSchema.safeParse({
          name:
            typeof obj.name === "string" && obj.name ? obj.name : "Generated App",
          description:
            typeof obj.description === "string" && obj.description
              ? obj.description
              : "A generated React app.",
          files: [firstValid],
          dependencies: Array.isArray(obj.dependencies) ? obj.dependencies : [],
          preview:
            typeof obj.preview === "string" ? obj.preview : "",
        });
        if (repaired.success) return normalize(repaired.data);
      }
    }
  }

  console.warn(
    "[code-generator] LLM output failed schema validation, falling back to template",
    direct.error.issues.slice(0, 3)
  );
  return fallback ?? pickTemplateFromPrompt(userPrompt);
}

function normalize(app: z.infer<typeof GeneratedAppSchema>): GeneratedApp {
  const files = app.files.map((f) => ({
    path: f.path.startsWith("/") ? f.path : "/" + f.path,
    content: f.content,
    language: f.language || guessLanguage(f.path),
  }));

  // Ensure /App.tsx exists; if not, alias the first file to it so the
  // Sandpack mount point always resolves.
  if (!files.some((f) => f.path === "/App.tsx") && files.length > 0) {
    files[0] = { ...files[0], path: "/App.tsx" };
  }

  // Pass dependencies through verbatim — they get resolved + filtered by
  // `resolveDependencies` in `generateApp` / `refineApp` (and again in
  // `CodePreview` as a defence-in-depth measure).
  const declared = Array.isArray(app.dependencies)
    ? app.dependencies.filter((d): d is string => typeof d === "string")
    : [];

  return {
    name: app.name,
    description: app.description,
    files,
    dependencies: declared,
    preview: app.preview ?? "",
  };
}

function guessLanguage(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx")) return "tsx";
  if (lower.endsWith(".ts")) return "ts";
  if (lower.endsWith(".jsx")) return "jsx";
  if (lower.endsWith(".js")) return "js";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".html")) return "html";
  return "tsx";
}

// ============================================
// Re-exports for convenience
// ============================================

export { ALL_TEMPLATES, pickTemplateFromPrompt };
export { resolveDependencies } from "./dependency-resolver";
