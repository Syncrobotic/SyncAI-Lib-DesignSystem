import { describe, expect, it } from "vitest"
import { clamp, pad } from "@/registry/syncrobotic/lib/math"

describe("clamp", () => {
  it("keeps a value inside the range as it is", () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-2.5, -3, 3)).toBe(-2.5)
  })

  it("holds values at the bounds, inclusive", () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
    expect(clamp(7, 3, 3)).toBe(3)
  })

  it("leaves a side open when its bound is left out", () => {
    expect(clamp(-1e9)).toBe(-1e9)
    expect(clamp(-5, 0)).toBe(0)
    expect(clamp(1e9, 0)).toBe(1e9)
    expect(clamp(50, undefined, 10)).toBe(10)
    expect(clamp(-Infinity, 0, 1)).toBe(0)
    expect(clamp(Infinity, 0, 1)).toBe(1)
  })

  it("passes NaN through", () => {
    expect(clamp(Number.NaN, 0, 1)).toBeNaN()
  })
})

describe("pad", () => {
  it("pads to two digits by default", () => {
    expect(pad(7)).toBe("07")
    expect(pad(0)).toBe("00")
    expect(pad(59)).toBe("59")
  })

  it("pads to a given width and never truncates", () => {
    expect(pad(5, 3)).toBe("005")
    expect(pad(123, 2)).toBe("123")
    expect(pad(42, 0)).toBe("42")
    expect(pad(1, 1)).toBe("1")
  })
})
