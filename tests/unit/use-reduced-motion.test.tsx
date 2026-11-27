import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { prefersReducedMotion, usePrefersReducedMotion } from "@/registry/syncrobotic/hooks/use-reduced-motion"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** A matchMedia whose answer the test can flip, firing "change" like a browser does. */
function mockMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  const spy = vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        media: query,
        get matches() {
          return matches
        },
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      }) as unknown as MediaQueryList,
  )
  const set = (next: boolean) => {
    matches = next
    listeners.forEach((fn) => fn())
  }
  return { spy, set, listeners }
}

describe("prefersReducedMotion", () => {
  it("asks the reduced-motion media query", () => {
    const { spy } = mockMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
    expect(spy).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)")
    mockMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it("returns the fallback where matchMedia is missing", () => {
    vi.stubGlobal("matchMedia", undefined)
    expect(prefersReducedMotion()).toBe(false)
    expect(prefersReducedMotion(true)).toBe(true)
  })
})

describe("usePrefersReducedMotion", () => {
  it("reads the setting and renders again when it changes", () => {
    const media = mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
    act(() => media.set(true))
    expect(result.current).toBe(true)
    act(() => media.set(false))
    expect(result.current).toBe(false)
  })

  it("stops listening on unmount", () => {
    const media = mockMatchMedia(true)
    const { result, unmount } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
    expect(media.listeners.size).toBe(1)
    unmount()
    expect(media.listeners.size).toBe(0)
  })
})
