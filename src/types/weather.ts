export type CityConfig = {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
};
export type WeatherConditionKey =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm"
  | "unknown";
export type Conditions = {
  temperature: number | null;
  apparentTemperature: number | null;
  weatherCode: number | null;
  conditionLabel: string;
  conditionKey: WeatherConditionKey;
  isDay: boolean | null;
  windSpeed: number | null;
  humidity: number | null;
};
export type CurrentWeather = Conditions & { time: number | null };
export type HourlyForecastPoint = Conditions & {
  /** UTC epoch milliseconds. Precipitation and gusts cover the hour ENDING here. */
  time: number;
  precipitationProbability: number | null;
  precipitationAmount: number | null;
  windGusts: number | null;
};
export type DailyForecastPoint = {
  date: string;
  weatherCode: number | null;
  conditionLabel: string;
  conditionKey: WeatherConditionKey;
  highTemperature: number | null;
  lowTemperature: number | null;
  precipitationProbability: number | null;
  sunrise: number | null;
  sunset: number | null;
};
export type CityWeather = {
  cityId: string;
  current: CurrentWeather;
  hourly: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
  /** Retrieval time, not weather model issuance time. */
  fetchedAt: number;
};
export type WeatherLoadState = {
  status: "idle" | "loading" | "success" | "error";
  data: CityWeather | null;
  isRefreshing: boolean;
  error: string | null;
};
