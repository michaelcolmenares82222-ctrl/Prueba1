/**
 * Recursively removes properties whose value is `null` or `undefined` from an
 * object. Arrays keep their indices but `null`/`undefined` items are dropped.
 *
 * Why: Groq's tool-call validation rejects `null` for parameters declared as
 * `type: "string" | "number" | ...`, but our Zod schemas only accept the value
 * being absent. Stripping nullish values bridges the gap so optional fields
 * behave the same whether the LLM omits them, sends `null`, or sends `""`.
 */
export function stripNullish<T = unknown>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== null && item !== undefined)
      .map((item) => stripNullish(item)) as unknown as T;
  }

  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === null || value === undefined) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      out[key] = stripNullish(value);
    }
    return out as unknown as T;
  }

  return input;
}
