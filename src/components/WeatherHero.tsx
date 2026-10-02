import { RefreshCw, Star } from "lucide-react";
import type { CityConfig, CityWeather } from "../types/weather";
import {
  formatHumidity,
  formatLocalDateTime,
  formatLocalTime,
  formatLocation,
  formatTemperature,
  formatWindSpeed,
} from "../lib/formatting";
import { PixelWeatherScene } from "./PixelWeatherArt";
export function WeatherHero({
  city,
  weather,
  now,
  isStale,
  isRefreshing,
  online,
  error,
  saved,
  canSave,
  onSave,
  onRefresh,
}: {
  city: CityConfig;
  weather: CityWeather;
  now: number;
  isStale: boolean;
  isRefreshing: boolean;
  online: boolean;
  error: string | null;
  saved: boolean;
  canSave: boolean;
  onSave: () => void;
  onRefresh: () => void;
}) {
  const current = weather.current;
  const status = !online
    ? "Offline · saved forecast"
    : isStale
      ? "Stale forecast"
      : error
        ? "Refresh failed · saved forecast"
        : "Forecast retrieved";
  return (
    <section className="current-panel panel" aria-labelledby="place-name">
      <div className="current-main">
        <div className="eyebrow">YOUR WEATHER, HOUR BY HOUR</div>
        <div className="place-title">
          <h1 id="place-name">{city.name}</h1>
          <button
            type="button"
            className={`save-button ${saved ? "saved" : ""}`}
            aria-label={
              saved
                ? `Remove ${city.name} from favorites`
                : `Save ${city.name} to favorites`
            }
            aria-pressed={saved}
            disabled={!saved && !canSave}
            title={
              !saved && !canSave
                ? "24 favorites saved. Remove one to make room."
                : undefined
            }
            onClick={onSave}
          >
            <Star
              size={20}
              fill={saved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        </div>
        <p className="location-line">
          {formatLocation(city)} <span aria-hidden="true">·</span>{" "}
          <time>{formatLocalTime(city.timezone, now)} local</time>
        </p>
        <div className="current-reading">
          <strong className="temperature">
            {formatTemperature(current.temperature)}
            <small>F</small>
          </strong>
          <div>
            <p className="current-condition">{current.conditionLabel}</p>
            <p className="muted">
              Feels like {formatTemperature(current.apparentTemperature)}
            </p>
          </div>
        </div>
        <p className="current-metrics">
          Wind <strong>{formatWindSpeed(current.windSpeed)}</strong>
          <span>
            Humidity <strong>{formatHumidity(current.humidity)}</strong>
          </span>
        </p>
      </div>
      <div className="current-art">
        <PixelWeatherScene
          condition={current.conditionKey}
          isDay={current.isDay}
          label={`${current.conditionLabel} in ${city.name}`}
        />
      </div>
      <div className="freshness-row">
        <div className="freshness-copy">
          <p
            role="status"
            className={!online || isStale || error ? "status-warning" : "muted"}
          >
            <span className="status-dot" aria-hidden="true" />
            {isRefreshing ? `${status} · refreshing…` : status} ·{" "}
            {formatLocalDateTime(city.timezone, weather.fetchedAt)}
          </p>
          <details className="data-note">
            <summary>About this forecast</summary>
            <p>
              Retrieved from Open-Meteo at the time above; this is not a model
              issuance time. Model issuance is not supplied by this endpoint.{" "}
              {current.time
                ? `Conditions are modeled for ${formatLocalDateTime(city.timezone, current.time)}.`
                : "Current conditions are unavailable."}
            </p>
          </details>
          {error && (
            <p className="refresh-error">
              {error}{" "}
              {weather ? "Your last retrieved forecast is still shown." : ""}
            </p>
          )}
        </div>
        <button
          className="refresh-button"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || !online}
        >
          <RefreshCw
            size={14}
            className={isRefreshing ? "animate-spin" : ""}
            aria-hidden="true"
          />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>
    </section>
  );
}
