import { Activity } from "lucide-react";
import type { CityConfig, HourlyForecastPoint } from "../types/weather";
import { formatApiTimeLabel, formatPrecipitation, formatTemperature } from "../lib/formatting";
import { PixelWeatherGlyph } from "./PixelWeatherArt";

type HourlyForecastProps = {
  city: CityConfig;
  points: HourlyForecastPoint[];
};

export function HourlyForecast({ city, points }: HourlyForecastProps) {
  const temperatures = points.map((point) => point.temperature);
  const min = Math.min(...temperatures);
  const max = Math.max(...temperatures);

  return (
    <section className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Next 24 Hours</h2>
          <p className="mt-1 text-sm text-zinc-400">Temperature and precipitation by hour.</p>
        </div>
        <Activity aria-hidden="true" className="h-5 w-5 text-amber-100" />
      </div>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex min-w-max items-end gap-2">
          {points.map((point) => (
            <HourlyPoint key={point.time} city={city} point={point} min={min} max={max} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HourlyPoint({
  city,
  point,
  min,
  max,
}: {
  city: CityConfig;
  point: HourlyForecastPoint;
  min: number;
  max: number;
}) {
  const range = Math.max(max - min, 1);
  const height = 34 + ((point.temperature - min) / range) * 58;

  return (
    <article className="flex w-[72px] shrink-0 flex-col items-center rounded-lg border border-zinc-800 bg-zinc-900/55 px-2 py-3">
      <p className="text-[11px] font-medium text-zinc-500">{formatApiTimeLabel(point.time, city.timezone)}</p>
      <div className="mt-3 flex h-28 items-end">
        <div
          className="w-3 rounded-full bg-gradient-to-t from-sky-300 via-amber-200 to-pink-300 shadow-[0_0_22px_rgba(125,211,252,0.2)]"
          style={{ height }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-sm font-semibold tracking-tight text-white">
        {formatTemperature(point.temperature)}
      </p>
      <div className="mt-2 rounded border border-zinc-800 bg-zinc-950/70 p-1">
        <PixelWeatherGlyph condition={point.conditionKey} size="sm" label={point.conditionLabel} />
      </div>
      <p className="mt-1 text-[11px] font-medium text-sky-100">
        {formatPrecipitation(point.precipitationProbability)}
      </p>
    </article>
  );
}
