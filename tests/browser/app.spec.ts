import { test, expect, type Page } from "@playwright/test";
import { NOW, payload } from "../fixtures";
const paris = {
  id: 2988507,
  name: "Paris",
  admin1: "Île-de-France",
  country: "France",
  latitude: 48.85,
  longitude: 2.35,
  timezone: "Europe/Paris",
};
async function setup(page: Page) {
  await page.clock.install({ time: NOW });
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ json: payload() }),
  );
  await page.route("https://geocoding-api.open-meteo.com/**", (route) => {
    const q = new URL(route.request().url()).searchParams.get("name");
    return route.fulfill({
      json: {
        results:
          q === "zzzz"
            ? []
            : [
                paris,
                {
                  ...paris,
                  id: 4717560,
                  admin1: "Texas",
                  country: "United States",
                  timezone: "America/Chicago",
                },
              ],
      },
    });
  });
}
test.beforeEach(async ({ page }) => setup(page));
test("keyboard search opens unsaved city, preserves forecast view, saves/removes favorites, restores selection", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("api.open-meteo.com/v1/forecast")) requests++;
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Skippack", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toBeEnabled();
  expect(requests).toBe(1);
  await page.getByRole("button", { name: "Tomorrow", exact: true }).click();
  const input = page.getByRole("combobox", {
    name: "Search city or postal code",
  });
  await input.fill("Paris");
  await expect(
    page.getByRole("option", { name: /Paris Île-de-France/ }),
  ).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Paris", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tomorrow", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Save Paris to favorites" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save Paris to favorites" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Favorite places" })
      .getByRole("button", { name: "Paris", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Paris from favorites" })
    .click();
  await expect(
    page
      .getByRole("navigation", { name: "Favorite places" })
      .getByRole("button", { name: "Paris", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Paris", exact: true }),
  ).toBeVisible();
  await input.focus();
  await expect(
    page.getByRole("option", { name: /Paris Île-de-France/ }),
  ).toBeVisible();
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
});
test("hour rows expand with keyboard, seven-day links choose hourly dates, refresh actually fetches", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().includes("api.open-meteo.com/v1/forecast")) requests++;
  });
  await page.goto("/");
  await expect(page.locator(".hour-row")).toHaveCount(48);
  const summary = page.locator(".hour-row summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".hour-row").first()).toHaveAttribute("open", "");
  await expect(
    page.locator(".hour-row").first().getByText("Wind gusts", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hourly forecast for Oct 4" }).click();
  await expect(page.getByLabel("Choose forecast date")).toHaveValue(
    "2026-10-04",
  );
  await expect(page.locator("#hourly")).toBeFocused();
  await expect(page.locator(".hour-row")).toHaveCount(24);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect.poll(() => requests).toBe(2);
});
test("handles postal searches, empty results and search failures with retry", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("combobox", {
    name: "Search city or postal code",
  });
  await input.fill("19474");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(2);
  await input.fill("zzzz");
  await expect(
    page.getByText("No places found.", { exact: false }),
  ).toBeVisible();
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.abort(),
  );
  await input.fill("London");
  await expect(
    page.getByRole("button", { name: "Try search again" }),
  ).toBeVisible();
  await page.unroute("https://geocoding-api.open-meteo.com/**");
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({ json: { results: [paris] } }),
  );
  await page.getByRole("button", { name: "Try search again" }).click();
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(1);
});
test("keeps forecast on refresh failure and offline; recovers on reconnect", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator(".hour-row")).toHaveCount(48);
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText(/Could not refresh Skippack/)).toBeVisible();
  await expect(page.locator(".hour-row")).toHaveCount(48);
  await context.setOffline(true);
  await expect(page.getByText(/Offline · saved forecast/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toBeDisabled();
  await page.unroute("https://api.open-meteo.com/**");
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ json: payload() }),
  );
  await context.setOffline(false);
  await expect(page.getByText(/Could not refresh Skippack/)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toBeEnabled();
});
test("migrates existing selection and all preset favorites", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("weather-board:selected-city", "galway"),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Galway", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Favorite places" })
      .getByRole("button"),
  ).toHaveCount(7);
});
test("shows missing measurements as unavailable and an offline first visit remains searchable", async ({
  page,
  context,
}) => {
  const raw: any = payload();
  raw.current = { time: NOW / 1000 };
  raw.hourly.temperature_2m = raw.hourly.temperature_2m.map(() => null);
  raw.hourly.wind_speed_10m = [];
  raw.hourly.precipitation_probability = [];
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ json: raw }),
  );
  await page.goto("/");
  await expect(page.locator(".hour-row")).toHaveCount(48);
  await expect(page.locator(".hour-temp").first()).toHaveText("—");
  await expect(page.locator(".hour-precip").first()).toHaveText("—");
  await expect(page.locator(".hour-wind").first()).toHaveText("—");
  await context.setOffline(true);
  await page
    .getByRole("navigation", { name: "Favorite places" })
    .getByRole("button", { name: "Galway", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "You're offline · Galway" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Search city or postal code" }),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByRole("heading", { name: "Galway", exact: true }),
  ).toBeVisible();
});
test("responsive layout has no page overflow; search stays reachable while scrolling", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hour-row")).toHaveCount(48);
  for (const width of [320, 360, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".view-buttons")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/weather-board-mobile.png" });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.screenshot({
    path: "test-results/weather-board-small-mobile.png",
  });
  await page.locator(".hour-row").nth(30).scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("combobox", { name: "Search city or postal code" }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/weather-board-desktop.png" });
});
