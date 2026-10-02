import { test, expect } from "@playwright/test";
test("live Open-Meteo search and Kathmandu forecast", async ({ page }) => {
  test.skip(
    process.env.LIVE_WEATHER !== "1",
    "Opt-in check against the real public providers.",
  );
  test.setTimeout(60_000);
  const responses: { path: string; status: number }[] = [];
  page.on("response", (r) => {
    if (r.url().includes("open-meteo.com"))
      responses.push({ path: new URL(r.url()).hostname, status: r.status() });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Skippack", exact: true }),
  ).toBeVisible({ timeout: 25_000 });
  const search = page.getByRole("combobox", {
    name: "Search city or postal code",
  });
  await search.fill("Kathmandu");
  const result = page
    .getByRole("listbox")
    .getByRole("option")
    .filter({ hasText: "Nepal" })
    .first();
  await expect(result).toBeVisible({ timeout: 15_000 });
  await result.click();
  await expect(
    page.getByRole("heading", { name: "Kathmandu", exact: true }),
  ).toBeVisible({ timeout: 25_000 });
  await expect(page.locator(".hour-row")).toHaveCount(48);
  await expect(page.locator(".zone-label")).toContainText("Asia/Kathmandu");
  await expect(page.locator(".freshness-copy")).not.toContainText("Stale");
  const labels = await page.locator(".hour-row .hour-time").allTextContents();
  console.log(
    JSON.stringify({
      liveResponses: responses,
      firstKathmanduHours: labels.slice(0, 3),
    }),
  );
  await page.screenshot({
    path: "test-results/weather-board-live-kathmandu.png",
  });
});
