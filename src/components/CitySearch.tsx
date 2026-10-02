import { useEffect, useId, useRef, useState } from "react";
import { Search, X, MapPin, LoaderCircle } from "lucide-react";
import type { CityConfig } from "../types/weather";
import { useLocationSearch } from "../lib/useLocationSearch";
import { formatLocation } from "../lib/formatting";
export function CitySearch({
  recents,
  onSelect,
}: {
  recents: CityConfig[];
  onSelect: (city: CityConfig) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const search = useLocationSearch(query);
  const choices =
    query.trim().length < 2 ? (query.trim() ? [] : recents) : search.results;
  const selectedIndex = active >= 0 && active < choices.length ? active : -1;
  useEffect(() => {
    if (open && selectedIndex >= 0)
      document
        .getElementById(`${id}-option-${selectedIndex}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex, id]);
  function select(city: CityConfig) {
    onSelect(city);
    setQuery("");
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  }
  return (
    <div
      className="city-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Search city or postal code
      </label>
      <Search size={19} className="search-icon" aria-hidden="true" />
      <input
        ref={input}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-results`}
        aria-activedescendant={
          open && selectedIndex >= 0
            ? `${id}-option-${selectedIndex}`
            : undefined
        }
        aria-describedby={`${id}-help`}
        placeholder="City or ZIP / postal code"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setActive(-1);
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            if (choices.length)
              setActive(
                event.key === "ArrowDown"
                  ? (selectedIndex + 1) % choices.length
                  : selectedIndex <= 0
                    ? choices.length - 1
                    : selectedIndex - 1,
              );
          }
          if (event.key === "Enter" && open && selectedIndex >= 0) {
            event.preventDefault();
            select(choices[selectedIndex]);
          }
        }}
      />
      {query && (
        <button
          className="clear-search"
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setActive(-1);
            input.current?.focus();
          }}
        >
          <X size={17} aria-hidden="true" />
        </button>
      )}
      <span id={`${id}-help`} className="sr-only">
        Enter a city or postal code. Use up and down arrows to choose a result,
        Enter to open it, or Escape to close.
      </span>
      {open && (
        <div className="search-popover">
          <div className="search-hint" role="status">
            {!query.trim() ? (
              recents.length ? (
                "Recently viewed"
              ) : (
                "Find a place. No need to save it first."
              )
            ) : query.trim().length < 2 ? (
              "Type at least 2 characters."
            ) : search.status === "loading" ? (
              <>
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />{" "}
                Searching places…
              </>
            ) : search.status === "error" ? (
              search.error
            ) : choices.length ? (
              `${choices.length} places found`
            ) : (
              "No places found. Try the full city name or add a country."
            )}
          </div>
          <ul
            role="listbox"
            id={`${id}-results`}
            aria-label={query ? "Search results" : "Recent places"}
          >
            {choices.map((city, index) => (
              <li
                key={city.id}
                role="option"
                id={`${id}-option-${index}`}
                aria-selected={selectedIndex === index}
                className={selectedIndex === index ? "active" : ""}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(index)}
                onClick={() => select(city)}
              >
                <MapPin size={17} aria-hidden="true" />
                <span>
                  <strong>{city.name}</strong>
                  <small>{formatLocation(city)}</small>
                </span>
              </li>
            ))}
          </ul>
          {search.status === "error" && query.length >= 2 && (
            <button
              type="button"
              className="text-button search-retry"
              onClick={search.retry}
            >
              Try search again
            </button>
          )}
          <p className="search-footnote">Try “Paris, France” or “19474”.</p>
        </div>
      )}
    </div>
  );
}
