/**
 * Morphic UI component registry.
 *
 * Maps stable widget names (as returned by `detectUIContext().components`)
 * to lazy-loaded React components. `MorphicRenderer` uses `getWidget(name)`
 * to resolve a name to a component and falls back to `GenericCard` when the
 * name is not registered.
 *
 * Keep this file dependency-light: it should only contain the registry and
 * its lookup helper. Anything more elaborate belongs in `MorphicRenderer`.
 */

import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import type { UIContext } from "./ui-context-detector";

/**
 * Shared props every morphic widget receives.
 *
 * `data` is intentionally `unknown` so that the renderer does not need to
 * know about each widget's payload shape: each widget narrows it internally
 * (Zod schema or hand-written type guard).
 */
export interface WidgetProps {
  context: UIContext;
  data: unknown;
}

type WidgetComponent = ComponentType<WidgetProps>;
type LazyWidget = LazyExoticComponent<WidgetComponent>;

/**
 * The registry. Names match the file names under
 * `app/components/morphic/widgets/`.
 */
export const WIDGET_REGISTRY: Record<string, LazyWidget> = {
  RouteMap: lazy(() => import("@/app/components/morphic/widgets/RouteMap")),
  Timeline: lazy(() => import("@/app/components/morphic/widgets/Timeline")),
  CalorieTracker: lazy(
    () => import("@/app/components/morphic/widgets/CalorieTracker")
  ),
  StrengthChart: lazy(
    () => import("@/app/components/morphic/widgets/StrengthChart")
  ),
  ComponentTree: lazy(
    () => import("@/app/components/morphic/widgets/ComponentTree")
  ),
  RestaurantMap: lazy(
    () => import("@/app/components/morphic/widgets/RestaurantMap")
  ),
  WeatherCards: lazy(
    () => import("@/app/components/morphic/widgets/WeatherCards")
  ),
  GenericCard: lazy(
    () => import("@/app/components/morphic/widgets/GenericCard")
  ),
};

/**
 * Returns the lazy widget registered under `name`, or `undefined` if no
 * widget is registered. Callers should fall back to `WIDGET_REGISTRY.GenericCard`.
 */
export function getWidget(name: string): LazyWidget | undefined {
  return WIDGET_REGISTRY[name];
}
