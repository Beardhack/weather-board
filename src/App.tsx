import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ErrorState } from "./components/ErrorState";
import { HourlyForecast, NextHours } from "./components/HourlyForecast";
import { LoadingState } from "./components/LoadingState";
import { SevenDayForecast } from "./components/SevenDayForecast";
import { WeatherHero } from "./components/WeatherHero";
import { browserStorage } from "./lib/cache";
import { localDate, type ForecastView } from "./lib/formatting";
import {
  FAVORITE_LIMIT,
  loadPreferences,
  savePreferences,
  toggleFavorite,
  visitLocation,
} from "./lib/locations";
import { useWeather } from "./lib/useWeather";
import type { CityConfig } from "./types/weather";
const unavailableStorage = {
  getItem: () => null,
  setItem: () => {
    throw new Error("Storage unavailable");
  },
};
function App() {
  const [preferences, setPreferences] = useState(() =>
    loadPreferences(browserStorage() ?? unavailableStorage),
  );
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [view, setView] = useState<ForecastView>("next48");
  const city = preferences.selected;
  const weather = useWeather(city);
  useEffect(() => {
    setStorageAvailable(
      savePreferences(browserStorage() ?? unavailableStorage, preferences),
    );
  }, [preferences]);
  const selectCity = (next: CityConfig) =>
    setPreferences((p) => visitLocation(p, next));
  const selectDate = (date: string) => {
    setView(`date:${date}`);
    document.getElementById("hourly")?.focus({ preventScroll: true });
    document
      .getElementById("hourly")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <AppShell
      favorites={preferences.favorites}
      recents={preferences.recents}
      selected={city}
      onSelect={selectCity}
    >
      {!storageAvailable && (
        <p className="storage-notice" role="status">
          Browser storage is unavailable. Your places will be kept for this
          visit only.
        </p>
      )}
      {weather.data ? (
        <>
          <WeatherHero
            city={city}
            weather={weather.data}
            now={weather.now}
            isStale={weather.isStale}
            isRefreshing={weather.isRefreshing}
            online={weather.online}
            error={weather.error}
            saved={preferences.favorites.some((c) => c.id === city.id)}
            canSave={preferences.favorites.length < FAVORITE_LIMIT}
            onSave={() => setPreferences((p) => toggleFavorite(p, city))}
            onRefresh={weather.refresh}
          />
          <div className="forecast-layout">
            <div className="forecast-main">
              <NextHours city={city} weather={weather.data} now={weather.now} />
              <HourlyForecast
                city={city}
                weather={weather.data}
                now={weather.now}
                view={view}
                onView={setView}
              />
            </div>
            <SevenDayForecast
              weather={weather.data}
              today={localDate(weather.now, city.timezone)}
              onDate={selectDate}
            />
          </div>
        </>
      ) : weather.status === "error" ? (
        <ErrorState
          title={
            weather.online
              ? `Weather unavailable for ${city.name}`
              : `You're offline · ${city.name}`
          }
          message={
            weather.error ?? "No saved forecast is available for this place."
          }
          onRetry={weather.refresh}
        />
      ) : (
        <LoadingState title={`Loading ${city.name}`} />
      )}
    </AppShell>
  );
}
export default App;
