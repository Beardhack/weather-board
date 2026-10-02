import { CITIES, getCityById } from "../data/cities";
import type { CityConfig } from "../types/weather";
import { record } from "./openMeteo";
export const PREFERENCES_KEY = "weather-board:locations:v1";
export const RECENT_LIMIT = 8;
export const FAVORITE_LIMIT = 24;
export type Preferences = {
  version: 1;
  selected: CityConfig;
  favorites: CityConfig[];
  recents: CityConfig[];
};
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function validZone(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
export function isCity(value: unknown): value is CityConfig {
  const c = record(value);
  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    c.id.length < 120 &&
    typeof c.name === "string" &&
    c.name.length > 0 &&
    c.name.length < 250 &&
    typeof c.region === "string" &&
    typeof c.country === "string" &&
    typeof c.latitude === "number" &&
    Number.isFinite(c.latitude) &&
    Math.abs(c.latitude) <= 90 &&
    typeof c.longitude === "number" &&
    Number.isFinite(c.longitude) &&
    Math.abs(c.longitude) <= 180 &&
    validZone(c.timezone)
  );
}
function unique(cities: CityConfig[], limit: number): CityConfig[] {
  return [...new Map(cities.map((c) => [c.id, c])).values()].slice(0, limit);
}
export function loadPreferences(storage: StorageLike): Preferences {
  try {
    const value = record(
      JSON.parse(storage.getItem(PREFERENCES_KEY) ?? "null"),
    );
    if (
      value.version === 1 &&
      isCity(value.selected) &&
      Array.isArray(value.favorites) &&
      Array.isArray(value.recents)
    ) {
      return {
        version: 1,
        selected: value.selected,
        favorites: unique(value.favorites.filter(isCity), FAVORITE_LIMIT),
        recents: unique(value.recents.filter(isCity), RECENT_LIMIT),
      };
    }
  } catch {
    /* Fall through to legacy selection and the original seven favorites. */
  }
  let selected = CITIES[0];
  try {
    selected = getCityById(
      storage.getItem("weather-board:selected-city") ?? "",
    );
  } catch {
    /* storage is optional */
  }
  return { version: 1, selected, favorites: [...CITIES], recents: [] };
}
export function savePreferences(
  storage: StorageLike,
  preferences: Preferences,
): boolean {
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
export function visitLocation(
  preferences: Preferences,
  city: CityConfig,
): Preferences {
  return {
    ...preferences,
    selected: city,
    recents: [
      city,
      ...preferences.recents.filter((c) => c.id !== city.id),
    ].slice(0, RECENT_LIMIT),
  };
}
export function toggleFavorite(
  preferences: Preferences,
  city: CityConfig,
): Preferences {
  const saved = preferences.favorites.some((c) => c.id === city.id);
  return {
    ...preferences,
    favorites: saved
      ? preferences.favorites.filter((c) => c.id !== city.id)
      : unique([...preferences.favorites, city], FAVORITE_LIMIT),
  };
}
export function normalizeLocations(payload: unknown): CityConfig[] {
  const results = record(payload).results;
  if (results !== undefined && !Array.isArray(results))
    throw new Error("The location service returned an invalid response.");
  return unique(
    (Array.isArray(results) ? results : []).flatMap((item: unknown) => {
      const r = record(item);
      if (typeof r.id !== "number" || !Number.isSafeInteger(r.id)) return [];
      const city = {
        id: `geonames:${r.id}`,
        name: r.name,
        region: typeof r.admin1 === "string" ? r.admin1 : "",
        country:
          typeof r.country === "string"
            ? r.country
            : typeof r.country_code === "string"
              ? r.country_code
              : "",
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone,
      };
      return isCity(city) ? [city] : [];
    }),
    10,
  );
}
export async function searchLocations(
  query: string,
  signal: AbortSignal,
): Promise<CityConfig[]> {
  const params = new URLSearchParams({
    name: query.trim(),
    count: "10",
    language: "en",
    format: "json",
  });
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    { signal },
  );
  if (!response.ok)
    throw new Error("Location search is unavailable. Please try again.");
  const payload: unknown = await response.json();
  if (record(payload).error)
    throw new Error("Location search is unavailable. Please try again.");
  return normalizeLocations(payload);
}
