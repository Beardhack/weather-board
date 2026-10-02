import { describe, expect, it } from "vitest";
import {
  buildForecastUrl,
  normalizeOpenMeteoResponse,
} from "../../src/lib/openMeteo";
import {
  addDays,
  formatHour,
  formatTemperature,
  groupHours,
  HOUR_MS,
  localDate,
  selectHours,
} from "../../src/lib/formatting";
import { normalizeLocations } from "../../src/lib/locations";
import { getSpriteName } from "../../src/components/PixelWeatherArt";
import { city, forecast, NOW, payload } from "../fixtures";
describe("provider normalization", () => {
  it("retains all seven days and uses epoch instants", () => {
    const result = forecast();
    expect(result.hourly).toHaveLength(168);
    expect(result.hourly[0].time).toBe(payload().hourly.time[0] * 1000);
    expect(result.current.time).toBe(NOW);
    expect(result.fetchedAt).toBe(NOW);
    const url = new URL(buildForecastUrl(city));
    expect(url.searchParams.get("timeformat")).toBe("unixtime");
    expect(url.searchParams.get("hourly")).toContain("is_day");
    expect(url.searchParams.get("hourly")).toContain("wind_gusts_10m");
  });
  it("keeps missing or nonfinite measurements null without dropping their hour", () => {
    const raw: any = payload();
    raw.current = { time: NOW / 1000 };
    raw.hourly.temperature_2m[0] = null;
    raw.hourly.apparent_temperature = [];
    raw.hourly.wind_speed_10m[0] = Infinity;
    raw.hourly.precipitation_probability[0] = 140;
    raw.hourly.precipitation[0] = null;
    raw.hourly.weather_code[0] = null;
    raw.hourly.is_day[0] = null;
    const result = normalizeOpenMeteoResponse(raw, city, NOW);
    expect(result.hourly).toHaveLength(168);
    expect(result.current).toMatchObject({
      temperature: null,
      apparentTemperature: null,
      windSpeed: null,
      isDay: null,
    });
    expect(result.hourly[0]).toMatchObject({
      temperature: null,
      apparentTemperature: null,
      windSpeed: null,
      precipitationProbability: null,
      precipitationAmount: null,
      conditionKey: "unknown",
      isDay: null,
    });
    expect(formatTemperature(null)).toBe("—");
    expect(formatTemperature(Infinity)).toBe("—");
  });
  it("preserves real zero, removes duplicate/invalid times, sorts, and rejects unusable responses", () => {
    const raw: any = payload();
    raw.hourly.precipitation[0] = 0;
    raw.hourly.time[1] = raw.hourly.time[0];
    raw.hourly.time[2] = "not an epoch";
    const result = normalizeOpenMeteoResponse(raw, city, NOW);
    expect(result.hourly).toHaveLength(166);
    expect(result.hourly[0].precipitationAmount).toBe(0);
    expect(() => normalizeOpenMeteoResponse({}, city)).toThrow(/incomplete/);
    expect(() => normalizeOpenMeteoResponse({ error: true }, city)).toThrow();
  });
  it("decodes provider daily calendar labels using the documented offset", () => {
    const raw = payload();
    raw.utc_offset_seconds = -4 * 3600;
    raw.daily.time = [Date.parse("2026-11-02T04:00Z") / 1000];
    expect(normalizeOpenMeteoResponse(raw, city).daily[0].date).toBe(
      "2026-11-02",
    );
    expect(
      normalizeOpenMeteoResponse(
        { ...raw, utc_offset_seconds: undefined },
        city,
      ).daily,
    ).toEqual([]);
  });
  it("normalizes global search with disambiguation, IDs and safe timezones", () => {
    const result = {
      id: 123,
      name: "Paris",
      admin1: "Île-de-France",
      country: "France",
      latitude: 48.8,
      longitude: 2.3,
      timezone: "Europe/Paris",
    };
    expect(
      normalizeLocations({
        results: [
          result,
          result,
          { ...result, id: 2, timezone: "bad/zone" },
          { ...result, id: 3, latitude: 999 },
        ],
      }),
    ).toEqual([
      {
        id: "geonames:123",
        name: "Paris",
        region: "Île-de-France",
        country: "France",
        latitude: 48.8,
        longitude: 2.3,
        timezone: "Europe/Paris",
      },
    ]);
    expect(normalizeLocations({})).toEqual([]);
  });
});
describe("location-local clock and hourly windows", () => {
  const hour = forecast().hourly[0];
  const points = (start: string, count: number) =>
    Array.from({ length: count }, (_, i) => ({
      ...hour,
      time: Date.parse(start) + i * HOUR_MS,
    }));
  it("rolls a next-48-hour window from the clock, never falls back to exhausted history", () => {
    const data = forecast();
    expect(selectHours(data.hourly, "next48", NOW, city.timezone)).toHaveLength(
      48,
    );
    const first = selectHours(data.hourly, "next48", NOW, city.timezone)[0];
    expect(
      selectHours(data.hourly, "next48", NOW + HOUR_MS, city.timezone)[0].time,
    ).toBe(first.time + HOUR_MS);
    expect(
      selectHours(data.hourly, "next48", NOW + 8 * 24 * HOUR_MS, city.timezone),
    ).toEqual([]);
  });
  it("changes Today/Tomorrow at location midnight, independently of viewer timezone", () => {
    const data = points("2026-10-02T00:00Z", 72);
    const before = Date.parse("2026-10-03T03:59:00Z");
    expect(localDate(before, city.timezone)).toBe("2026-10-02");
    expect(localDate(before + 60_000, city.timezone)).toBe("2026-10-03");
    expect(selectHours(data, "tomorrow", before, city.timezone)).toEqual(
      selectHours(data, "today", before + 60_000, city.timezone),
    );
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("keeps 25 fall-back hours and distinguishes repeated 1 AM; handles 23-hour spring day", () => {
    const fall = selectHours(
      points("2026-11-01T00:00Z", 48),
      "date:2026-11-01",
      Date.parse("2026-11-01T00:00Z"),
      city.timezone,
    );
    expect(fall).toHaveLength(25);
    expect(formatHour(fall[1].time, city.timezone)).toContain("EDT");
    expect(formatHour(fall[2].time, city.timezone)).toContain("EST");
    expect(new Set(fall.map((p) => p.time)).size).toBe(25);
    const spring = selectHours(
      points("2026-03-08T00:00Z", 48),
      "date:2026-03-08",
      NOW,
      city.timezone,
    );
    expect(spring).toHaveLength(23);
    expect(
      spring.some((p) =>
        formatHour(p.time, city.timezone).startsWith("2:00 AM"),
      ),
    ).toBe(false);
  });
  it("handles Kathmandu quarter-hour and Adelaide half-hour offsets without rounding away points", () => {
    const data = points("2026-10-02T00:15Z", 48);
    const now = Date.parse("2026-10-02T00:14Z");
    expect(formatHour(data[0].time, "Asia/Kathmandu")).toContain("6:00");
    expect(selectHours(data, "next48", now, "Asia/Kathmandu")[0]).toBe(data[0]);
    expect(localDate(Date.parse("2026-10-02T18:30Z"), "Asia/Kathmandu")).toBe(
      "2026-10-03",
    );
    expect(
      formatHour(Date.parse("2026-10-02T00:00Z"), "Australia/Adelaide"),
    ).toContain("9:30");
    expect(groupHours(data, "Asia/Kathmandu").length).toBe(3);
  });
  it("uses moon variants at night and no assumed sunshine for missing daylight", () => {
    expect(getSpriteName("clear", false)).toBe("moon");
    expect(getSpriteName("partly-cloudy", false)).toBe("partly-night");
    expect(getSpriteName("clear", null)).toBe("unknown");
  });
});
