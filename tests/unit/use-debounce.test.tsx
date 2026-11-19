import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDebouncedCallback, useDebouncedValue } from "@/registry/syncrobotic/hooks/use-debounce"

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }))
afterEach(() => vi.useRealTimers())

describe("useDebouncedValue", () => {
  it("returns the first value at once and a new one only after the pause", () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), { initialProps: { v: "a" } })
    expect(result.current).toBe("a")
    rerender({ v: "ab" })
    act(() => void vi.advanceTimersByTime(200))
    rerender({ v: "abc" })
    act(() => void vi.advanceTimersByTime(200))
    expect(result.current).toBe("a")
    act(() => void vi.advanceTimersByTime(100))
    expect(result.current).toBe("abc")
  })
})

describe("useDebouncedCallback", () => {
  it("calls once, with the last arguments, after the pause", () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 300))
    act(() => {
      result.current("N")
      result.current("No")
      result.current("Nor")
    })
    expect(fn).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(300))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith("Nor")
  })

  it("cancel drops the pending call; flush runs it now", () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 300))
    act(() => result.current("x"))
    act(() => result.current.cancel())
    act(() => void vi.advanceTimersByTime(500))
    expect(fn).not.toHaveBeenCalled()
    act(() => result.current("y"))
    expect(result.current.isPending()).toBe(true)
    act(() => result.current.flush())
    expect(fn).toHaveBeenCalledWith("y")
    expect(result.current.isPending()).toBe(false)
  })

  it("is the same function across renders and uses the latest callback", () => {
    const calls: string[] = []
    const { result, rerender } = renderHook(({ tag }) => useDebouncedCallback((q: string) => calls.push(`${tag}:${q}`), 300), {
      initialProps: { tag: "old" },
    })
    const first = result.current
    rerender({ tag: "new" })
    expect(result.current).toBe(first)
    act(() => result.current("q"))
    act(() => void vi.advanceTimersByTime(300))
    expect(calls).toEqual(["new:q"])
  })

  it("does not fire after unmount", () => {
    const fn = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 300))
    act(() => result.current("x"))
    unmount()
    act(() => void vi.advanceTimersByTime(500))
    expect(fn).not.toHaveBeenCalled()
  })
})
