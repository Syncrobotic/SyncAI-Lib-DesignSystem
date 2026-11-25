import { describe, expect, it } from "vitest"
import { formatCount } from "@/registry/syncrobotic/lib/format-count"

// The number formatting rule (#386): full numbers with grouping by default, abbreviations only when asked for.
describe("formatCount", () => {
  it("writes the full number with grouping by default, in English when no locale is given", () => {
    expect(formatCount(0)).toBe("0")
    expect(formatCount(999)).toBe("999")
    expect(formatCount(135287)).toBe("135,287")
    expect(formatCount(1234567)).toBe("1,234,567")
    expect(formatCount(-4321)).toBe("-4,321")
  })

  it("rounds a count to a whole number", () => {
    expect(formatCount(1234.6)).toBe("1,235")
  })

  it("abbreviates only with compact", () => {
    expect(formatCount(999, { compact: true })).toBe("999")
    expect(formatCount(1234, { compact: true })).toBe("1.2K")
    expect(formatCount(12345, { compact: true })).toBe("12K")
    expect(formatCount(135287, { compact: true })).toBe("135K")
    expect(formatCount(1234567, { compact: true })).toBe("1.2M")
  })

  it("follows the locale: zh-TW groups the full number and abbreviates in 萬 and 億", () => {
    expect(formatCount(135287, { locale: "zh-TW" })).toBe("135,287")
    expect(formatCount(9876, { locale: "zh-TW", compact: true })).toBe("9876")
    expect(formatCount(12345, { locale: "zh-TW", compact: true })).toBe("1.2萬")
    expect(formatCount(135287, { locale: "zh-TW", compact: true })).toBe("14萬")
    expect(formatCount(1234567, { locale: "zh-TW", compact: true })).toBe("123萬")
    expect(formatCount(1e9, { locale: "zh-TW", compact: true })).toBe("10億")
  })

  it("uses the locale's separators", () => {
    expect(formatCount(135287, { locale: "de" })).toBe("135.287")
  })
})
