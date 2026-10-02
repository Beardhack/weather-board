import { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WeatherStore,
  REQUEST_TIMEOUT_MS,
  RETRY_DELAY_MS,
} from "../../src/lib/weatherStore";
import { WEATHER_CACHE_TTL_MS } from "../../src/lib/cache";
import { useWeather } from "../../src/lib/useWeather";
import { CITIES } from "../../src/data/cities";
import { city, deferred, forecast, NOW } from "../fixtures";
import type { CityWeather } from "../../src/types/weather";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("forecast request lifecycle", () => {
  it("deduplicates concurrent requests and reuses fresh data", async () => {
    const pending = deferred<CityWeather>();
    const fetch = vi.fn().mockReturnValue(pending.promise);
    const write = vi.fn();
    const store = new WeatherStore({ fetch, read: () => null, write });
    const first = store.load(city);
    const second = store.load(city, true);
    expect(first).toBe(second);
    expect(fetch).toHaveBeenCalledTimes(1);
    pending.resolve(forecast());
    await first;
    expect(write).toHaveBeenCalledTimes(1);
    await store.load(city);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("retains last good in-memory data on failure even without persistent storage", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(forecast())
      .mockRejectedValue(new Error("network"));
    const store = new WeatherStore({
      fetch,
      read: () => null,
      write: () => {},
    });
    await store.load(city);
    await store.load(city, true);
    expect(store.get(city).data).toEqual(forecast());
    expect(store.get(city).error).toContain("network");
    expect(store.get(city).status).toBe("success");
    await store.load(city);
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(RETRY_DELAY_MS);
    await store.load(city);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("does not fetch offline and keeps stale data; no cache gives a retryable error", async () => {
    const fetch = vi.fn();
    const old = forecast(NOW - WEATHER_CACHE_TTL_MS);
    const store = new WeatherStore({ fetch, read: () => old });
    await store.load(city, false, false);
    expect(fetch).not.toHaveBeenCalled();
    expect(store.get(city).data).toEqual(old);
    expect(store.get(city).error).toContain("offline");
    const empty = new WeatherStore({ fetch, read: () => null });
    await empty.load(city, false, false);
    expect(empty.get(city).status).toBe("error");
  });
  it("ignores superseded forecast responses and aborts when switching cities", async () => {
    const old = deferred<CityWeather>();
    const next = deferred<CityWeather>();
    const fetch = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(next.promise);
    const store = new WeatherStore({
      fetch,
      read: () => null,
      write: () => {},
    });
    const a = store.load(city);
    store.activate(CITIES[1]);
    const b = store.load(CITIES[1]);
    expect(fetch.mock.calls[0][1].aborted).toBe(true);
    next.resolve({ ...forecast(), cityId: CITIES[1].id });
    await b;
    old.resolve(forecast());
    await a;
    expect(store.get(city).data).toBe(null);
    expect(store.get(CITIES[1]).data?.cityId).toBe(CITIES[1].id);
  });
  it("times out stalled fetches and permits retry", async () => {
    const fetch = vi.fn(
      (_city, signal: AbortSignal) =>
        new Promise<CityWeather>((_resolve, reject) =>
          signal.addEventListener("abort", () => reject(new Error("aborted"))),
        ),
    );
    const store = new WeatherStore({ fetch, read: () => null });
    const pending = store.load(city);
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await pending;
    expect(store.get(city).error).toContain("timed out");
    expect(store.get(city).isRefreshing).toBe(false);
  });
  it("refreshes exhausted hourly data despite a recent retrieval", async () => {
    const old = {
      ...forecast(),
      hourly: [{ ...forecast().hourly[0], time: NOW - 1 }],
    };
    const fetch = vi.fn().mockResolvedValue(forecast());
    const store = new WeatherStore({ fetch, read: () => old, write: () => {} });
    await store.load(city);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
describe("visible TTL and return refresh", () => {
  it("refreshes exactly at visible TTL and rolls the clock without a response", async () => {
    const pending = deferred<CityWeather>();
    const fetch = vi.fn().mockReturnValue(pending.promise);
    const store = new WeatherStore({
      fetch,
      read: () => forecast(),
      write: () => {},
    });
    const { result } = renderHook(() => useWeather(city, store));
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(result.current.now).toBe(NOW + 30_000);
    expect(fetch).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(WEATHER_CACHE_TTL_MS - 30_000));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.isStale).toBe(true);
    expect(result.current.isRefreshing).toBe(true);
    await act(async () => pending.resolve(forecast(Date.now())));
    expect(result.current.isStale).toBe(false);
  });
  it("suspends hidden refresh, refreshes on visibility/focus, and deduplicates simultaneous returns", async () => {
    const pending = deferred<CityWeather>();
    const fetch = vi.fn().mockReturnValue(pending.promise);
    const store = new WeatherStore({
      fetch,
      read: () => forecast(),
      write: () => {},
    });
    renderHook(() => useWeather(city, store));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    await act(() => vi.advanceTimersByTimeAsync(WEATHER_CACHE_TTL_MS + 60_000));
    expect(fetch).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(forecast(Date.now())));
  });
  it("reconnects even before TTL, maintains an honest offline status and survives StrictMode", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(forecast(Date.now())));
    const store = new WeatherStore({
      fetch,
      read: () => null,
      write: () => {},
    });
    const { result } = renderHook(() => useWeather(city, store), {
      wrapper: StrictMode,
    });
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(1);
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    act(() => window.dispatchEvent(new Event("offline")));
    expect(result.current.online).toBe(false);
    expect(result.current.data).not.toBe(null);
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    act(() => window.dispatchEvent(new Event("online")));
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe(null);
  });
});
