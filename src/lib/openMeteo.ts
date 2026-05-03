import type {
  CityConfig,
  CityWeather,
  CurrentWeather,
  DailyForecastPoint,
  HourlyForecastPoint,
} from "../types/weather";
import { normalizeDailyForecast, selectNext24Hours } from "./formatting";
import { getWeatherCodeInfo } from "./weatherCodes";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

type OpenMeteoCurrent = {
  time?: string;
  temperature_2m?: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  weather_code?: number;
  is_day?: number;
  wind_speed_10m?: number;
};

type OpenMeteoHourly = {
  time?: string[];
  temperature_2m?: number[];
  precipitation_probability?: Array<number | null>;
  weather_code?: number[];
};

type OpenMeteoDaily = {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: Array<number | null>;
  sunrise?: string[];
  sunset?: string[];
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  daily?: OpenMeteoDaily;
};

export async function fetchCityWeather(city: CityConfig): Promise<CityWeather> {
  const response = await fetch(buildForecastUrl(city));

  if (!response.ok) {
    throw new Error(`Open-Meteo returned ${response.status}.`);
  }

  const payload = (await response.json()) as OpenMeteoResponse;
  return normalizeOpenMeteoResponse(payload, city);
}

function buildForecastUrl(city: CityConfig): string {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: city.timezone,
    forecast_days: "7",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    hourly: ["temperature_2m", "precipitation_probability", "weather_code"].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
    ].join(","),
  });

  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

function normalizeOpenMeteoResponse(payload: OpenMeteoResponse, city: CityConfig): CityWeather {
  const hourly = normalizeHourlyForecast(payload.hourly);
  const next24Hours = selectNext24Hours(hourly, payload.current?.time);
  const currentPrecipitation = findCurrentPrecipitation(next24Hours, payload.current?.time);
  const current = normalizeCurrentWeather(payload.current, currentPrecipitation);
  const daily = normalizeDailyForecast(normalizeDaily(payload.daily));

  if (next24Hours.length === 0 || daily.length === 0) {
    throw new Error("Open-Meteo returned an incomplete forecast.");
  }

  return {
    cityId: city.id,
    current,
    next24Hours,
    daily,
    fetchedAt: Date.now(),
  };
}

function normalizeCurrentWeather(
  current: OpenMeteoCurrent | undefined,
  precipitationProbability: number | null,
): CurrentWeather {
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Open-Meteo returned missing current conditions.");
  }

  const weatherCode = numberOrFallback(current.weather_code, -1);
  const condition = getWeatherCodeInfo(weatherCode);

  return {
    time: stringOrFallback(current.time, ""),
    temperature: current.temperature_2m,
    apparentTemperature: numberOrFallback(current.apparent_temperature, current.temperature_2m),
    weatherCode,
    conditionLabel: condition.label,
    conditionKey: condition.key,
    isDay: current.is_day !== 0,
    windSpeed: numberOrFallback(current.wind_speed_10m, 0),
    humidity: nullableNumber(current.relative_humidity_2m),
    precipitationProbability,
  };
}

function normalizeHourlyForecast(hourly: OpenMeteoHourly | undefined): HourlyForecastPoint[] {
  const times = hourly?.time ?? [];
  const temperatures = hourly?.temperature_2m ?? [];
  const precipitation = hourly?.precipitation_probability ?? [];
  const weatherCodes = hourly?.weather_code ?? [];
  const length = Math.min(times.length, temperatures.length, weatherCodes.length);

  return Array.from({ length }, (_, index) => {
    const weatherCode = numberOrFallback(weatherCodes[index], -1);
    const condition = getWeatherCodeInfo(weatherCode);

    return {
      time: times[index],
      temperature: temperatures[index],
      precipitationProbability: nullableNumber(precipitation[index]),
      weatherCode,
      conditionLabel: condition.label,
      conditionKey: condition.key,
    };
  }).filter((point) => Boolean(point.time) && Number.isFinite(point.temperature));
}

function normalizeDaily(daily: OpenMeteoDaily | undefined): DailyForecastPoint[] {
  const dates = daily?.time ?? [];
  const weatherCodes = daily?.weather_code ?? [];
  const highs = daily?.temperature_2m_max ?? [];
  const lows = daily?.temperature_2m_min ?? [];
  const precipitation = daily?.precipitation_probability_max ?? [];
  const sunrise = daily?.sunrise ?? [];
  const sunset = daily?.sunset ?? [];
  const length = Math.min(dates.length, weatherCodes.length, highs.length, lows.length);

  return Array.from({ length }, (_, index) => {
    const weatherCode = numberOrFallback(weatherCodes[index], -1);
    const condition = getWeatherCodeInfo(weatherCode);

    return {
      date: dates[index],
      weatherCode,
      conditionLabel: condition.label,
      conditionKey: condition.key,
      highTemperature: highs[index],
      lowTemperature: lows[index],
      precipitationProbability: nullableNumber(precipitation[index]),
      sunrise: stringOrNull(sunrise[index]),
      sunset: stringOrNull(sunset[index]),
    };
  }).filter(
    (day) =>
      Boolean(day.date) &&
      Number.isFinite(day.highTemperature) &&
      Number.isFinite(day.lowTemperature),
  );
}

function findCurrentPrecipitation(
  next24Hours: HourlyForecastPoint[],
  currentTime: string | undefined,
): number | null {
  if (next24Hours.length === 0) {
    return null;
  }

  const currentHour = currentTime ? `${currentTime.slice(0, 13)}:00` : "";
  const exact = next24Hours.find((point) => point.time === currentHour);

  return exact?.precipitationProbability ?? next24Hours[0].precipitationProbability;
}

function numberOrFallback(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrFallback(value: string | undefined, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function stringOrNull(value: string | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function buildMissingDataMessage(cityName: string): string {
  return `Weather data for ${cityName} is unavailable right now. Try again in a moment.`;
}

export function formatApiFailureMessage(cityName: string, error: unknown): string {
  const detail = error instanceof Error ? error.message : "The forecast request failed.";
  const suffix = detail.length > 0 ? ` ${detail}` : "";

  return `Could not refresh ${cityName}.${suffix}`;
}
