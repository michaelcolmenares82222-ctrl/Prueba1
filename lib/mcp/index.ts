/**
 * MCP orchestrator — central re-export of every Model Context Protocol tool
 * plus a `enrichTravelContext` helper that fans out to several APIs in
 * parallel and tolerates partial failures via `Promise.allSettled`.
 */

import {
  getWeather,
  type WeatherData,
  type WeatherForecastDay,
} from "./weather-mcp";
import {
  searchPlaces,
  getNearbyAttractions,
  type PlaceData,
} from "./places-mcp";
import {
  getExchangeRate,
  convertBudget,
  type ExchangeRate,
} from "./exchange-mcp";
import {
  getWikipediaInfo,
  type WikipediaInfo,
} from "./wikipedia-mcp";

export type {
  WeatherData,
  WeatherForecastDay,
  PlaceData,
  ExchangeRate,
  WikipediaInfo,
};

export {
  getWeather,
  searchPlaces,
  getNearbyAttractions,
  getExchangeRate,
  convertBudget,
  getWikipediaInfo,
};

/**
 * Map of MCP tools keyed by short name. Useful for dynamic dispatch from a
 * single API endpoint without giant switch/case ladders.
 */
export const MCPTools = {
  weather: getWeather,
  places: searchPlaces,
  nearbyAttractions: getNearbyAttractions,
  exchange: getExchangeRate,
  convertBudget,
  wikipedia: getWikipediaInfo,
} as const;

export type MCPToolName = keyof typeof MCPTools;

export interface EnrichedTravelContext {
  destination: string;
  userCurrency: string;
  weather: WeatherData | null;
  wiki: WikipediaInfo | null;
  topPlaces: PlaceData[];
  timestamp: string;
}

/**
 * Pull live travel context for a destination from several MCP servers in
 * parallel. Any individual failure is swallowed and surfaced as `null` /
 * empty array; the overall call never throws.
 */
export async function enrichTravelContext(
  destination: string,
  userCurrency = "USD"
): Promise<EnrichedTravelContext> {
  const results = await Promise.allSettled([
    getWeather(destination),
    getWikipediaInfo(destination),
    searchPlaces("atracciones turísticas", destination),
  ]);

  const [weatherResult, wikiResult, placesResult] = results;

  const weather =
    weatherResult.status === "fulfilled" ? weatherResult.value : null;
  const wiki =
    wikiResult.status === "fulfilled" ? wikiResult.value : null;
  const places =
    placesResult.status === "fulfilled" ? placesResult.value : [];

  if (weatherResult.status === "rejected") {
    console.error(
      "[mcp:enrichTravel] weather rejected:",
      weatherResult.reason
    );
  }
  if (wikiResult.status === "rejected") {
    console.error(
      "[mcp:enrichTravel] wiki rejected:",
      wikiResult.reason
    );
  }
  if (placesResult.status === "rejected") {
    console.error(
      "[mcp:enrichTravel] places rejected:",
      placesResult.reason
    );
  }

  const topPlaces = [...places]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5);

  return {
    destination,
    userCurrency,
    weather,
    wiki,
    topPlaces,
    timestamp: new Date().toISOString(),
  };
}
