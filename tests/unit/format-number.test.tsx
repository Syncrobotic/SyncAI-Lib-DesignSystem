import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { formatCount, formatNumber, numberFormat, resolveLocale } from "@/registry/syncrobotic/lib/format-number"
import { BarList } from "@/registry/syncrobotic/ui/bar-list"
import { chartNumber } from "@/registry/syncrobotic/ui/chart"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { FacetList } from "@/registry/syncrobotic/ui/facets"
import { LoadMore } from "@/registry/syncrobotic/ui/load-more"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { ShareBar } from "@/registry/syncrobotic/ui/share-bar"

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

// One number path (0.40): every other number goes through formatNumber, with the same locale rule as formatCount.
describe("resolveLocale", () => {
  it("is English without a locale, never the runtime's", () => {
    expect(resolveLocale()).toBe("en")
    expect(resolveLocale(undefined)).toBe("en")
  })

  it("keeps a tag Intl can read and falls back to English for one it cannot", () => {
    expect(resolveLocale("zh-TW")).toBe("zh-TW")
    expect(resolveLocale("de")).toBe("de")
    expect(resolveLocale("en_US")).toBe("en")
    expect(resolveLocale("")).toBe("en")
  })
})

describe("formatNumber", () => {
  it("groups and keeps up to three decimals by default, in English", () => {
    expect(formatNumber(12480)).toBe("12,480")
    expect(formatNumber(1234.5)).toBe("1,234.5")
    expect(formatNumber(0.12345)).toBe("0.123")
  })

  it("passes Intl.NumberFormat options through", () => {
    expect(formatNumber(1234.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe("1,234.50")
    expect(formatNumber(1234.5, { maximumFractionDigits: 0, useGrouping: false })).toBe("1235")
    expect(formatNumber(1234.5, { locale: "de", maximumFractionDigits: 1 })).toBe("1.234,5")
    expect(formatNumber(12, { locale: "en-GB", style: "currency", currency: "EUR" })).toBe("€12.00")
  })

  it("writes English for a tag Intl cannot read instead of throwing", () => {
    expect(() => formatNumber(1, { locale: "en_US" })).not.toThrow()
    expect(formatNumber(1234, { locale: "en_US" })).toBe("1,234")
    expect(formatCount(1234, { locale: "en_US" })).toBe("1,234")
  })

  it("reuses one formatter per locale and options", () => {
    expect(numberFormat("en", { maximumFractionDigits: 1 })).toBe(numberFormat(undefined, { maximumFractionDigits: 1 }))
    expect(numberFormat("en", { maximumFractionDigits: 1 })).not.toBe(numberFormat("en", { maximumFractionDigits: 2 }))
  })
})

// The server and a browser in another language must write the same digits. Nothing in these components may reach the
// runtime's locale: toLocaleString is made to answer in German here, as a browser set to German would.
describe("SSR-stable numbers", () => {
  afterEach(() => vi.restoreAllMocks())

  const germanRuntime = () => {
    const original = Number.prototype.toLocaleString
    vi.spyOn(Number.prototype, "toLocaleString").mockImplementation(function (this: number, locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
      return original.call(this, locale ?? "de", options)
    })
  }

  it.each([
    ["Pagination", () => <Pagination page={0} pageSize={10} total={12345} />, ["1–10 of 12,345"]],
    ["LoadMore", () => <LoadMore shown={20} total={12345} step={20} onMore={() => {}} />, ["Showing 20 of 12,345", "Show 20 more (12,325 left)"]],
    ["Meter", () => <Meter value={412345} max={1000000} showMax unit="items" label="Storage" />, ["412,345", "1,000,000"]],
    ["BarList", () => <BarList label="Items by class" items={[{ key: "a", label: "Pallet", value: 48210 }]} />, ["48,210"]],
    ["FacetList", () => <FacetList facets={[{ key: "t", label: "Tier", options: [{ value: "T0", label: "T0", count: 48210 }] }]} />, ["48,210"]],
    ["ChipGroup", () => <ChipGroup label="Zone" items={[{ value: "a", label: "Aisle", count: 12345 }]} />, ["12,345"]],
    ["ShareBar", () => <ShareBar label="Images" segments={[{ key: "t", label: "Train", value: 12345 }]} />, ["12,345"]],
  ])("%s writes grouped English digits on the server whatever the runtime's language", (_, node, expected) => {
    germanRuntime()
    const html = renderToString(node()).replace(/<!-- -->/g, "")
    for (const text of expected) expect(html).toContain(text)
    expect(html).not.toMatch(/\d\.\d{3}(?!\d)/)
  })

  it("chartNumber groups and writes a true minus", () => {
    germanRuntime()
    expect(chartNumber(12480)).toBe("12,480")
    expect(chartNumber(-6)).toBe("−6")
    expect(chartNumber(-0.0001)).toBe("0")
    expect(chartNumber("Mon")).toBe("Mon")
  })
})
