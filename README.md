# Weather Board

Weather Board is a static travel weather dashboard for a fixed set of saved work-travel cities. It focuses on one selected city at a time, while keeping the other saved cities visible in a compact rail for quick awareness.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Open-Meteo Forecast API
- GitHub Pages

Open-Meteo does not require an API key for this app. There are no backend services, databases, serverless functions, authentication flows, paid APIs, or environment variables.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Build the production site:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deploy To GitHub Pages

This project is configured as a static Vite site. The Vite `base` is set to `./` so built assets resolve correctly from a GitHub Pages project site.

The repository name controls the project-page URL. A repo named `weather-board` would publish at:

```text
https://YOUR-USERNAME.github.io/weather-board/
```

The app does not require the repository, package, or page title to all have the same name. `weather-board` is a clear, durable repo name, but `pixel-weather-board` is also a good fit if you want the URL to signal the retro visual style.

Deploy the `dist` folder with:

```bash
npm run deploy
```

The deploy script runs a production build and publishes `dist` using `gh-pages`.

After deployment, configure the repository's GitHub Pages source to use the `gh-pages` branch if GitHub does not select it automatically.

## City List

The saved city list lives in:

```text
src/data/cities.ts
```

To add or edit cities, update the `CITIES` array with:

- `id`
- `name`
- `region`
- `country`
- `latitude`
- `longitude`
- `timezone`

The app uses hardcoded coordinates and timezones. It does not perform geocoding.

## Weather Data

Weather Board calls Open-Meteo's browser-friendly forecast endpoint for:

- current temperature and feels-like temperature
- current weather code
- humidity
- wind speed
- hourly temperature and precipitation probability
- daily high, low, precipitation probability, sunrise, and sunset

Responses are normalized in `src/lib/openMeteo.ts` before they reach React components.

## Caching

Weather responses are cached in `localStorage` for 15 minutes. If cached data is stale, the app attempts a refresh. If the refresh fails, stale cached data remains visible with a clear cached-weather indicator. If no data is available, the app shows a retryable error state.
