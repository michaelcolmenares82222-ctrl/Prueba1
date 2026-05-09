/**
 * Exchange MCP — Frankfurter (free, no API key, ECB reference rates).
 *
 * Frankfurter only supports fiat currencies covered by the ECB; cryptos and
 * uncommon currencies will yield a non-200 response or an empty `rates` map,
 * which we treat as a clean failure (return `null`).
 *
 * Docs: https://www.frankfurter.app/docs/
 */

const FETCH_TIMEOUT_MS = 10_000;
const FRANKFURTER_URL = "https://api.frankfurter.app/latest";

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  date: string;
}

interface FrankfurterResponse {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
}

function normalizeCurrency(code: string): string {
  return code.trim().toUpperCase();
}

export async function getExchangeRate(
  from: string,
  to: string,
  amount = 1
): Promise<ExchangeRate | null> {
  if (!from || !to) {
    console.error("[mcp:exchange] Missing from/to");
    return null;
  }

  const fromCode = normalizeCurrency(from);
  const toCode = normalizeCurrency(to);

  if (fromCode === toCode) {
    return {
      from: fromCode,
      to: toCode,
      rate: amount,
      date: new Date().toISOString().slice(0, 10),
    };
  }

  const params = new URLSearchParams({
    from: fromCode,
    to: toCode,
    amount: String(amount),
  });

  const url = `${FRANKFURTER_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(
        `[mcp:exchange] HTTP ${res.status} for ${fromCode}->${toCode}`
      );
      return null;
    }

    const data = (await res.json()) as FrankfurterResponse;
    const rate = data.rates?.[toCode];

    if (typeof rate !== "number" || Number.isNaN(rate)) {
      console.error(
        `[mcp:exchange] No rate returned for ${fromCode}->${toCode}`
      );
      return null;
    }

    return {
      from: fromCode,
      to: toCode,
      rate,
      date: data.date ?? new Date().toISOString().slice(0, 10),
    };
  } catch (err) {
    console.error(
      `[mcp:exchange] Failed ${fromCode}->${toCode}:`,
      err
    );
    return null;
  }
}

export async function convertBudget(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    console.error("[mcp:exchange] Invalid amount");
    return null;
  }

  const result = await getExchangeRate(fromCurrency, toCurrency, amount);
  // Frankfurter returns the *converted* amount (since we passed `amount`),
  // so `rate` here already represents the converted total.
  return result ? result.rate : null;
}
