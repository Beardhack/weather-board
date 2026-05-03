import { CalendarDays, Umbrella } from "lucide-react";
import type { CityWeather } from "../types/weather";
import { formatDateLabel, formatDayLabel, formatPrecipitation, formatTemperature } from "../lib/formatting";
import { PixelWeatherGlyph } from "./PixelWeatherArt";

type SevenDayForecastProps = {
  weather: CityWeather;
};

export function SevenDayForecast({ weather }: SevenDayForecastProps) {
  return (
    <section className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">7-Day Forecast</h2>
          <p className="mt-1 text-sm text-zinc-400">Daily highs, lows, and precipitation.</p>
        </div>
        <CalendarDays aria-hidden="true" className="h-5 w-5 text-rose-100" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {weather.daily.map((day) => (
          <article key={day.date} className="rounded-lg border border-zinc-800 bg-zinc-900/55 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{formatDayLabel(day.date)}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{formatDateLabel(day.date)}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-1.5">
                <PixelWeatherGlyph condition={day.conditionKey} size="sm" label={day.conditionLabel} />
              </div>
            </div>
            <p className="mt-4 min-h-10 text-sm font-medium leading-5 text-zinc-300">{day.conditionLabel}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-white">
                  {formatTemperature(day.highTemperature)}
                </p>
                <p className="text-sm text-zinc-500">{formatTemperature(day.lowTemperature)} low</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-sky-100/15 bg-sky-100/10 px-2 py-1 text-xs font-semibold text-sky-100">
                <Umbrella aria-hidden="true" className="h-3.5 w-3.5" />
                {formatPrecipitation(day.precipitationProbability)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
