"use client";

import { CodePreview } from "./CodePreview";
import type { GeneratedApp } from "@/lib/app-builder/code-generator";

interface CodeEditorProps {
  app: GeneratedApp;
  className?: string;
}

/**
 * Read-only Sandpack editor that shows the generated source files
 * without the preview pane. Useful when the user wants to inspect
 * or copy code without the iframe overhead.
 *
 * It's a thin wrapper over `<CodePreview layout="code" />` so the
 * styling stays consistent across the App Builder surface.
 */
export function CodeEditor({ app, className = "" }: CodeEditorProps) {
  return <CodePreview app={app} layout="code" className={className} />;
}

export default CodeEditor;
