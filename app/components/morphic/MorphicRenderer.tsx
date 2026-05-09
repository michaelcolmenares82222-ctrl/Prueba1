"use client";

/**
 * MorphicRenderer
 *
 * Renders the list of widgets described by a `UIContext` in a responsive,
 * animated grid. Each widget is lazy-loaded via the registry in
 * `lib/ui-component-registry.ts` and wrapped in a `<Suspense>` boundary with
 * a graceful skeleton fallback. Unknown widget names log a `console.warn`
 * and degrade to `GenericCard`.
 */

import { Suspense, type ComponentType } from "react";
import { motion } from "framer-motion";

import {
  WIDGET_REGISTRY,
  getWidget,
  type WidgetProps,
} from "@/lib/ui-component-registry";
import type { UIContext, UIDensity } from "@/lib/ui-context-detector";

interface MorphicRendererProps {
  context: UIContext;
  /**
   * Free-form payload forwarded to every widget. Each widget validates the
   * shape it needs internally; pass `undefined` while data is still loading
   * to render skeleton placeholders.
   */
  data?: unknown;
  /**
   * Optional class name applied to the outermost container. Useful for
   * embedding the grid inside a parent layout.
   */
  className?: string;
}

const GAP_BY_DENSITY: Record<UIDensity, string> = {
  compact: "gap-3",
  normal: "gap-5",
  spacious: "gap-8",
};

const PADDING_BY_DENSITY: Record<UIDensity, string> = {
  compact: "p-3",
  normal: "p-5",
  spacious: "p-8",
};

function WidgetSkeleton({ context }: { context: UIContext }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${context.colorScheme.gradient} ${PADDING_BY_DENSITY[context.density]} animate-pulse`}
      role="status"
      aria-label="Cargando widget"
    >
      <div className="h-4 w-1/3 rounded bg-white/30 mb-3" />
      <div className="h-3 w-2/3 rounded bg-white/20 mb-2" />
      <div className="h-3 w-1/2 rounded bg-white/20" />
    </div>
  );
}

function resolveWidget(name: string): ComponentType<WidgetProps> {
  const widget = getWidget(name);
  if (widget) return widget;
  if (typeof console !== "undefined") {
    console.warn(
      `[MorphicRenderer] Unknown widget "${name}" — falling back to GenericCard.`
    );
  }
  return WIDGET_REGISTRY.GenericCard;
}

export function MorphicRenderer({
  context,
  data,
  className,
}: MorphicRendererProps) {
  const gap = GAP_BY_DENSITY[context.density];

  if (context.components.length === 0) {
    return (
      <div
        className={`text-sm text-slate-500 italic ${className ?? ""}`}
        role="status"
      >
        Sin componentes para renderizar.
      </div>
    );
  }

  return (
    <motion.section
      className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${gap} ${className ?? ""}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      data-domain={context.domain}
      data-subtype={context.subtype}
      data-mood={context.mood}
      data-density={context.density}
    >
      {context.components.map((name, index) => {
        const Widget = resolveWidget(name);
        return (
          <motion.div
            key={`${name}-${index}`}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="min-w-0"
          >
            <Suspense fallback={<WidgetSkeleton context={context} />}>
              <Widget context={context} data={data} />
            </Suspense>
          </motion.div>
        );
      })}
    </motion.section>
  );
}

export default MorphicRenderer;
