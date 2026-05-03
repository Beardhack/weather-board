import type { CityConfig } from "../types/weather";

export const CITIES: CityConfig[] = [
  {
    id: "skippack",
    name: "Skippack",
    region: "PA",
    country: "US",
    latitude: 40.2229,
    longitude: -75.3988,
    timezone: "America/New_York",
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    region: "PA",
    country: "US",
    latitude: 39.9526,
    longitude: -75.1652,
    timezone: "America/New_York",
  },
  {
    id: "new-york-city",
    name: "New York City",
    region: "NY",
    country: "US",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
  },
  {
    id: "galway",
    name: "Galway",
    region: "County Galway",
    country: "IE",
    latitude: 53.2707,
    longitude: -9.0568,
    timezone: "Europe/Dublin",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    region: "Catalonia",
    country: "ES",
    latitude: 41.3874,
    longitude: 2.1686,
    timezone: "Europe/Madrid",
  },
  {
    id: "dallas",
    name: "Dallas",
    region: "TX",
    country: "US",
    latitude: 32.7767,
    longitude: -96.797,
    timezone: "America/Chicago",
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    region: "CA",
    country: "US",
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: "America/Los_Angeles",
  },
];

export const DEFAULT_CITY_ID = "skippack";

export function getCityById(cityId: string): CityConfig {
  return CITIES.find((city) => city.id === cityId) ?? CITIES[0];
}
