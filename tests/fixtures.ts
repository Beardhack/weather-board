import { CITIES } from "../src/data/cities";
import { normalizeOpenMeteoResponse } from "../src/lib/openMeteo";
export const NOW = Date.parse("2026-10-02T12:15:00Z");
export const city = CITIES[0];
export function payload(now = NOW, days = 7) {
  const start = Math.floor(now / 86_400_000) * 86400;
  const times = Array.from({ length: days * 24 }, (_, i) => start + i * 3600);
  return {
    utc_offset_seconds: 0,
    timezone: "UTC",
    current: {
      time: now / 1000,
      temperature_2m: 64,
      apparent_temperature: 62,
      relative_humidity_2m: 67,
      weather_code: 2,
      is_day: 1,
      wind_speed_10m: 8,
    },
    hourly: {
      time: times,
      temperature_2m: times.map(
        (_, i) => 57 + Math.round(12 * Math.sin(i / 6)),
      ),
      apparent_temperature: times.map(() => 58),
      precipitation_probability: times.map((_, i) => (i % 6) * 10),
      precipitation: times.map(() => 0.01),
      weather_code: times.map((_, i) => (i % 8 === 0 ? 61 : 2)),
      is_day: times.map((t) => {
        const h = new Date(t * 1000).getUTCHours();
        return h >= 7 && h < 19 ? 1 : 0;
      }),
      wind_speed_10m: times.map(() => 8),
      wind_gusts_10m: times.map(() => 15),
      relative_humidity_2m: times.map(() => 66),
    },
    daily: {
      time: Array.from({ length: days }, (_, i) => start + i * 86400),
      weather_code: Array(days).fill(2),
      temperature_2m_max: Array(days).fill(74),
      temperature_2m_min: Array(days).fill(56),
      precipitation_probability_max: Array(days).fill(40),
      sunrise: Array.from(
        { length: days },
        (_, i) => start + i * 86400 + 7 * 3600,
      ),
      sunset: Array.from(
        { length: days },
        (_, i) => start + i * 86400 + 19 * 3600,
      ),
    },
  };
}
export function forecast(now = NOW) {
  return normalizeOpenMeteoResponse(payload(now), city, now);
}
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
export function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
