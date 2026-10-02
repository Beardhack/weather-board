import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocationSearch } from "../../src/lib/useLocationSearch";
import { city, deferred } from "../fixtures";
import type { CityConfig } from "../../src/types/weather";
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("debounced location search", () => {
  it("debounces typing, cancels obsolete requests, and ignores responses that arrive out of order", async () => {
    const old = deferred<CityConfig[]>();
    const next = deferred<CityConfig[]>();
    const search = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(next.promise);
    const { result, rerender } = renderHook(
      ({ q }) => useLocationSearch(q, search),
      { initialProps: { q: "Pa" } },
    );
    await act(() => vi.advanceTimersByTimeAsync(200));
    rerender({ q: "Paris" });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0]).toBe("Paris");
    rerender({ q: "London" });
    expect(search.mock.calls[0][1].aborted).toBe(true);
    expect(result.current.results).toEqual([]);
    await act(() => vi.advanceTimersByTimeAsync(300));
    await act(async () => next.resolve([{ ...city, name: "London" }]));
    expect(result.current.results[0].name).toBe("London");
    await act(async () => old.resolve([{ ...city, name: "Paris" }]));
    expect(result.current.results[0].name).toBe("London");
  });
  it("clears results immediately below minimum length and never submits single characters", async () => {
    const search = vi.fn().mockResolvedValue([city]);
    const { result, rerender } = renderHook(
      ({ q }) => useLocationSearch(q, search),
      { initialProps: { q: "19474" } },
    );
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(result.current.results).toHaveLength(1);
    rerender({ q: "1" });
    expect(result.current.results).toEqual([]);
    expect(result.current.status).toBe("idle");
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(search).toHaveBeenCalledTimes(1);
  });
  it("supports empty results, failure/retry, and aborts on unmount", async () => {
    const search = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([]);
    const { result, unmount } = renderHook(() =>
      useLocationSearch("missing", search),
    );
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(result.current.status).toBe("error");
    act(() => result.current.retry());
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(result.current.status).toBe("success");
    expect(result.current.results).toEqual([]);
    unmount();
    expect(search.mock.calls[1][1].aborted).toBe(true);
  });
});
