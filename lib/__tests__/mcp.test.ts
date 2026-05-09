/**
 * Standalone smoke tests for every MCP tool.
 *
 * Run with:
 *   npx tsx --env-file=.env.local lib/__tests__/mcp.test.ts
 *
 * No external test runner — intentionally — so the suite works in any
 * environment that has `node` + `tsx` and reaches the public APIs:
 *   - Open-Meteo (weather + geocoding)
 *   - Nominatim (places search)
 *   - Frankfurter (FX rates)
 *   - Wikipedia REST API
 *
 * The harness reports per-test status as a small ASCII table:
 *   [OK]   passed
 *   [FAIL] expected condition not met
 *   [SKIP] external API returned 5xx / timed out — not a repo bug
 *
 * Exit code: 0 on full success, 1 if any test FAILed (SKIPs do NOT fail).
 */

import {
  getWeather,
  getExchangeRate,
  getWikipediaInfo,
  searchPlaces,
  enrichTravelContext,
} from "../mcp/index";

// ---------------------------------------------------------------------------
// Mini test harness
// ---------------------------------------------------------------------------

type Status = "OK" | "FAIL" | "SKIP";

interface TestResult {
  name: string;
  status: Status;
  detail?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function pad(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return s + " ".repeat(w - s.length);
}

function statusBadge(status: Status): string {
  switch (status) {
    case "OK":
      return "\u001b[32m[OK]  \u001b[0m";
    case "FAIL":
      return "\u001b[31m[FAIL]\u001b[0m";
    case "SKIP":
      return "\u001b[33m[SKIP]\u001b[0m";
  }
}

/**
 * Treat a thrown error as a transient infrastructure problem (5xx, timeout,
 * DNS, …) rather than an actual repo regression. The MCP layer in this repo
 * already swallows those into `null`, so this only triggers for the rare
 * cases the helpers themselves throw.
 */
function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("aborted") ||
    m.includes("etimedout") ||
    m.includes("enotfound") ||
    m.includes("network") ||
    m.includes("fetch failed") ||
    m.includes("503") ||
    m.includes("504") ||
    m.includes("502") ||
    m.includes("500")
  );
}

async function runTest(
  name: string,
  fn: () => Promise<{ ok: boolean; detail?: string; skip?: boolean }>
): Promise<void> {
  const startedAt = Date.now();
  let result: TestResult;
  try {
    const outcome = await fn();
    if (outcome.skip) {
      result = {
        name,
        status: "SKIP",
        detail: outcome.detail,
        durationMs: Date.now() - startedAt,
      };
    } else if (outcome.ok) {
      result = {
        name,
        status: "OK",
        detail: outcome.detail,
        durationMs: Date.now() - startedAt,
      };
    } else {
      result = {
        name,
        status: "FAIL",
        detail: outcome.detail ?? "assertion failed",
        durationMs: Date.now() - startedAt,
      };
    }
  } catch (err) {
    const message =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    result = {
      name,
      status: isTransient(err) ? "SKIP" : "FAIL",
      detail: message,
      durationMs: Date.now() - startedAt,
    };
  }

  results.push(result);
  console.log(
    `${statusBadge(result.status)}  ${pad(name, 48)}  ${pad(
      `${result.durationMs} ms`,
      9
    )}  ${result.detail ?? ""}`
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function weatherValid() {
  const data = await getWeather("Madrid");
  if (!data) {
    return { ok: false, skip: true, detail: "Open-Meteo returned null" };
  }
  if (typeof data.temperature !== "number") {
    return { ok: false, detail: `temperature was ${typeof data.temperature}` };
  }
  if (!Array.isArray(data.forecast) || data.forecast.length === 0) {
    return { ok: false, detail: "forecast array missing or empty" };
  }
  return {
    ok: true,
    detail: `Madrid → ${Math.round(data.temperature)}°C, ${data.forecast.length}-day forecast`,
  };
}

async function weatherInvalid() {
  // Pure gibberish should not yield a geocoding hit.
  const data = await getWeather("zzzzzzzzz_not_a_real_city_2487613");
  if (data === null) {
    return { ok: true, detail: "null returned for nonsense city, as expected" };
  }
  return {
    ok: false,
    detail: `expected null, got data for ${data.location}`,
  };
}

async function exchangeValid() {
  const data = await getExchangeRate("USD", "EUR", 100);
  if (!data) {
    return { ok: false, skip: true, detail: "Frankfurter returned null" };
  }
  if (typeof data.rate !== "number" || data.rate <= 0) {
    return { ok: false, detail: `rate was ${data.rate}` };
  }
  if (data.from !== "USD" || data.to !== "EUR") {
    return {
      ok: false,
      detail: `wrong codes: ${data.from} → ${data.to}`,
    };
  }
  return { ok: true, detail: `100 USD → ${data.rate.toFixed(2)} EUR (${data.date})` };
}

async function exchangeSameCurrency() {
  // Identity short-circuit: must succeed without network.
  const data = await getExchangeRate("USD", "USD", 50);
  if (!data) {
    return { ok: false, detail: "identity case returned null" };
  }
  if (data.rate !== 50) {
    return { ok: false, detail: `expected 50, got ${data.rate}` };
  }
  return { ok: true, detail: "identity short-circuit returns input amount" };
}

async function exchangeInvalid() {
  // Frankfurter does not list "ZZZ"; must degrade to null.
  const data = await getExchangeRate("ZZZ", "EUR");
  if (data === null) {
    return { ok: true, detail: "null for unknown currency, as expected" };
  }
  return {
    ok: false,
    detail: `expected null, got rate ${data.rate}`,
  };
}

async function wikipediaValid() {
  const data = await getWikipediaInfo("Madrid");
  if (!data) {
    return { ok: false, skip: true, detail: "Wikipedia returned null" };
  }
  if (!data.extract || data.extract.length < 10) {
    return { ok: false, detail: "extract too short or empty" };
  }
  if (!data.url.startsWith("http")) {
    return { ok: false, detail: `bad url: ${data.url}` };
  }
  return { ok: true, detail: `${data.title} · ${data.extract.length} chars` };
}

async function wikipediaInvalid() {
  // Wildly improbable title; Wikipedia should 404 in both ES and EN.
  const data = await getWikipediaInfo(
    "ZxqWvuT_clearly_not_an_article_xy894231"
  );
  if (data === null) {
    return { ok: true, detail: "null for missing article, as expected" };
  }
  return {
    ok: false,
    detail: `expected null, got title "${data.title}"`,
  };
}

async function placesValid() {
  const data = await searchPlaces("Eiffel Tower", "Paris");
  if (!Array.isArray(data)) {
    return { ok: false, detail: `expected array, got ${typeof data}` };
  }
  if (data.length === 0) {
    return { ok: false, skip: true, detail: "Nominatim returned empty array" };
  }
  const first = data[0];
  if (typeof first.lat !== "number" || typeof first.lon !== "number") {
    return { ok: false, detail: "lat/lon missing in first place" };
  }
  return { ok: true, detail: `${data.length} place(s), top: ${first.name}` };
}

async function placesInvalid() {
  // Empty query → guarded by the helper, returns [].
  const data = await searchPlaces("");
  if (Array.isArray(data) && data.length === 0) {
    return { ok: true, detail: "empty array for empty query, as expected" };
  }
  return {
    ok: false,
    detail: `expected [], got ${Array.isArray(data) ? data.length : typeof data}`,
  };
}

async function enrichTravelValid() {
  const ctx = await enrichTravelContext("Tokio", "EUR");
  if (!ctx || ctx.destination !== "Tokio") {
    return { ok: false, detail: "context shape wrong" };
  }
  // At least ONE of the parallel calls should succeed for a major city.
  const anyData =
    ctx.weather !== null || ctx.wiki !== null || ctx.topPlaces.length > 0;
  if (!anyData) {
    return {
      ok: false,
      skip: true,
      detail: "all three external calls failed (likely rate limited)",
    };
  }
  return {
    ok: true,
    detail: `weather=${Boolean(ctx.weather)} wiki=${Boolean(ctx.wiki)} places=${ctx.topPlaces.length}`,
  };
}

async function enrichTravelInvalid() {
  // The helper is tolerant by design: it returns nulls / empty arrays for
  // failed sub-fetches and never throws. The contract for this test is
  // "returns an object with the expected shape, no throw".
  const ctx = await enrichTravelContext("__definitely_not_a_place__", "USD");
  if (!ctx) {
    return { ok: false, detail: "expected an object, got null/undefined" };
  }
  if (
    ctx.destination !== "__definitely_not_a_place__" ||
    !Array.isArray(ctx.topPlaces) ||
    typeof ctx.timestamp !== "string"
  ) {
    return { ok: false, detail: "context shape wrong on garbage input" };
  }
  return {
    ok: true,
    detail: "tolerated garbage input, returned typed object",
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const banner =
    "MCP smoke tests · " + new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log("");
  console.log("=".repeat(80));
  console.log(banner);
  console.log("=".repeat(80));
  console.log(
    `${pad("status", 7)} ${pad("test", 49)} ${pad("dur", 9)} detail`
  );
  console.log("-".repeat(80));

  await runTest("weather: valid city (Madrid)", weatherValid);
  await runTest("weather: invalid / nonsense city", weatherInvalid);
  await runTest("exchange: USD → EUR (100)", exchangeValid);
  await runTest("exchange: same currency identity", exchangeSameCurrency);
  await runTest("exchange: unsupported currency code", exchangeInvalid);
  await runTest("wikipedia: known title (Madrid)", wikipediaValid);
  await runTest("wikipedia: missing article (404)", wikipediaInvalid);
  await runTest("places: search Eiffel Tower in Paris", placesValid);
  await runTest("places: empty query → []", placesInvalid);
  await runTest("enrichTravel: real destination (Tokio)", enrichTravelValid);
  await runTest("enrichTravel: garbage input is tolerated", enrichTravelInvalid);

  const passed = results.filter((r) => r.status === "OK").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log("-".repeat(80));
  console.log(
    `Summary: ${passed} OK · ${failed} FAIL · ${skipped} SKIP · ${results.length} total`
  );
  console.log("=".repeat(80));

  if (failed > 0) {
    console.error("\nFailed tests:");
    for (const r of results) {
      if (r.status === "FAIL") {
        console.error(`  - ${r.name}: ${r.detail ?? ""}`);
      }
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected harness failure:", err);
  process.exit(1);
});
