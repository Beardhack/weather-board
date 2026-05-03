import type { WeatherConditionKey } from "../types/weather";

type WeatherCodeInfo = {
  label: string;
  key: WeatherConditionKey;
};

const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: "Clear", key: "clear" },
  1: { label: "Mostly clear", key: "clear" },
  2: { label: "Partly cloudy", key: "partly-cloudy" },
  3: { label: "Overcast", key: "cloudy" },
  45: { label: "Fog", key: "fog" },
  48: { label: "Rime fog", key: "fog" },
  51: { label: "Light drizzle", key: "drizzle" },
  53: { label: "Drizzle", key: "drizzle" },
  55: { label: "Heavy drizzle", key: "drizzle" },
  56: { label: "Freezing drizzle", key: "drizzle" },
  57: { label: "Freezing drizzle", key: "drizzle" },
  61: { label: "Light rain", key: "rain" },
  63: { label: "Rain", key: "rain" },
  65: { label: "Heavy rain", key: "rain" },
  66: { label: "Freezing rain", key: "rain" },
  67: { label: "Freezing rain", key: "rain" },
  71: { label: "Light snow", key: "snow" },
  73: { label: "Snow", key: "snow" },
  75: { label: "Heavy snow", key: "snow" },
  77: { label: "Snow grains", key: "snow" },
  80: { label: "Rain showers", key: "rain" },
  81: { label: "Rain showers", key: "rain" },
  82: { label: "Heavy showers", key: "rain" },
  85: { label: "Snow showers", key: "snow" },
  86: { label: "Heavy snow showers", key: "snow" },
  95: { label: "Thunderstorm", key: "storm" },
  96: { label: "Thunderstorm with hail", key: "storm" },
  99: { label: "Thunderstorm with hail", key: "storm" },
};

export function getWeatherCodeInfo(code: number | null | undefined): WeatherCodeInfo {
  if (typeof code !== "number") {
    return { label: "Unavailable", key: "unknown" };
  }

  return WEATHER_CODES[code] ?? { label: "Weather unavailable", key: "unknown" };
}
