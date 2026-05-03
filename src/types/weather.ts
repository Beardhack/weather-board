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

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  conditionLabel: string;
  conditionKey: WeatherConditionKey;
  isDay: boolean;
  windSpeed: number;
  humidity: number | null;
  precipitationProbability: number | null;
};

export type HourlyForecastPoint = {
  time: string;
  temperature: number;
  precipitationProbability: number | null;
  weatherCode: number;
  conditionLabel: string;
  conditionKey: WeatherConditionKey;
};

export type DailyForecastPoint = {
  date: string;
  weatherCode: number;
  conditionLabel: string;
  conditionKey: WeatherConditionKey;
  highTemperature: number;
  lowTemperature: number;
  precipitationProbability: number | null;
  sunrise: string | null;
  sunset: string | null;
};

export type CityWeather = {
  cityId: string;
  current: CurrentWeather;
  next24Hours: HourlyForecastPoint[];
  daily: DailyForecastPoint[];
  fetchedAt: number;
};

export type WeatherCacheEntry = {
  cityId: string;
  data: CityWeather;
  fetchedAt: number;
};

export type WeatherLoadStatus = "idle" | "loading" | "success" | "error";

export type WeatherLoadState = {
  status: WeatherLoadStatus;
  data: CityWeather | null;
  isRefreshing: boolean;
  isStale: boolean;
  error: string | null;
};
