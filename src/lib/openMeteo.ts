import type {
  CityConfig,
  CityWeather,
  Conditions,
  HourlyForecastPoint,
} from "../types/weather";
import { getWeatherCodeInfo } from "./weatherCodes";
export const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const percent = (value: unknown) => {
  const n = finite(value);
  return n !== null && n >= 0 && n <= 100 ? n : null;
};
const nonnegative = (value: unknown) => {
  const n = finite(value);
  return n !== null && n >= 0 ? n : null;
};
const epoch = (value: unknown) => {
  const n = finite(value);
  return n !== null && n > 0 && n < 8.64e12 ? n * 1000 : null;
};
export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
function conditions(row: Record<string, unknown>): Conditions {
  const weatherCode = finite(row.weather_code);
  const condition = getWeatherCodeInfo(weatherCode);
  return {
    temperature: finite(row.temperature_2m),
    apparentTemperature: finite(row.apparent_temperature),
    weatherCode,
    conditionLabel: condition.label,
    conditionKey: condition.key,
    isDay: row.is_day === 1 ? true : row.is_day === 0 ? false : null,
    windSpeed: nonnegative(row.wind_speed_10m),
    humidity: percent(row.relative_humidity_2m),
  };
}
function rowAt(
  data: Record<string, unknown>,
  i: number,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, array(value)[i]]),
  );
}
export function buildForecastUrl(city: CityConfig): string {
  const fields =
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m";
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: city.timezone,
    timeformat: "unixtime",
    forecast_days: "7",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    current: fields,
    hourly: `${fields},precipitation_probability,precipitation,wind_gusts_10m`,
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}
export async function fetchCityWeather(
  city: CityConfig,
  signal?: AbortSignal,
): Promise<CityWeather> {
  const response = await fetch(buildForecastUrl(city), { signal });
  if (!response.ok)
    throw new Error(`Weather service returned ${response.status}.`);
  return normalizeOpenMeteoResponse(await response.json(), city);
}
export function normalizeOpenMeteoResponse(
  input: unknown,
  city: CityConfig,
  fetchedAt = Date.now(),
): CityWeather {
  const payload = record(input);
  if (payload.error)
    throw new Error("Weather service could not provide this forecast.");
  const rawHourly = record(payload.hourly);
  const seen = new Set<number>();
  const hourly: HourlyForecastPoint[] = array(rawHourly.time)
    .flatMap((value, index) => {
      const time = epoch(value);
      if (time === null || seen.has(time)) return [];
      seen.add(time);
      const row = rowAt(rawHourly, index);
      return [
        {
          ...conditions(row),
          time,
          precipitationProbability: percent(row.precipitation_probability),
          precipitationAmount: nonnegative(row.precipitation),
          windGusts: nonnegative(row.wind_gusts_10m),
        },
      ];
    })
    .sort((a, b) => a.time - b.time);
  const rawDaily = record(payload.daily);
  const offset = finite(payload.utc_offset_seconds);
  const daily = array(rawDaily.time).flatMap((value, index) => {
    const time = epoch(value);
    if (time === null || offset === null || Math.abs(offset) > 86400) return [];
    const row = rowAt(rawDaily, index);
    const weatherCode = finite(row.weather_code);
    const info = getWeatherCodeInfo(weatherCode);
    return [
      {
        // Provider daily epochs encode calendar labels with utc_offset_seconds,
        // not instants to reinterpret with a DST-varying offset.
        date: new Date(time + offset * 1000).toISOString().slice(0, 10),
        weatherCode,
        conditionKey: info.key,
        conditionLabel: info.label,
        highTemperature: finite(row.temperature_2m_max),
        lowTemperature: finite(row.temperature_2m_min),
        precipitationProbability: percent(row.precipitation_probability_max),
        sunrise: epoch(row.sunrise),
        sunset: epoch(row.sunset),
      },
    ];
  });
  if (
    !hourly.length ||
    !hourly.some((p) => p.temperature !== null || p.weatherCode !== null)
  ) {
    throw new Error("Weather service returned an incomplete hourly forecast.");
  }
  const rawCurrent = record(payload.current);
  return {
    cityId: city.id,
    current: { ...conditions(rawCurrent), time: epoch(rawCurrent.time) },
    hourly,
    daily,
    fetchedAt,
  };
}
