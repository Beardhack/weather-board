import type { CityConfig, HourlyForecastPoint } from "../types/weather";
export const HOUR_MS = 3_600_000;
export type ForecastView = "next48" | "today" | "tomorrow" | `date:${string}`;
export function formatLocation(city: CityConfig): string {
  return [city.region, city.country].filter(Boolean).join(", ");
}
function measurement(
  value: number | null | undefined,
  suffix: string,
  digits = 0,
): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(digits)}${suffix}`
    : "—";
}
export const formatTemperature = (value?: number | null) =>
  measurement(value, "°");
export const formatWindSpeed = (value?: number | null) =>
  measurement(value, " mph");
export const formatPrecipitation = (value?: number | null) =>
  measurement(value, "%");
export const formatHumidity = formatPrecipitation;
export const formatAmount = (value?: number | null) =>
  measurement(value, " in", 2);
export function localDate(value: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function formatLocalTime(
  timeZone: string,
  value: number | Date = new Date(),
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
export function formatHour(time: number, timeZone: string): string {
  // The zone distinguishes repeated hours at the autumn DST change.
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(time);
}
export function formatLocalDateTime(
  timeZone: string,
  value: number | Date,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
export function formatDayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function dateTitle(date: string, today: string): string {
  return date === today
    ? "Today"
    : date === addDays(today, 1)
      ? "Tomorrow"
      : formatDayLabel(date);
}
export function selectHours(
  hourly: HourlyForecastPoint[],
  view: ForecastView,
  now: number,
  timeZone: string,
): HourlyForecastPoint[] {
  if (view === "next48") {
    // Do not round to a UTC hour: some zones have :30/:45 offsets.
    return hourly.filter((p) => p.time >= now && p.time < now + 48 * HOUR_MS);
  }
  const today = localDate(now, timeZone);
  const date =
    view === "today"
      ? today
      : view === "tomorrow"
        ? addDays(today, 1)
        : view.slice(5);
  return hourly.filter((p) => localDate(p.time, timeZone) === date);
}
export function groupHours(
  points: HourlyForecastPoint[],
  timeZone: string,
): [string, HourlyForecastPoint[]][] {
  const groups = new Map<string, HourlyForecastPoint[]>();
  for (const point of points) {
    const date = localDate(point.time, timeZone);
    groups.set(date, [...(groups.get(date) ?? []), point]);
  }
  return [...groups];
}
