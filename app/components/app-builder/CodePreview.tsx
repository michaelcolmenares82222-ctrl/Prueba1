"use client";

import { useMemo } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import type { GeneratedApp } from "@/lib/app-builder/code-generator";
import {
  dependencyVersionMap,
  resolveDependencies,
  SUPPORTED_DEPS,
} from "@/lib/app-builder/dependency-resolver";

interface CodePreviewProps {
  app: GeneratedApp;
  /**
   * Compact "code only" mode used by `<CodeEditor />`. Hides the preview pane.
   * Defaults to a split editor + preview view.
   */
  layout?: "split" | "preview" | "code";
  /**
   * Optional class for the wrapper.
   */
  className?: string;
}

// Tailwind isn't part of Sandpack's `react-ts` template, so we inject the
// Play CDN as a baseline external resource. The dependency resolver may
// add more (e.g. Leaflet's CSS) on top of this.
const TAILWIND_CDN = "https://cdn.tailwindcss.com";

/**
 * Convert a `GeneratedApp` into the Sandpack `files` object shape.
 *
 * Ensures `/App.tsx` exists as the entry point and aliases the first file
 * if the LLM emitted a different path.
 */
function buildSandpackFiles(app: GeneratedApp): Record<string, string> {
  const files: Record<string, string> = {};

  for (const file of app.files) {
    const normalizedPath = file.path.startsWith("/")
      ? file.path
      : "/" + file.path;
    files[normalizedPath] = file.content;
  }

  if (!files["/App.tsx"]) {
    const firstKey = Object.keys(files)[0];
    if (firstKey) {
      files["/App.tsx"] = files[firstKey];
    }
  }

  return files;
}

interface ResolvedSetup {
  dependencies: Record<string, string>;
  externalResources: string[];
}

function buildSandpackSetup(app: GeneratedApp): ResolvedSetup {
  const resolved = resolveDependencies(app.files, app.dependencies);

  const dependencies: Record<string, string> = {
    react: SUPPORTED_DEPS.react,
    "react-dom": SUPPORTED_DEPS["react-dom"],
    ...dependencyVersionMap(resolved.allowed),
  };

  // Leaflet specifically needs its CSS or tiles render blank — the
  // resolver surfaces the URL via `cssExternals`.
  const externalResources = [TAILWIND_CDN, ...resolved.cssExternals];

  return { dependencies, externalResources };
}

export function CodePreview({
  app,
  layout = "split",
  className = "",
}: CodePreviewProps) {
  const files = useMemo(() => buildSandpackFiles(app), [app]);
  const { dependencies, externalResources } = useMemo(
    () => buildSandpackSetup(app),
    [app]
  );

  const showPreview = layout !== "code";
  const showEditor = layout !== "preview";

  return (
    <div
      className={
        "rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-2xl " +
        className
      }
    >
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="ml-3 text-xs text-slate-400 font-medium truncate">
          {app.name}
        </div>
        {app.dependencies.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500">
            {app.dependencies.slice(0, 3).map((d) => (
              <span
                key={d}
                className="rounded-full border border-slate-700 px-2 py-0.5 bg-slate-900/60"
              >
                {d}
              </span>
            ))}
          </div>
        )}
      </header>

      <Sandpack
        template="react-ts"
        theme="dark"
        files={files}
        customSetup={{ dependencies }}
        options={{
          showTabs: showEditor,
          showLineNumbers: true,
          showInlineErrors: true,
          showRefreshButton: true,
          showNavigator: false,
          editorHeight: 520,
          editorWidthPercentage: showEditor && showPreview ? 50 : showEditor ? 100 : 0,
          wrapContent: true,
          resizablePanels: true,
          // Tailwind via Play CDN + any per-dep CSS (e.g. Leaflet).
          externalResources,
          layout: showPreview ? "preview" : "console",
          autorun: true,
          autoReload: true,
          recompileMode: "delayed",
          recompileDelay: 400,
        }}
      />
    </div>
  );
}

export default CodePreview;
