import type {
  CityConfig,
  CityWeather,
  HourlyForecastPoint,
} from "../types/weather";
import {
  dateTitle,
  formatAmount,
  formatDateLabel,
  formatHour,
  formatHumidity,
  formatLocalTime,
  formatPrecipitation,
  formatTemperature,
  formatWindSpeed,
  groupHours,
  HOUR_MS,
  localDate,
  selectHours,
  type ForecastView,
} from "../lib/formatting";
import { PixelWeatherGlyph } from "./PixelWeatherArt";
import { ChevronDown, Droplets, Wind } from "lucide-react";
export function NextHours({
  city,
  weather,
  now,
}: {
  city: CityConfig;
  weather: CityWeather;
  now: number;
}) {
  const points = selectHours(
    weather.hourly,
    "next48",
    now,
    city.timezone,
  ).slice(0, 6);
  return (
    <section className="next-panel" aria-labelledby="next-title">
      <div className="section-heading">
        <h2 id="next-title">The next few hours</h2>
        <span>At a glance</span>
      </div>
      {points.length ? (
        <div
          className="next-grid"
          role="region"
          aria-label="Next six hours"
          tabIndex={0}
        >
          {points.map((p) => (
            <div className="next-card" key={p.time}>
              <time dateTime={new Date(p.time).toISOString()}>
                {formatLocalTime(city.timezone, p.time)}
              </time>
              <PixelWeatherGlyph
                condition={p.conditionKey}
                isDay={p.isDay}
                size="sm"
                label={p.conditionLabel}
              />
              <strong>{formatTemperature(p.temperature)}</strong>
              <span
                className="rain-chance"
                title="Chance of precipitation in the hour ending at this time"
              >
                <Droplets size={12} aria-hidden="true" />
                {formatPrecipitation(p.precipitationProbability)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          No upcoming hours remain in this saved forecast. Refresh when
          connected.
        </p>
      )}
    </section>
  );
}
export function HourlyForecast({
  city,
  weather,
  now,
  view,
  onView,
}: {
  city: CityConfig;
  weather: CityWeather;
  now: number;
  view: ForecastView;
  onView: (view: ForecastView) => void;
}) {
  const points = selectHours(weather.hourly, view, now, city.timezone);
  const today = localDate(now, city.timezone);
  const dates = [
    ...new Set(weather.hourly.map((p) => localDate(p.time, city.timezone))),
  ].filter((d) => d >= today);
  const selectedDate = view.startsWith("date:") ? view.slice(5) : "";
  if (selectedDate && !dates.includes(selectedDate)) dates.push(selectedDate);
  return (
    <section
      id="hourly"
      className="hourly-panel panel"
      aria-labelledby="hourly-title"
      tabIndex={-1}
    >
      <div className="hourly-heading">
        <div>
          <p className="eyebrow">PLAN YOUR DAY</p>
          <h2 id="hourly-title">Hourly forecast</h2>
        </div>
        <span className="zone-label">{city.timezone.replace(/_/g, " ")}</span>
      </div>
      <div className="forecast-controls">
        <div
          className="view-buttons"
          role="group"
          aria-label="Hourly forecast range"
        >
          {(
            [
              ["next48", "Next 48 hours"],
              ["today", "Today"],
              ["tomorrow", "Tomorrow"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => onView(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="date-picker">
          <span className="sr-only">Choose forecast date</span>
          <select
            value={selectedDate}
            onChange={(event) => {
              if (event.target.value) onView(`date:${event.target.value}`);
            }}
          >
            <option value="" disabled>
              Pick a date
            </option>
            {dates.sort().map((d) => (
              <option value={d} key={d}>
                {formatDateLabel(d)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="hourly-explainer">
        Local times · °F · Select an hour for details. Precipitation chance,
        amount and gusts cover the hour ending at the listed time.{" "}
        <span>— means unavailable.</span>
      </p>
      {view === "next48" && points.length > 0 && points.length < 48 && (
        <p className="range-notice">
          Only {points.length} upcoming hours remain in this forecast.
        </p>
      )}
      <div className="hourly-columns" aria-hidden="true">
        <span>Time</span>
        <span>Conditions</span>
        <span>Temp</span>
        <span>Precip.</span>
        <span>Wind</span>
        <span />
      </div>
      {!points.length && (
        <p className="empty-state">
          No hourly data for this range. Choose another date or refresh the
          forecast.
        </p>
      )}
      {groupHours(points, city.timezone).map(([date, hours]) => (
        <div className="hour-group" key={date}>
          <h3>
            {dateTitle(date, today)} <span>{formatDateLabel(date)}</span>
          </h3>
          {hours.map((point) => (
            <HourlyRow
              key={`${city.id}:${point.time}`}
              point={point}
              city={city}
              past={point.time < now}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
function HourlyRow({
  point: p,
  city,
  past,
}: {
  point: HourlyForecastPoint;
  city: CityConfig;
  past: boolean;
}) {
  return (
    <details className={`hour-row ${past ? "past-hour" : ""}`}>
      <summary>
        <span className="hour-time">
          <time dateTime={new Date(p.time).toISOString()}>
            {formatHour(p.time, city.timezone)}
          </time>
          {past && <small>Earlier</small>}
        </span>
        <span className="hour-condition">
          <PixelWeatherGlyph
            condition={p.conditionKey}
            isDay={p.isDay}
            size="sm"
            label={p.conditionLabel}
          />
          <span>{p.conditionLabel}</span>
        </span>
        <strong className="hour-temp">
          {formatTemperature(p.temperature)}
        </strong>
        <span className="hour-precip">
          <Droplets size={13} aria-hidden="true" />
          {formatPrecipitation(p.precipitationProbability)}
        </span>
        <span className="hour-wind">
          <Wind size={13} aria-hidden="true" />
          {formatWindSpeed(p.windSpeed)}
        </span>
        <ChevronDown size={15} className="row-chevron" aria-hidden="true" />
      </summary>
      <div className="hour-details">
        <p className="interval-note">
          Precipitation & gust interval:{" "}
          {formatHour(p.time - HOUR_MS, city.timezone)} –{" "}
          {formatHour(p.time, city.timezone)}
        </p>
        <dl>
          <div>
            <dt>Feels like</dt>
            <dd>{formatTemperature(p.apparentTemperature)}</dd>
          </div>
          <div>
            <dt>Precip. amount</dt>
            <dd>{formatAmount(p.precipitationAmount)}</dd>
          </div>
          <div>
            <dt>Wind gusts</dt>
            <dd>{formatWindSpeed(p.windGusts)}</dd>
          </div>
          <div>
            <dt>Humidity</dt>
            <dd>{formatHumidity(p.humidity)}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
