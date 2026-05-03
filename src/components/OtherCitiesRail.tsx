import { ChevronRight, RefreshCw } from "lucide-react";
import type { CityConfig, WeatherLoadState } from "../types/weather";
import { formatLocation, formatTemperature } from "../lib/formatting";
import { PixelWeatherGlyph } from "./PixelWeatherArt";

type OtherCitiesRailProps = {
  cities: CityConfig[];
  selectedCityId: string;
  weatherByCity: Record<string, WeatherLoadState>;
  onSelectCity: (cityId: string) => void;
};

export function OtherCitiesRail({
  cities,
  selectedCityId,
  weatherByCity,
  onSelectCity,
}: OtherCitiesRailProps) {
  const otherCities = cities.filter((city) => city.id !== selectedCityId);

  return (
    <aside className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">Saved Cities</h2>
          <p className="mt-1 text-xs text-zinc-500">Quick glance</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
        {otherCities.map((city) => {
          const state = weatherByCity[city.id];
          const weather = state?.data;

          return (
            <button
              key={city.id}
              className="group min-h-[116px] w-[220px] shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/55 p-3 text-left transition hover:border-sky-100/35 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-100/60 lg:w-full"
              type="button"
              onClick={() => onSelectCity(city.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{city.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{formatLocation(city)}</p>
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-sky-100"
                />
              </div>
              {weather ? (
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-white">
                      {formatTemperature(weather.current.temperature)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-400">
                      {weather.current.conditionLabel}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <PixelWeatherGlyph
                      condition={weather.current.conditionKey}
                      isDay={weather.current.isDay}
                      size="sm"
                      label={weather.current.conditionLabel}
                    />
                    {state.isRefreshing ? (
                      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-sky-100" />
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <div className="h-7 w-14 animate-pulse rounded-full bg-white/10" />
                  <p className="mt-2 text-xs text-zinc-500">
                    {state?.status === "error" ? "Unavailable" : "Loading"}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
