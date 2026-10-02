import type { ReactNode } from "react";
import { CloudSun, Star } from "lucide-react";
import type { CityConfig } from "../types/weather";
import { CitySearch } from "./CitySearch";
import { formatLocation } from "../lib/formatting";
export function AppShell({
  favorites,
  recents,
  selected,
  onSelect,
  children,
}: {
  favorites: CityConfig[];
  recents: CityConfig[];
  selected: CityConfig;
  onSelect: (city: CityConfig) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#hourly">
        Skip to hourly forecast
      </a>
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Weather Board home">
            <CloudSun aria-hidden="true" />
            <span>
              Weather<span className="brand-light"> Board</span>
            </span>
            <span className="brand-pixel" aria-hidden="true" />
          </a>
          <CitySearch recents={recents} onSelect={onSelect} />
        </div>
      </header>
      <div className="board" id="top">
        <nav className="favorites-bar" aria-label="Favorite places">
          <span className="favorites-label">
            <Star size={13} aria-hidden="true" /> Favorites
          </span>
          <div className="favorites-scroll">
            {favorites.map((city) => (
              <button
                key={city.id}
                type="button"
                className="favorite-chip"
                aria-current={selected.id === city.id ? "location" : undefined}
                title={`${city.name}, ${formatLocation(city)}`}
                onClick={() => onSelect(city)}
              >
                {city.name}
              </button>
            ))}
            {!favorites.length && (
              <span className="muted">
                Save a place with the star beside its name.
              </span>
            )}
          </div>
        </nav>
        <main>{children}</main>
        <footer className="site-footer">
          <span>
            Weather by{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>{" "}
            ·{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
          </span>
          <span>
            Location data by{" "}
            <a
              href="https://www.geonames.org/"
              target="_blank"
              rel="noreferrer"
            >
              GeoNames
            </a>{" "}
            · Times are local to each place · °F / mph
          </span>
        </footer>
      </div>
    </div>
  );
}
