import { MapPin } from "lucide-react";
import type { CityConfig } from "../types/weather";
import { formatLocation } from "../lib/formatting";

type CitySelectorProps = {
  cities: CityConfig[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
};

export function CitySelector({ cities, selectedCityId, onSelectCity }: CitySelectorProps) {
  return (
    <nav aria-label="Saved cities" className="min-w-0 pb-1">
      <div className="grid min-w-0 grid-cols-2 gap-1.5 rounded-lg border border-zinc-800/90 bg-zinc-950/75 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:flex sm:flex-wrap">
        {cities.map((city) => {
          const isSelected = city.id === selectedCityId;

          return (
            <button
              key={city.id}
              className={[
                "group flex min-h-10 min-w-0 items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-100/60 sm:px-3 lg:px-3.5",
                isSelected
                  ? "bg-zinc-100 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white",
              ].join(" ")}
              type="button"
              aria-current={isSelected ? "page" : undefined}
              onClick={() => onSelectCity(city.id)}
              title={`${city.name}, ${formatLocation(city)}`}
            >
              <MapPin
                aria-hidden="true"
                className={[
                  "h-4 w-4 shrink-0",
                  isSelected ? "text-sky-700" : "text-zinc-600 group-hover:text-sky-200",
                ].join(" ")}
              />
              <span className="min-w-0 truncate sm:whitespace-nowrap">{city.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
