/**
 * Weather MCP — Open-Meteo (free, no API key).
 *
 * Two-step flow:
 *   1) Geocode the city to (lat, lon) via the Open-Meteo geocoding API.
 *   2) Query the forecast endpoint for current conditions + 7-day daily forecast.
 *
 * On any network/parse failure we log with the `[mcp:weather]` prefix and
 * return `null` so the caller can degrade gracefully.
 */

const FETCH_TIMEOUT_MS = 10_000;

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  forecast: WeatherForecastDay[];
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    weather_code?: number[];
  };
}

/**
 * WMO weather codes → Spanish description.
 * Reference: https://open-meteo.com/en/docs (look for "WMO Weather interpretation codes").
 */
export function getWeatherDescription(code: number | undefined): string {
  if (code === undefined || code === null || Number.isNaN(code)) {
    return "Sin datos";
  }

  const map: Record<number, string> = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna densa",
    56: "Llovizna helada ligera",
    57: "Llovizna helada densa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia intensa",
    66: "Lluvia helada ligera",
    67: "Lluvia helada intensa",
    71: "Nevadas ligeras",
    73: "Nevadas moderadas",
    75: "Nevadas intensas",
    77: "Granos de nieve",
    80: "Chubascos ligeros",
    81: "Chubascos moderados",
    82: "Chubascos violentos",
    85: "Chubascos de nieve ligeros",
    86: "Chubascos de nieve intensos",
    95: "Tormenta",
    96: "Tormenta con granizo ligero",
    99: "Tormenta con granizo fuerte",
  };

  return map[code] ?? `Condición desconocida (${code})`;
}

async function geocode(city: string): Promise<GeocodingResult | null> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=es`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(
        `[mcp:weather] Geocoding HTTP ${res.status} for "${city}"`
      );
      return null;
    }

    const data = (await res.json()) as GeocodingResponse;
    const first = data?.results?.[0];
    if (!first) {
      console.error(
        `[mcp:weather] No geocoding result for "${city}"`
      );
      return null;
    }
    return first;
  } catch (err) {
    console.error(
      `[mcp:weather] Geocoding failed for "${city}":`,
      err
    );
    return null;
  }
}

export async function getWeather(
  city: string
): Promise<WeatherData | null> {
  if (!city || typeof city !== "string") {
    console.error("[mcp:weather] Invalid city argument");
    return null;
  }

  const geo = await geocode(city);
  if (!geo) return null;

  const params = new URLSearchParams({
    latitude: String(geo.latitude),
    longitude: String(geo.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    timezone: "auto",
    forecast_days: "7",
  });

  const url = `${FORECAST_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(
        `[mcp:weather] Forecast HTTP ${res.status} for "${city}"`
      );
      return null;
    }

    const data = (await res.json()) as ForecastResponse;
    const current = data.current ?? {};
    const daily = data.daily ?? {};

    const times = daily.time ?? [];
    const maxes = daily.temperature_2m_max ?? [];
    const mins = daily.temperature_2m_min ?? [];
    const precs = daily.precipitation_sum ?? [];

    const forecast: WeatherForecastDay[] = times.map((t, i) => ({
      date: t,
      tempMax: typeof maxes[i] === "number" ? maxes[i] : 0,
      tempMin: typeof mins[i] === "number" ? mins[i] : 0,
      precipitation: typeof precs[i] === "number" ? precs[i] : 0,
    }));

    const locationLabel = [geo.name, geo.admin1, geo.country]
      .filter(Boolean)
      .join(", ");

    return {
      location: locationLabel || geo.name,
      temperature: current.temperature_2m ?? 0,
      feelsLike: current.apparent_temperature ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      windSpeed: current.wind_speed_10m ?? 0,
      description: getWeatherDescription(current.weather_code),
      forecast,
    };
  } catch (err) {
    console.error(
      `[mcp:weather] Forecast failed for "${city}":`,
      err
    );
    return null;
  }
}
