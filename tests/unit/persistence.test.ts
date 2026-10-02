import { describe, expect, it } from "vitest";
import { CITIES } from "../../src/data/cities";
import {
  FAVORITE_LIMIT,
  loadPreferences,
  PREFERENCES_KEY,
  RECENT_LIMIT,
  savePreferences,
  toggleFavorite,
  visitLocation,
} from "../../src/lib/locations";
import {
  CACHE_LIMIT,
  CACHE_PREFIX,
  getWeatherCache,
  isWeatherFresh,
  locationKey,
  setWeatherCache,
  WEATHER_CACHE_TTL_MS,
} from "../../src/lib/cache";
import { city, forecast, memoryStorage, NOW } from "../fixtures";
describe("preferences migration and bounds", () => {
  it.each(CITIES.map((c) => [c.id]))(
    "preserves legacy selection %s and all seven original favorites",
    (id) => {
      const storage = memoryStorage();
      storage.setItem("weather-board:selected-city", id);
      const p = loadPreferences(storage);
      expect(p.selected.id).toBe(id);
      expect(p.favorites).toEqual(CITIES);
      savePreferences(storage, p);
      expect(loadPreferences(storage)).toEqual(p);
    },
  );
  it("retains unsaved selection, optional empty favorites and bounded ordered recents", () => {
    const storage = memoryStorage();
    let p = loadPreferences(storage);
    for (const c of CITIES) p = toggleFavorite(p, c);
    for (let i = 0; i < 20; i++)
      p = visitLocation(p, { ...city, id: String(i) });
    expect(p.recents).toHaveLength(RECENT_LIMIT);
    expect(p.selected.id).toBe("19");
    expect(p.favorites).toEqual([]);
    p = visitLocation(p, p.recents[3]);
    expect(p.recents.filter((c) => c.id === p.selected.id)).toHaveLength(1);
    savePreferences(storage, p);
    expect(loadPreferences(storage)).toEqual(p);
  });
  it("caps favorites and survives corruption and denied storage", () => {
    const storage = memoryStorage();
    let p = loadPreferences(storage);
    for (let i = 0; i < 50; i++)
      p = toggleFavorite(p, { ...city, id: String(i) });
    expect(p.favorites).toHaveLength(FAVORITE_LIMIT);
    storage.setItem(PREFERENCES_KEY, "{broken");
    expect(loadPreferences(storage).favorites).toEqual(CITIES);
    const denied = {
      getItem: () => {
        throw new Error();
      },
      setItem: () => {
        throw new Error();
      },
    };
    expect(loadPreferences(denied).selected).toEqual(city);
    expect(savePreferences(denied, p)).toBe(false);
  });
});
describe("separately versioned weather cache", () => {
  it("expires at TTL, rejects future timestamps, and marks exhausted hourly data stale", () => {
    const data = forecast();
    expect(isWeatherFresh(data, NOW)).toBe(true);
    expect(isWeatherFresh(data, NOW + WEATHER_CACHE_TTL_MS)).toBe(false);
    expect(isWeatherFresh(data, NOW - 1)).toBe(false);
    expect(
      isWeatherFresh(
        { ...data, hourly: [{ ...data.hourly[0], time: NOW - 1 }] },
        NOW,
      ),
    ).toBe(false);
  });
  it("ignores old sliced caches and invalid normalized data without touching preferences", () => {
    const storage = memoryStorage();
    storage.setItem(
      "weather-board:city-weather:skippack",
      JSON.stringify({ next24Hours: [] }),
    );
    storage.setItem(PREFERENCES_KEY, "keep");
    expect(getWeatherCache(city, storage, NOW)).toBe(null);
    storage.setItem(
      CACHE_PREFIX + locationKey(city),
      JSON.stringify({ ...forecast(), current: {} }),
    );
    expect(getWeatherCache(city, storage, NOW)).toBe(null);
    expect(storage.getItem(PREFERENCES_KEY)).toBe("keep");
  });
  it("bounds weather cache storage, survives quota errors, preserves missing fields as null", () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, "keep");
    for (let i = 0; i < 30; i++) {
      const c = { ...city, id: String(i) };
      setWeatherCache(c, { ...forecast(NOW + i), cityId: c.id }, storage);
    }
    expect(storage.length).toBe(CACHE_LIMIT + 1);
    expect(storage.getItem(PREFERENCES_KEY)).toBe("keep");
    setWeatherCache(city, forecast(), storage);
    expect(getWeatherCache(city, storage, NOW)).toEqual(forecast());
    const denied = {
      ...storage,
      setItem: () => {
        throw new Error("Quota");
      },
    };
    expect(() => setWeatherCache(city, forecast(), denied)).not.toThrow();
  });
});
