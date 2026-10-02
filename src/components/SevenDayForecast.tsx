import { ArrowUpRight, Droplets } from "lucide-react";
import type { CityWeather } from "../types/weather";
import {
  dateTitle,
  formatDateLabel,
  formatPrecipitation,
  formatTemperature,
} from "../lib/formatting";
import { PixelWeatherGlyph } from "./PixelWeatherArt";
export function SevenDayForecast({
  weather,
  today,
  onDate,
}: {
  weather: CityWeather;
  today: string;
  onDate: (date: string) => void;
}) {
  const days = weather.daily.filter((d) => d.date >= today).slice(0, 7);
  return (
    <aside className="week-panel panel" aria-labelledby="week-title">
      <div className="section-heading">
        <h2 id="week-title">7-day outlook</h2>
        <ArrowUpRight size={18} aria-hidden="true" />
      </div>
      <p className="muted week-intro">Choose a day to see its hours.</p>
      {days.map((d) => (
        <button
          type="button"
          className="day-button"
          key={d.date}
          aria-label={`Hourly forecast for ${formatDateLabel(d.date)}`}
          onClick={() => onDate(d.date)}
        >
          <span className="day-date">
            <strong>{dateTitle(d.date, today)}</strong>
            <small>{formatDateLabel(d.date)}</small>
          </span>
          <PixelWeatherGlyph
            condition={d.conditionKey}
            size="sm"
            label={d.conditionLabel}
          />
          <span className="day-temperatures">
            <strong>{formatTemperature(d.highTemperature)}</strong>
            <span>{formatTemperature(d.lowTemperature)}</span>
          </span>
          <span className="rain-chance">
            <Droplets size={12} aria-hidden="true" />
            {formatPrecipitation(d.precipitationProbability)}
          </span>
        </button>
      ))}
      {!days.length && (
        <p className="empty-state">
          Daily outlook unavailable. Hourly data may still be available.
        </p>
      )}
      <p className="week-note">
        Daily high / low · Maximum precipitation chance
      </p>
    </aside>
  );
}
