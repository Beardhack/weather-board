import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "./components/AppShell";
import { ErrorState } from "./components/ErrorState";
import { HourlyForecast } from "./components/HourlyForecast";
import { LoadingState } from "./components/LoadingState";
import { OtherCitiesRail } from "./components/OtherCitiesRail";
import { SevenDayForecast } from "./components/SevenDayForecast";
import { TodayDetails } from "./components/TodayDetails";
import { WeatherHero } from "./components/WeatherHero";
import { CITIES, DEFAULT_CITY_ID, getCityById } from "./data/cities";
import { getWeatherCache, isCacheFresh, setWeatherCache } from "./lib/cache";
import { buildMissingDataMessage, fetchCityWeather, formatApiFailureMessage } from "./lib/openMeteo";
import type { CityConfig, WeatherLoadState } from "./types/weather";

const SELECTED_CITY_STORAGE_KEY = "weather-board:selected-city";

const initialWeatherState: WeatherLoadState = {
  status: "idle",
  data: null,
  isRefreshing: false,
  isStale: false,
  error: null,
};

function createInitialWeatherByCity(): Record<string, WeatherLoadState> {
  return Object.fromEntries(
    CITIES.map((city) => [city.id, { ...initialWeatherState }]),
  ) as Record<string, WeatherLoadState>;
}

function App() {
  const [selectedCityId, setSelectedCityId] = useState(getInitialSelectedCityId);
  const [weatherByCity, setWeatherByCity] =
    useState<Record<string, WeatherLoadState>>(createInitialWeatherByCity);
  const inFlightCityIds = useRef(new Set<string>());

  const loadCityWeather = useCallback(async (city: CityConfig, forceRefresh = false) => {
    if (inFlightCityIds.current.has(city.id)) {
      return;
    }

    inFlightCityIds.current.add(city.id);
    const cached = getWeatherCache(city.id);

    if (cached && isCacheFresh(cached) && !forceRefresh) {
      setWeatherByCity((current) => ({
        ...current,
        [city.id]: {
          status: "success",
          data: cached.data,
          isRefreshing: false,
          isStale: false,
          error: null,
        },
      }));
      inFlightCityIds.current.delete(city.id);
      return;
    }

    setWeatherByCity((current) => ({
      ...current,
      [city.id]: cached
        ? {
            status: "success",
            data: cached.data,
            isRefreshing: true,
            isStale: true,
            error: null,
          }
        : {
            status: "loading",
            data: null,
            isRefreshing: false,
            isStale: false,
            error: null,
          },
    }));

    try {
      const weather = await fetchCityWeather(city);
      setWeatherCache(city.id, weather);
      setWeatherByCity((current) => ({
        ...current,
        [city.id]: {
          status: "success",
          data: weather,
          isRefreshing: false,
          isStale: false,
          error: null,
        },
      }));
    } catch (error) {
      const message = formatApiFailureMessage(city.name, error);

      setWeatherByCity((current) => ({
        ...current,
        [city.id]: cached
          ? {
              status: "success",
              data: cached.data,
              isRefreshing: false,
              isStale: true,
              error: message,
            }
          : {
              status: "error",
              data: null,
              isRefreshing: false,
              isStale: false,
              error: message,
            },
      }));
    } finally {
      inFlightCityIds.current.delete(city.id);
    }
  }, []);

  useEffect(() => {
    CITIES.forEach((city) => {
      void loadCityWeather(city);
    });
  }, [loadCityWeather]);

  useEffect(() => {
    persistSelectedCityId(selectedCityId);
  }, [selectedCityId]);

  const selectedCity = getCityById(selectedCityId);
  const selectedState = weatherByCity[selectedCity.id] ?? initialWeatherState;

  const handleSelectCity = useCallback(
    (cityId: string) => {
      const city = getCityById(cityId);
      setSelectedCityId(city.id);
      void loadCityWeather(city);
    },
    [loadCityWeather],
  );

  const handleRetrySelectedCity = useCallback(() => {
    void loadCityWeather(selectedCity, true);
  }, [loadCityWeather, selectedCity]);

  return (
    <AppShell cities={CITIES} selectedCityId={selectedCity.id} onSelectCity={handleSelectCity}>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {selectedState.data ? (
            <>
              <WeatherHero
                city={selectedCity}
                weather={selectedState.data}
                isStale={selectedState.isStale}
                isRefreshing={selectedState.isRefreshing}
                staleMessage={selectedState.error}
              />
              <TodayDetails city={selectedCity} weather={selectedState.data} />
              <HourlyForecast city={selectedCity} points={selectedState.data.next24Hours} />
              <SevenDayForecast weather={selectedState.data} />
            </>
          ) : selectedState.status === "error" ? (
            <ErrorState
              message={selectedState.error ?? buildMissingDataMessage(selectedCity.name)}
              onRetry={handleRetrySelectedCity}
            />
          ) : (
            <LoadingState title={`Loading ${selectedCity.name}`} />
          )}
        </div>
        <OtherCitiesRail
          cities={CITIES}
          selectedCityId={selectedCity.id}
          weatherByCity={weatherByCity}
          onSelectCity={handleSelectCity}
        />
      </div>
    </AppShell>
  );
}

function getInitialSelectedCityId(): string {
  try {
    const stored = window.localStorage.getItem(SELECTED_CITY_STORAGE_KEY);

    if (stored && CITIES.some((city) => city.id === stored)) {
      return stored;
    }
  } catch {
    return DEFAULT_CITY_ID;
  }

  return DEFAULT_CITY_ID;
}

function persistSelectedCityId(cityId: string): void {
  try {
    window.localStorage.setItem(SELECTED_CITY_STORAGE_KEY, cityId);
  } catch {
    // Persisting the preferred city is optional; the app keeps working without it.
  }
}

export default App;
