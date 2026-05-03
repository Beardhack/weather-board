import { Clock, MapPin, RefreshCw, ThermometerSun, Umbrella } from "lucide-react";
import type { ReactNode } from "react";
import type { CityConfig, CityWeather } from "../types/weather";
import {
  formatLocalDateTime,
  formatLocalTime,
  formatLocation,
  formatPrecipitation,
  formatTemperature,
} from "../lib/formatting";
import { StaleDataBadge } from "./StaleDataBadge";
import { PixelWeatherGlyph, PixelWeatherScene } from "./PixelWeatherArt";

type WeatherHeroProps = {
  city: CityConfig;
  weather: CityWeather;
  isStale: boolean;
  isRefreshing: boolean;
  staleMessage?: string | null;
};

export function WeatherHero({
  city,
  weather,
  isStale,
  isRefreshing,
  staleMessage,
}: WeatherHeroProps) {
  const current = weather.current;

  return (
    <section className="relative overflow-hidden rounded-lg border border-zinc-800/90 bg-zinc-950/75 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(125,211,252,0.18),transparent_30%),radial-gradient(circle_at_82%_4%,rgba(253,224,71,0.14),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />

      <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700/80 bg-zinc-950/70 px-2.5 py-1 text-xs font-medium text-zinc-300">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-sky-200" />
                {formatLocation(city)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700/80 bg-zinc-950/70 px-2.5 py-1 text-xs font-medium text-zinc-300">
                <Clock aria-hidden="true" className="h-3.5 w-3.5 text-amber-200" />
                {formatLocalTime(city.timezone)}
              </span>
              {isStale || isRefreshing ? (
                <StaleDataBadge isRefreshing={isRefreshing} message={staleMessage} />
              ) : null}
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium uppercase text-zinc-500">Now in</p>
              <h2 className="mt-1 max-w-[12ch] text-balance text-4xl font-semibold leading-[0.98] tracking-tight text-white sm:text-5xl lg:max-w-none lg:text-6xl">
                {city.name}
              </h2>

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div className="flex min-w-0 items-center gap-3 text-base font-medium text-zinc-300">
                  <PixelWeatherGlyph
                    condition={current.conditionKey}
                    isDay={current.isDay}
                    size="sm"
                    label={current.conditionLabel}
                  />
                  <span className="min-w-0">{current.conditionLabel}</span>
                </div>

                <div className="flex items-center gap-3 xl:justify-end">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/80 shadow-inner sm:h-24 sm:w-24">
                    <PixelWeatherGlyph
                      condition={current.conditionKey}
                      isDay={current.isDay}
                      size="md"
                      label={current.conditionLabel}
                    />
                  </div>
                  <p className="text-6xl font-semibold leading-none tracking-tight text-white sm:text-8xl">
                    {formatTemperature(current.temperature)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <HeroLine
              icon={<ThermometerSun aria-hidden="true" className="h-4 w-4" />}
              label="Feels like"
              value={formatTemperature(current.apparentTemperature)}
            />
            <HeroLine
              icon={<Umbrella aria-hidden="true" className="h-4 w-4" />}
              label="Precipitation now"
              value={formatPrecipitation(current.precipitationProbability)}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4">
          <PixelWeatherScene
            condition={current.conditionKey}
            isDay={current.isDay}
            label={`${current.conditionLabel} in ${city.name}`}
          />
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-500">Last updated</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {formatLocalDateTime(city.timezone, weather.fetchedAt)}
                </p>
              </div>
              <RefreshCw
                aria-hidden="true"
                className={["h-5 w-5 text-sky-100", isRefreshing ? "animate-spin" : ""].join(" ")}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <HeroStat
                label="Humidity"
                value={current.humidity === null ? "-" : `${Math.round(current.humidity)}%`}
              />
              <HeroStat label="Wind" value={`${Math.round(current.windSpeed)} mph`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-400">
        <span className="text-sky-100">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="shrink-0 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
