import type { CityWeather, WeatherCacheEntry } from "../types/weather";

const CACHE_PREFIX = "weather-board:city-weather:";
export const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

export function getWeatherCache(cityId: string): WeatherCacheEntry | null {
  try {
    const cached = window.localStorage.getItem(getCacheKey(cityId));

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as WeatherCacheEntry;

    if (!parsed?.data || parsed.cityId !== cityId || typeof parsed.fetchedAt !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setWeatherCache(cityId: string, data: CityWeather): void {
  try {
    const entry: WeatherCacheEntry = {
      cityId,
      data,
      fetchedAt: data.fetchedAt,
    };

    window.localStorage.setItem(getCacheKey(cityId), JSON.stringify(entry));
  } catch {
    // Weather still works without localStorage; the cache is an enhancement.
  }
}

export function isCacheFresh(entry: WeatherCacheEntry, now = Date.now()): boolean {
  return now - entry.fetchedAt < WEATHER_CACHE_TTL_MS;
}

function getCacheKey(cityId: string): string {
  return `${CACHE_PREFIX}${cityId}`;
}
