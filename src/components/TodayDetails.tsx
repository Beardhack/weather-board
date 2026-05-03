import { Droplets, Gauge, Sunrise, Sunset, Thermometer, Umbrella, Wind } from "lucide-react";
import type { ReactNode } from "react";
import type { CityConfig, CityWeather } from "../types/weather";
import {
  formatApiTimeLabel,
  formatHumidity,
  formatPrecipitation,
  formatTemperature,
  formatWindSpeed,
} from "../lib/formatting";

type TodayDetailsProps = {
  city: CityConfig;
  weather: CityWeather;
};

export function TodayDetails({ city, weather }: TodayDetailsProps) {
  const today = weather.daily[0];
  const current = weather.current;

  return (
    <section className="rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Today</h2>
          <p className="mt-1 text-sm text-zinc-400">{current.conditionLabel}</p>
        </div>
        <Gauge aria-hidden="true" className="h-5 w-5 text-sky-100" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DetailItem
          icon={<Thermometer aria-hidden="true" className="h-4 w-4" />}
          label="High / Low"
          value={`${formatTemperature(today?.highTemperature)} / ${formatTemperature(today?.lowTemperature)}`}
        />
        <DetailItem
          icon={<Umbrella aria-hidden="true" className="h-4 w-4" />}
          label="Precipitation"
          value={formatPrecipitation(today?.precipitationProbability)}
        />
        <DetailItem
          icon={<Wind aria-hidden="true" className="h-4 w-4" />}
          label="Wind"
          value={formatWindSpeed(current.windSpeed)}
        />
        <DetailItem
          icon={<Droplets aria-hidden="true" className="h-4 w-4" />}
          label="Humidity"
          value={formatHumidity(current.humidity)}
        />
        <DetailItem
          icon={<Sunrise aria-hidden="true" className="h-4 w-4" />}
          label="Sunrise"
          value={today?.sunrise ? formatApiTimeLabel(today.sunrise, city.timezone) : "-"}
        />
        <DetailItem
          icon={<Sunset aria-hidden="true" className="h-4 w-4" />}
          label="Sunset"
          value={today?.sunset ? formatApiTimeLabel(today.sunset, city.timezone) : "-"}
        />
      </div>
    </section>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/55 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span className="text-sky-100">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
