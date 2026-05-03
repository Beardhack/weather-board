import type { CityConfig, DailyForecastPoint, HourlyForecastPoint } from "../types/weather";

export function formatLocation(city: CityConfig): string {
  return [city.region, city.country].filter(Boolean).join(", ");
}

export function formatTemperature(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value)}°`;
}

export function formatWindSpeed(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value)} mph`;
}

export function formatPrecipitation(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value)}%`;
}

export function formatHumidity(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value)}%`;
}

export function formatLocalTime(timeZone: string, value: number | Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatLocalDateTime(timeZone: string, value: number | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatApiTimeLabel(time: string, _timeZone: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(time);

  if (!match) {
    return "-";
  }

  const [, hours, minutes] = match;
  const date = new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes)));

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDayLabel(dateString: string): string {
  const date = parseDateOnly(dateString);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
}

export function formatDateLabel(dateString: string): string {
  const date = parseDateOnly(dateString);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function selectNext24Hours(
  hourly: HourlyForecastPoint[],
  currentTime: string | null | undefined,
): HourlyForecastPoint[] {
  if (hourly.length === 0) {
    return [];
  }

  const currentHour = currentTime ? `${currentTime.slice(0, 13)}:00` : "";
  const index = hourly.findIndex((point) => point.time >= currentHour);
  const startIndex = index >= 0 ? index : 0;

  return hourly.slice(startIndex, startIndex + 24);
}

export function normalizeDailyForecast(days: DailyForecastPoint[]): DailyForecastPoint[] {
  return days.slice(0, 7);
}

function parseDateOnly(dateString: string): Date | null {
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, 12));
}
