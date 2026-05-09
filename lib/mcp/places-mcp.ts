/**
 * Places MCP — Nominatim (search) + Overpass (nearby attractions).
 *
 * Both are free OpenStreetMap services; Nominatim requires a descriptive
 * `User-Agent` header per its usage policy:
 *   https://operations.osmfoundation.org/policies/nominatim/
 */

const FETCH_TIMEOUT_MS = 10_000;

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "UniversalAIAssistant/1.0";

export interface PlaceData {
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

interface NominatimItem {
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  importance?: number;
  name?: string;
  namedetails?: { name?: string };
}

interface OverpassTags {
  name?: string;
  tourism?: string;
  historic?: string;
  amenity?: string;
  "addr:street"?: string;
  "addr:housenumber"?: string;
  "addr:city"?: string;
}

interface OverpassElement {
  type?: "node" | "way" | "relation";
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: OverpassTags;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

export async function searchPlaces(
  query: string,
  city?: string
): Promise<PlaceData[]> {
  if (!query || typeof query !== "string") {
    console.error("[mcp:places] Invalid query argument");
    return [];
  }

  const q = city ? `${query} ${city}` : query;
  const params = new URLSearchParams({
    q,
    format: "json",
    addressdetails: "1",
    namedetails: "1",
    limit: "10",
    "accept-language": "es",
  });

  const url = `${NOMINATIM_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(
        `[mcp:places] Nominatim HTTP ${res.status} for query "${q}"`
      );
      return [];
    }

    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) {
      console.error(
        "[mcp:places] Unexpected Nominatim response shape"
      );
      return [];
    }

    const items = raw as NominatimItem[];

    return items
      .map((item): PlaceData | null => {
        const lat = item.lat ? Number.parseFloat(item.lat) : NaN;
        const lon = item.lon ? Number.parseFloat(item.lon) : NaN;
        if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

        const name =
          item.namedetails?.name ||
          item.name ||
          item.display_name?.split(",")[0]?.trim() ||
          "Sin nombre";

        return {
          name,
          address: item.display_name ?? "",
          lat,
          lon,
          type: item.type || item.class || "place",
          importance:
            typeof item.importance === "number" ? item.importance : 0,
        };
      })
      .filter((p): p is PlaceData => p !== null);
  } catch (err) {
    console.error(
      `[mcp:places] Nominatim search failed for "${q}":`,
      err
    );
    return [];
  }
}

export async function getNearbyAttractions(
  lat: number,
  lon: number,
  radius = 5000
): Promise<PlaceData[]> {
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    Number.isNaN(lat) ||
    Number.isNaN(lon)
  ) {
    console.error("[mcp:places] Invalid lat/lon for Overpass");
    return [];
  }

  // Search tourism + historic POIs and a few headline restaurants near the point.
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["tourism"](around:${radius},${lat},${lon});
      way["tourism"](around:${radius},${lat},${lon});
      node["historic"](around:${radius},${lat},${lon});
      way["historic"](around:${radius},${lat},${lon});
      node["amenity"="restaurant"](around:${radius},${lat},${lon});
    );
    out center 50;
  `.trim();

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "Content-Type": "text/plain",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: overpassQuery,
    });

    if (!res.ok) {
      console.error(
        `[mcp:places] Overpass HTTP ${res.status} for (${lat},${lon})`
      );
      return [];
    }

    const data = (await res.json()) as OverpassResponse;
    const elements = data.elements ?? [];

    const places: PlaceData[] = [];

    for (const el of elements) {
      const tags = el.tags;
      const name = tags?.name;
      if (!tags || !name) continue;

      const elLat =
        typeof el.lat === "number"
          ? el.lat
          : typeof el.center?.lat === "number"
            ? el.center.lat
            : null;
      const elLon =
        typeof el.lon === "number"
          ? el.lon
          : typeof el.center?.lon === "number"
            ? el.center.lon
            : null;

      if (elLat === null || elLon === null) continue;

      const type =
        tags.tourism || tags.historic || tags.amenity || "poi";

      const addressParts = [
        tags["addr:street"],
        tags["addr:housenumber"],
        tags["addr:city"],
      ].filter((s): s is string => Boolean(s));

      places.push({
        name,
        address: addressParts.join(", "),
        lat: elLat,
        lon: elLon,
        type,
        importance: 0,
      });

      if (places.length >= 20) break;
    }

    return places;
  } catch (err) {
    console.error(
      `[mcp:places] Overpass failed for (${lat},${lon}):`,
      err
    );
    return [];
  }
}
