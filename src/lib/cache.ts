import type { CityConfig, CityWeather } from "../types/weather";
import { record } from "./openMeteo";
export const CACHE_PREFIX = "weather-board:forecast:v2:";
export const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;
export const CACHE_LIMIT = 12;
export const locationKey = (city: CityConfig) =>
  `${city.id}:${city.latitude}:${city.longitude}:${city.timezone}`;
export function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
const nullable = (v: unknown) =>
  v === null || (typeof v === "number" && Number.isFinite(v));
const timestamp = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 && v < 8.64e15;
const keys = new Set([
  "clear",
  "partly-cloudy",
  "cloudy",
  "fog",
  "drizzle",
  "rain",
  "snow",
  "storm",
  "unknown",
]);
function validConditions(input: unknown): boolean {
  const v = record(input);
  return (
    [
      "temperature",
      "apparentTemperature",
      "weatherCode",
      "windSpeed",
      "humidity",
    ].every((k) => nullable(v[k])) &&
    (v.isDay === null || typeof v.isDay === "boolean") &&
    typeof v.conditionLabel === "string" &&
    keys.has(String(v.conditionKey))
  );
}
export function validWeather(
  input: unknown,
  cityId: string,
): input is CityWeather {
  const v = record(input);
  const current = record(v.current);
  return (
    v.cityId === cityId &&
    timestamp(v.fetchedAt) &&
    validConditions(current) &&
    (current.time === null || timestamp(current.time)) &&
    Array.isArray(v.hourly) &&
    v.hourly.length > 0 &&
    v.hourly.length <= 400 &&
    v.hourly.every((p: unknown) => {
      const h = record(p);
      return (
        validConditions(h) &&
        timestamp(h.time) &&
        ["precipitationProbability", "precipitationAmount", "windGusts"].every(
          (k) => nullable(h[k]),
        )
      );
    }) &&
    Array.isArray(v.daily) &&
    v.daily.length <= 16 &&
    v.daily.every((p: unknown) => {
      const d = record(p);
      return (
        typeof d.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(d.date) &&
        !Number.isNaN(Date.parse(d.date)) &&
        typeof d.conditionLabel === "string" &&
        keys.has(String(d.conditionKey)) &&
        [
          "weatherCode",
          "highTemperature",
          "lowTemperature",
          "precipitationProbability",
        ].every((k) => nullable(d[k])) &&
        (d.sunrise === null || timestamp(d.sunrise)) &&
        (d.sunset === null || timestamp(d.sunset))
      );
    })
  );
}
export function isWeatherFresh(
  data: CityWeather | null,
  now = Date.now(),
): boolean {
  return (
    !!data &&
    data.fetchedAt <= now &&
    now - data.fetchedAt < WEATHER_CACHE_TTL_MS &&
    data.hourly.some((p) => p.time >= now)
  );
}
export function getWeatherCache(
  city: CityConfig,
  storage = browserStorage(),
  now = Date.now(),
): CityWeather | null {
  try {
    const data: unknown = JSON.parse(
      storage?.getItem(CACHE_PREFIX + locationKey(city)) ?? "null",
    );
    return validWeather(data, city.id) && data.fetchedAt <= now ? data : null;
  } catch {
    return null;
  }
}
export function setWeatherCache(
  city: CityConfig,
  data: CityWeather,
  storage = browserStorage(),
): void {
  if (!storage) return;
  try {
    // Evict only our weather cache. Preferences and legacy selection are independent.
    const entries: { key: string; time: number }[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        let time = 0;
        try {
          time =
            (record(JSON.parse(storage.getItem(key) ?? "{}"))
              .fetchedAt as number) || 0;
        } catch {
          /* corrupt cache */
        }
        entries.push({ key, time });
      }
    }
    const ownKey = CACHE_PREFIX + locationKey(city);
    const others = entries
      .filter((e) => e.key !== ownKey)
      .sort((a, b) => b.time - a.time);
    for (const entry of others.slice(CACHE_LIMIT - 1))
      storage.removeItem(entry.key);
    storage.setItem(ownKey, JSON.stringify(data));
  } catch {
    /* Quota/private mode: the in-memory last good response remains usable. */
  }
}
