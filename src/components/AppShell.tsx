import type { ReactNode } from "react";
import { CloudSun } from "lucide-react";
import type { CityConfig } from "../types/weather";
import { CitySelector } from "./CitySelector";

type AppShellProps = {
  cities: CityConfig[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  children: ReactNode;
};

export function AppShell({ cities, selectedCityId, onSelectCity, children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070708] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_-10%,rgba(125,211,252,0.22),transparent_34%),radial-gradient(circle_at_78%_3%,rgba(253,224,71,0.14),transparent_26%),radial-gradient(circle_at_86%_82%,rgba(244,114,182,0.14),transparent_32%),linear-gradient(180deg,rgba(24,24,27,0.9),rgba(9,9,11,0.98))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="min-w-0 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/75 px-2.5 py-1 text-xs font-semibold uppercase text-sky-100 shadow-sm">
                <CloudSun aria-hidden="true" className="h-3.5 w-3.5" />
                Travel forecast
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Weather Board
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                A focused board for saved travel cities, built for fast checks before the day moves.
              </p>
            </div>
          </div>
          <CitySelector cities={cities} selectedCityId={selectedCityId} onSelectCity={onSelectCity} />
        </header>
        <main className="min-w-0 flex-1 py-5">{children}</main>
      </div>
    </div>
  );
}
