/**
 * Wikipedia MCP — REST API page summary (free, no API key).
 *
 * Strategy: try the requested language first; on 404 fall back to English
 * once before giving up. Anything else (network error, 5xx) returns null.
 *
 * Docs: https://en.wikipedia.org/api/rest_v1/#/Page%20content/get_page_summary__title_
 */

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "UniversalAIAssistant/1.0";

export interface WikipediaInfo {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

interface WikipediaSummaryResponse {
  title?: string;
  extract?: string;
  content_urls?: {
    desktop?: { page?: string };
    mobile?: { page?: string };
  };
  thumbnail?: { source?: string };
}

function summaryUrl(language: string, query: string): string {
  return `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    query
  )}`;
}

async function fetchSummary(
  language: string,
  query: string
): Promise<WikipediaInfo | null | "not_found"> {
  const url = summaryUrl(language, query);

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      redirect: "follow",
    });

    if (res.status === 404) {
      return "not_found";
    }

    if (!res.ok) {
      console.error(
        `[mcp:wikipedia] HTTP ${res.status} for "${query}" (${language})`
      );
      return null;
    }

    const data = (await res.json()) as WikipediaSummaryResponse;

    const pageUrl =
      data.content_urls?.desktop?.page ??
      data.content_urls?.mobile?.page ??
      `https://${language}.wikipedia.org/wiki/${encodeURIComponent(query)}`;

    return {
      title: data.title ?? query,
      extract: data.extract ?? "",
      thumbnail: data.thumbnail?.source,
      url: pageUrl,
    };
  } catch (err) {
    console.error(
      `[mcp:wikipedia] Fetch failed for "${query}" (${language}):`,
      err
    );
    return null;
  }
}

export async function getWikipediaInfo(
  query: string,
  language = "es"
): Promise<WikipediaInfo | null> {
  if (!query || typeof query !== "string") {
    console.error("[mcp:wikipedia] Invalid query");
    return null;
  }

  const primary = await fetchSummary(language, query);
  if (primary && primary !== "not_found") return primary;

  if (primary === "not_found" && language !== "en") {
    const fallback = await fetchSummary("en", query);
    if (fallback && fallback !== "not_found") return fallback;
  }

  return null;
}
