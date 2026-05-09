// ============================================
// Sandpack-friendly dependency resolver
// ------------------------------------------------------------
// The LLM is allowed to import from a curated set of libraries that
// we know work cleanly inside Sandpack's `react-ts` template (in-browser
// bundler, npm registry on demand). Anything outside this allowlist is
// stripped and reported back to the caller so it can either:
//   - retry the LLM with feedback about the unsupported imports, or
//   - fall back to a curated template.
//
// The resolver also exposes any CSS files that need to be injected as
// `externalResources` for Sandpack (e.g. Leaflet's `leaflet.css`, which
// is required to render map tiles).
// ============================================

export interface ResolvedDependencies {
  /** Packages safe to forward to Sandpack `customSetup.dependencies`. */
  allowed: string[];
  /** Packages the LLM tried to use that we refuse to ship to Sandpack. */
  dropped: string[];
  /** Extra CSS URLs to add to Sandpack's `externalResources`. */
  cssExternals: string[];
}

export interface FileLike {
  content: string;
}

// ------------------------------------------------------------
// Curated allowlist with pinned versions.
//
// Versions are picked to be (a) compatible with React 19 + the in-browser
// Sandpack bundler and (b) cheap to fetch (popular, well-cached on the
// public CDN). When in doubt prefer the latest stable major.
// ------------------------------------------------------------
export const SUPPORTED_DEPS: Record<string, string> = {
  // React core (also auto-provided by Sandpack, listed here so the
  // resolver doesn't drop them if the LLM forwards them).
  react: "19.0.0",
  "react-dom": "19.0.0",

  // UI / Icons / styling utilities
  "lucide-react": "^0.468.0",
  clsx: "^2.1.1",
  "tailwind-merge": "^2.5.5",
  "class-variance-authority": "^0.7.1",

  // Animation
  "framer-motion": "^11.15.0",

  // Forms / state
  zustand: "^5.0.2",
  "react-hook-form": "^7.54.2",
  "@tanstack/react-query": "^5.62.0",
  immer: "^10.1.1",

  // Data / utilities
  "date-fns": "^4.1.0",
  dayjs: "^1.11.13",
  nanoid: "^5.0.9",
  uuid: "^11.0.3",
  zod: "^3.24.1",

  // Maps
  leaflet: "^1.9.4",
  "react-leaflet": "^4.2.1",

  // Charts
  recharts: "^2.15.0",
  "chart.js": "^4.4.7",
  "react-chartjs-2": "^5.3.0",

  // Markdown
  "react-markdown": "^9.0.3",
  "remark-gfm": "^4.0.0",

  // Drag & drop
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^8.0.0",
};

/** Human-readable categories used to render the prompt. */
export const ALLOWED_DEPS_BY_CATEGORY: Array<{
  label: string;
  packages: string[];
}> = [
  {
    label: "UI / icons / styling",
    packages: [
      "react",
      "react-dom",
      "lucide-react",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ],
  },
  { label: "Animation", packages: ["framer-motion"] },
  {
    label: "Forms / state",
    packages: ["zustand", "react-hook-form", "@tanstack/react-query", "immer"],
  },
  {
    label: "Data / utilities",
    packages: ["date-fns", "dayjs", "nanoid", "uuid", "zod"],
  },
  { label: "Maps", packages: ["leaflet", "react-leaflet"] },
  { label: "Charts", packages: ["recharts", "chart.js", "react-chartjs-2"] },
  { label: "Markdown", packages: ["react-markdown", "remark-gfm"] },
  { label: "Drag & drop", packages: ["@dnd-kit/core", "@dnd-kit/sortable"] },
];

// React itself ships with Sandpack's template — never report it as an
// extra dep that the LLM mis-declared, but DO keep it through the
// allowlist so resolution stays stable.
const REACT_BUILTINS = new Set([
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom/client",
]);

// Packages that need an external CSS file injected via Sandpack's
// `externalResources` for the runtime to look right.
const CSS_EXTERNALS_FOR: Record<string, string[]> = {
  leaflet: ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"],
};

// Match any of:
//   import "x";
//   import x from "x";
//   import { a, b } from "x";
//   import * as x from "x";
//   import("x")
//   require("x")
// The lazy quantifier on `[\s\S]+?` lets us match multi-line import lists.
const IMPORT_PATTERNS: RegExp[] = [
  /import\s+(?:[\s\S]+?\s+from\s+)?["']([^"']+)["']/g,
  /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  /require\s*\(\s*["']([^"']+)["']\s*\)/g,
];

/**
 * Reduce a bare import specifier to its root npm package name.
 *
 *   "leaflet/dist/leaflet.css" → "leaflet"
 *   "@dnd-kit/core/utilities"  → "@dnd-kit/core"
 *   "react-dom/client"         → "react-dom"
 */
export function rootPackage(spec: string): string {
  if (!spec) return spec;
  if (spec.startsWith("@")) {
    const parts = spec.split("/");
    return parts.slice(0, 2).join("/");
  }
  return spec.split("/")[0];
}

/**
 * Walk the source code and collect every npm package name that is
 * imported (or `require`d). Local imports (./foo, /abs) are ignored.
 */
export function extractImportedPackages(source: string): string[] {
  const found = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      const spec = match[1];
      if (!spec) continue;
      if (spec.startsWith(".") || spec.startsWith("/")) continue;
      found.add(rootPackage(spec));
    }
  }
  return Array.from(found);
}

// Sandpack's `react-ts` preview runs like a dev environment: React Strict
// Mode double-invokes effects and HMR can remount components. Leaflet's
// DOM map is one-instance-per-container; generated apps using
// `react-leaflet`'s `MapContainer` MUST gate the first client mount (see
// `code-generator.ts` system prompt: `mapReady` + single `MapContainer`
// with a stable `key`) or users see "Map container is already initialized".

/**
 * Resolve the dependency set for a generated app:
 *
 *   - parse imports out of every file
 *   - merge with whatever the LLM declared
 *   - keep only packages on the curated allowlist
 *   - log dropped packages for diagnostics
 *   - surface any CSS that needs injecting via `externalResources`
 */
export function resolveDependencies(
  files: FileLike[],
  declared: string[] = []
): ResolvedDependencies {
  const candidates = new Set<string>();

  for (const f of files) {
    if (!f || typeof f.content !== "string") continue;
    for (const pkg of extractImportedPackages(f.content)) {
      candidates.add(pkg);
    }
  }
  for (const d of declared) {
    if (typeof d !== "string") continue;
    const norm = d.trim();
    if (!norm) continue;
    candidates.add(rootPackage(norm));
  }

  const allowed = new Set<string>();
  const dropped = new Set<string>();

  for (const pkg of candidates) {
    if (REACT_BUILTINS.has(pkg) || pkg === "react" || pkg === "react-dom") {
      // React/react-dom are auto-provided by Sandpack's `react-ts`
      // template; we never need to ship them as deps.
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(SUPPORTED_DEPS, pkg)) {
      allowed.add(pkg);
    } else {
      dropped.add(pkg);
      console.warn(`[app-builder] dropped dep: ${pkg}`);
    }
  }

  const cssExternals = new Set<string>();
  for (const pkg of allowed) {
    const urls = CSS_EXTERNALS_FOR[pkg];
    if (!urls) continue;
    for (const u of urls) cssExternals.add(u);
  }

  return {
    allowed: Array.from(allowed).sort(),
    dropped: Array.from(dropped).sort(),
    cssExternals: Array.from(cssExternals),
  };
}

/**
 * Map of `{ pkg: version }` for the provided allowlisted packages.
 * Unknown packages are silently skipped (the resolver should never
 * surface them in the first place).
 */
export function dependencyVersionMap(
  allowed: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const dep of allowed) {
    const version = SUPPORTED_DEPS[dep];
    if (version) result[dep] = version;
  }
  return result;
}

/** Flat list of the supported package names — handy for prompts/UIs. */
export function listSupportedPackages(): string[] {
  return Object.keys(SUPPORTED_DEPS).sort();
}

/** react-icons / other libraries use these prefixes; they are not Lucide exports. */
const INVALID_LUCIDE_SPECIFIER_RE =
  /\b(Ai|Fi|Md|Io|Fa|Bs|Hi)([A-Z][a-zA-Z0-9]*)\b/g;

const LUCIDE_NAMED_IMPORT_RE =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']lucide-react["']/g;

/**
 * Regex-finds named imports from `lucide-react` where any specifier matches
 * forbidden react-icons-style prefixes (Ai*, Fi*, Md*, …).
 */
export function scanInvalidLucideImports(source: string): string[] {
  const invalid = new Set<string>();
  LUCIDE_NAMED_IMPORT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = LUCIDE_NAMED_IMPORT_RE.exec(source)) !== null) {
    const block = m[1];
    INVALID_LUCIDE_SPECIFIER_RE.lastIndex = 0;
    let sm: RegExpExecArray | null;
    while ((sm = INVALID_LUCIDE_SPECIFIER_RE.exec(block)) !== null) {
      invalid.add(sm[0]);
    }
  }
  return Array.from(invalid).sort();
}
