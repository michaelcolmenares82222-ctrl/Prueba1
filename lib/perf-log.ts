/**
 * Lightweight server-side performance logging.
 *
 * Usage:
 *   const t0 = perfStart();
 *   // ...work...
 *   logStep("travel:llm", t0); // → "[perf] travel:llm: 4231ms"
 *
 * Or in one-shot mode:
 *   await withPerf("generate-ui:total", async () => { ... });
 *
 * These logs are intentionally cheap and stay permanently in the code.
 * Silence them in any environment by setting `PERF_LOG=0` in the env.
 */

function isPerfEnabled(): boolean {
  // Default ON; only "0" / "false" / "off" disable.
  const flag = process.env.PERF_LOG;
  if (flag == null) return true;
  const v = flag.trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off" && v !== "no";
}

export function perfStart(): number {
  return Date.now();
}

/**
 * Log elapsed time since `startMs` under the given label.
 * Optional `extra` is appended as `key=value` pairs for greppability.
 */
export function logStep(
  label: string,
  startMs: number,
  extra?: Record<string, string | number | boolean | undefined>
): void {
  if (!isPerfEnabled()) return;
  const elapsed = Date.now() - startMs;
  const parts = [`[perf] ${label}: ${elapsed}ms`];
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined) continue;
      parts.push(`${k}=${typeof v === "string" ? v : String(v)}`);
    }
  }
  console.log(parts.join(" "));
}

/** Wrap any async work and log its duration once it resolves (or throws). */
export async function withPerf<T>(
  label: string,
  fn: () => Promise<T>,
  extra?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const t0 = perfStart();
  try {
    const result = await fn();
    logStep(label, t0, extra);
    return result;
  } catch (err) {
    logStep(`${label}:error`, t0, extra);
    throw err;
  }
}
