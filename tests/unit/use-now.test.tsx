import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"

const T0 = new Date("2026-03-01T12:00:00Z").getTime()

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
  vi.setSystemTime(T0)
})
afterEach(() => vi.useRealTimers())

describe("useNow", () => {
  it("has the time in its first browser render", () => {
    const { result } = renderHook(() => useNow())
    expect(result.current).toBe(T0)
  })

  it("reads the clock again at once, then every interval", () => {
    const { result } = renderHook(() => useNow(1000))
    vi.setSystemTime(T0 + 250)
    act(() => void vi.advanceTimersByTime(0))
    expect(result.current).toBe(T0 + 250)
    act(() => void vi.advanceTimersByTime(999))
    expect(result.current).toBe(T0 + 250)
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current).toBe(T0 + 1250)
    act(() => void vi.advanceTimersByTime(3000))
    expect(result.current).toBe(T0 + 4250)
  })

  it("reads once and never again with null, zero, a negative or a non-finite interval", () => {
    for (const interval of [null, 0, -5, Number.NaN, Infinity]) {
      const mountedAt = Date.now()
      const { result, unmount } = renderHook(() => useNow(interval))
      expect(vi.getTimerCount()).toBe(0)
      act(() => void vi.advanceTimersByTime(5000))
      expect(result.current).toBe(mountedAt)
      unmount()
    }
  })

  it("restarts its timer when the interval changes, and clears it on unmount", () => {
    const { result, rerender, unmount } = renderHook(({ ms }) => useNow(ms), { initialProps: { ms: 1000 as number | null } })
    expect(vi.getTimerCount()).toBe(2)
    rerender({ ms: 500 })
    expect(vi.getTimerCount()).toBe(2)
    act(() => void vi.advanceTimersByTime(500))
    expect(result.current).toBe(T0 + 500)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
