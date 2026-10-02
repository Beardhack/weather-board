import type {
  CityConfig,
  CityWeather,
  WeatherLoadState,
} from "../types/weather";
import {
  CACHE_LIMIT,
  getWeatherCache,
  isWeatherFresh,
  locationKey,
  setWeatherCache,
} from "./cache";
import { fetchCityWeather } from "./openMeteo";
export const RETRY_DELAY_MS = 60_000;
export const REQUEST_TIMEOUT_MS = 20_000;
type Request = { controller: AbortController; promise: Promise<void> };
type Options = {
  fetch?: typeof fetchCityWeather;
  now?: () => number;
  read?: (city: CityConfig) => CityWeather | null;
  write?: (city: CityConfig, data: CityWeather) => void;
};
export class WeatherStore {
  private states = new Map<string, WeatherLoadState>();
  private requests = new Map<string, Request>();
  private attempts = new Map<string, number>();
  private listeners = new Set<() => void>();
  private fetcher: typeof fetchCityWeather;
  private now: () => number;
  private read: (city: CityConfig) => CityWeather | null;
  private write: (city: CityConfig, data: CityWeather) => void;
  constructor(options: Options = {}) {
    this.fetcher = options.fetch ?? fetchCityWeather;
    this.now = options.now ?? Date.now;
    this.read = options.read ?? getWeatherCache;
    this.write = options.write ?? setWeatherCache;
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  get(city: CityConfig): WeatherLoadState {
    const key = locationKey(city);
    if (!this.states.has(key)) {
      const data = this.read(city);
      this.states.set(key, {
        data,
        status: data ? "success" : "idle",
        isRefreshing: false,
        error: null,
      });
      for (const old of this.states.keys()) {
        if (this.states.size <= CACHE_LIMIT) break;
        if (old !== key && !this.requests.has(old)) {
          this.states.delete(old);
          this.attempts.delete(old);
        }
      }
    }
    return this.states.get(key)!;
  }
  private update(city: CityConfig, value: WeatherLoadState) {
    this.states.set(locationKey(city), value);
    this.listeners.forEach((listener) => listener());
  }
  activate(city: CityConfig) {
    // Only the selected forecast is requested; rapidly switching cannot fan out.
    for (const [key, request] of this.requests) {
      if (key === locationKey(city)) continue;
      this.requests.delete(key);
      request.controller.abort();
      this.attempts.delete(key);
      const old = this.states.get(key);
      if (old)
        this.states.set(key, {
          ...old,
          isRefreshing: false,
          status: old.data ? "success" : "idle",
        });
    }
  }
  load(city: CityConfig, force = false, online = true): Promise<void> {
    const key = locationKey(city);
    const active = this.requests.get(key);
    if (active) return active.promise;
    const previous = this.get(city);
    if (!online) {
      this.update(city, {
        ...previous,
        status: previous.data ? "success" : "error",
        isRefreshing: false,
        error: "You're offline. Reconnect to retrieve a forecast.",
      });
      return Promise.resolve();
    }
    if (!force && isWeatherFresh(previous.data, this.now()) && !previous.error)
      return Promise.resolve();
    if (
      !force &&
      this.now() - (this.attempts.get(key) ?? -Infinity) < RETRY_DELAY_MS
    )
      return Promise.resolve();
    this.attempts.set(key, this.now());
    const controller = new AbortController();
    const request: Request = { controller, promise: Promise.resolve() };
    this.requests.set(key, request);
    this.update(city, {
      ...previous,
      status: previous.data ? "success" : "loading",
      isRefreshing: true,
      error: null,
    });
    request.promise = (async () => {
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const data = await this.fetcher(city, controller.signal);
        if (this.requests.get(key) !== request) return;
        this.write(city, data);
        this.update(city, {
          data,
          status: "success",
          isRefreshing: false,
          error: null,
        });
      } catch (error) {
        if (this.requests.get(key) !== request) return;
        const detail = controller.signal.aborted
          ? "The request timed out."
          : error instanceof Error
            ? error.message
            : "The request failed.";
        this.update(city, {
          ...previous,
          status: previous.data ? "success" : "error",
          isRefreshing: false,
          error: `Could not refresh ${city.name}. ${detail}`,
        });
      } finally {
        clearTimeout(timeout);
        if (this.requests.get(key) === request) this.requests.delete(key);
      }
    })();
    return request.promise;
  }
}
export const weatherStore = new WeatherStore();
