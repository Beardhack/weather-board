# Weather Board

An hourly-first weather app built with React, TypeScript, Vite, Tailwind and Open-Meteo. Search for a city or postal code, view its forecast immediately, and optionally save it. Dark panels and the original pixel-weather identity are retained.

## Local development and preview

Requires Node 18+ and npm (validated here with Node 22.14).

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Open the loopback URL printed by Vite. The app calls the public providers directly from the browser. No backend, account, paid API, credentials or environment variables are needed. The existing relative Vite base remains suitable for the GitHub Pages project path.

## Places and navigation

- Search stays in the sticky header. Results show city, region and country. Arrow keys move through results, Enter opens a forecast, Escape dismisses, and Tab retains normal focus navigation.
- Search is debounced by 300 ms, capped at 10 results, and cancelled on replacement/unmount. Late responses cannot overwrite a newer query. A 12-second timeout leads to a retryable error.
- Two characters request an exact-name match; three or more use the provider's normalized prefix matching. This is not typo correction. Use a full city name or a qualifier such as `Paris, France` if needed.
- Favorites are optional (up to 24); recents hold the last 8 distinct places. The original seven presets in `src/data/cities.ts` and the legacy selected-city preference migrate automatically.
- Switching places preserves the active hourly range: Next 48 hours, Today, Tomorrow, or a selected calendar date. A date outside the available forecast shows an empty state without silently changing the view.
- Seven-day entries select that day's hourly view and move focus to it. On small screens, the next-six-hour overview scrolls within its own region; the page itself does not scroll sideways.

## Weather semantics and freshness

The normalizer retains the full seven-day hourly response. Times are requested as Unix timestamps and converted to epoch milliseconds. Hour selection and grouping use the location's IANA timezone, including DST and half/quarter-hour offsets. Repeated DST hours display their timezone/offset. Daily API timestamps are decoded as calendar labels using the documented `utc_offset_seconds`; daily labels are not treated as DST-varying instants.

Hourly rows show temperature, condition, precipitation chance and wind. Expanded details add feels-like temperature, precipitation amount, gusts and humidity. Precipitation chance/amount and maximum gusts cover the **preceding hour ending at the displayed time**, as documented by Open-Meteo. Missing readings remain null and display an em dash; they are never turned into zero.

Only the selected location fetches. Requests are deduplicated; switching cancels an unfinished request. Fetches time out after 20 seconds, and automatic retry attempts are separated by at least 60 seconds. Manual refresh remains available.

Freshness checks run at the 15-minute TTL, on focus/visibility return and on reconnection. The clock and upcoming-hours window update every 30 seconds independently of responses. Hidden tabs do not initiate periodic forecast requests; returning checks immediately. Errors keep the last good response in memory even if storage is unavailable. Offline, stale, failed-refresh and empty-cache states are explicit. Exhausted cached forecasts never restart at an old hour.

“Forecast retrieved” is the browser retrieval time. The disclosure identifies the modeled current-conditions time separately and states that model issuance is not supplied by this endpoint.

## Storage

- `weather-board:locations:v1`: selected location, favorites and recents.
- `weather-board:forecast:v2:...`: validated full weather responses, bounded to 12 cached places. The in-memory store is similarly bounded.
- The legacy `weather-board:selected-city` is read during migration. Old sliced weather caches are ignored. Neither cache invalidation nor eviction resets location preferences.
- If browser storage is denied, locations and weather still work for the current visit.

## Tests

```sh
npm test
npm run build
npm run test:browser
```

The browser configuration uses an installed Google Chrome and starts a loopback Vite server on port 4173. Change the configured Playwright channel if using another installed browser. Tests use controlled provider responses for repeatable keyboard, search, migration, hourly, refresh/offline, missing-data and responsive checks. Screenshots and the HTML report are written to ignored `test-results/` and `playwright-report/` directories.

An opt-in live-provider smoke test exercises real search and Kathmandu's GMT+5:45 forecast:

```powershell
$env:LIVE_WEATHER = '1'
npm run test:browser
Remove-Item Env:LIVE_WEATHER
```

On POSIX shells, use `LIVE_WEATHER=1 npm run test:browser`. Regular browser runs skip this external-network check.

## Provider documentation and attribution

- [Open-Meteo Forecast API](https://open-meteo.com/en/docs): timestamp format, variables and preceding-hour intervals.
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api): city/postal search, matching rules and location identity.
- Weather attribution links to [Open-Meteo](https://open-meteo.com/) and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); location attribution links to [GeoNames](https://www.geonames.org/).

## Publication

The `npm run deploy` command builds the production assets and publishes `dist/` to the existing `gh-pages` branch. GitHub Pages serves the app at [beardhack.github.io/weather-board](https://beardhack.github.io/weather-board/). Run this command only when publishing a release is intended.
