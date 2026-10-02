import { useEffect, useState } from "react";
import type { CityConfig } from "../types/weather";
import { searchLocations } from "./locations";
type SearchState = {
  query: string;
  status: "idle" | "loading" | "success" | "error";
  results: CityConfig[];
  error: string | null;
};
export const SEARCH_DELAY_MS = 300;
export function useLocationSearch(query: string, search = searchLocations) {
  const [attempt, retry] = useState(0);
  const [state, setState] = useState<SearchState>({
    query: "",
    status: "idle",
    results: [],
    error: null,
  });
  const term = query.trim();
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    let current = true;
    let timeout: ReturnType<typeof setTimeout>;
    setState({ query: term, status: "loading", results: [], error: null });
    const debounce = setTimeout(() => {
      timeout = setTimeout(() => controller.abort(), 12_000);
      void search(term, controller.signal)
        .then((results) => {
          if (current)
            setState({ query: term, status: "success", results, error: null });
        })
        .catch(() => {
          if (current)
            setState({
              query: term,
              status: "error",
              results: [],
              error:
                "Search couldn't connect. Check your connection and try again.",
            });
        })
        .finally(() => clearTimeout(timeout));
    }, SEARCH_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(debounce);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [term, attempt, search]);
  // Invalidate old results synchronously on input, before the effect cleanup runs.
  const visible: SearchState =
    term.length < 2
      ? { query: term, status: "idle", results: [], error: null }
      : state.query === term
        ? state
        : { query: term, status: "loading", results: [], error: null };
  return { ...visible, retry: () => retry((value) => value + 1) };
}
