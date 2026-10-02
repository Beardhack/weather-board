import { useEffect, useState, useSyncExternalStore } from "react";
import type { CityConfig } from "../types/weather";
import { isWeatherFresh, WEATHER_CACHE_TTL_MS } from "./cache";
import { weatherStore, type WeatherStore } from "./weatherStore";
export function useWeather(
  city: CityConfig,
  store: WeatherStore = weatherStore,
) {
  const state = useSyncExternalStore(store.subscribe, () => store.get(city));
  const [now, setNow] = useState(Date.now);
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    store.activate(city);
    const check = (force = false) => {
      setNow(Date.now());
      setOnline(navigator.onLine);
      if (document.visibilityState !== "hidden")
        void store.load(city, force, navigator.onLine);
    };
    const onReturn = () => check();
    const onReconnect = () => check(true);
    check();
    const timer = setInterval(onReturn, 30_000);
    window.addEventListener("focus", onReturn);
    window.addEventListener("online", onReconnect);
    window.addEventListener("offline", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("online", onReconnect);
      window.removeEventListener("offline", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [city, store]);
  useEffect(() => {
    if (!state.data) return;
    setNow(Date.now());
    const remaining = state.data.fetchedAt + WEATHER_CACHE_TTL_MS - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => {
      setNow(Date.now());
      if (document.visibilityState !== "hidden")
        void store.load(city, false, navigator.onLine);
    }, remaining);
    return () => clearTimeout(timer);
  }, [city, state.data, store]);
  return {
    ...state,
    now,
    online,
    isStale: !isWeatherFresh(state.data, now),
    refresh: () => {
      setNow(Date.now());
      void store.load(city, true, navigator.onLine);
    },
  };
}
