import * as React from "react"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { HistogramBattery, binEqualWidth, median } from "@/registry/syncrobotic/blocks/histogram-battery"

afterEach(cleanup)

describe("binEqualWidth", () => {
  it("makes equal bins that hold their lower edge and not their upper", () => {
    const { bins, outside } = binEqualWidth([0, 4.999, 5, 10, 14.999, 15], { min: 0, max: 100, bins: 20 })
    expect(bins).toHaveLength(20)
    expect(bins[0]).toEqual({ from: 0, to: 5, count: 2 })
    expect(bins[1]).toEqual({ from: 5, to: 10, count: 1 })
    expect(bins[2].count).toBe(2)
    expect(bins[3].count).toBe(1)
    expect(outside).toBe(0)
  })

  it("puts the maximum in the last bin, so 100 % is not dropped", () => {
    const { bins } = binEqualWidth([95, 99.9, 100], { min: 0, max: 100, bins: 20 })
    expect(bins[19]).toEqual({ from: 95, to: 100, count: 3 })
  })

  it("counts values out of range or not finite as outside, never in the end bins", () => {
    const { bins, outside } = binEqualWidth([-1, 101, NaN, Infinity, 50], { min: 0, max: 100, bins: 10 })
    expect(outside).toBe(4)
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(1)
    expect(bins[0].count).toBe(0)
    expect(bins[9].count).toBe(0)
  })

  it("keeps decimal edges exact: 0.3 is the start of the fourth bin, not the end of the third", () => {
    const { bins } = binEqualWidth([0.3, 0.7], { min: 0, max: 1, bins: 10 })
    expect(bins[3]).toEqual({ from: 0.3, to: 0.4, count: 1 })
    expect(bins[7].count).toBe(1)
    expect(bins.map((b) => b.to).at(-1)).toBe(1)
  })

  it("works from a minimum other than zero", () => {
    const { bins } = binEqualWidth([12, 18, 30], { min: 10, max: 30, bins: 4 })
    expect(bins.map((b) => [b.from, b.to, b.count])).toEqual([
      [10, 15, 1],
      [15, 20, 1],
      [20, 25, 0],
      [25, 30, 1],
    ])
  })

  it("refuses an empty range or a fractional bin count", () => {
    expect(() => binEqualWidth([1], { min: 5, max: 5, bins: 4 })).toThrow()
    expect(() => binEqualWidth([1], { min: 0, max: 10, bins: 2.5 })).toThrow()
    expect(() => binEqualWidth([1], { min: 0, max: 10, bins: 0 })).toThrow()
  })
})

describe("median", () => {
  it("takes the middle value, or the mean of the two middle ones", () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBeNaN()
  })
})

describe("HistogramBattery", () => {
  it("says the median and the low count in words, and offers the same bins as a table", () => {
    render(<HistogramBattery />)
    const figure = screen.getByRole("figure")
    expect(figure.getAttribute("aria-label")).toMatch(/^Dockings by battery level in 5 % steps, median \d+(\.\d+)? %, \d+ below 15 %$/)
    expect(screen.getByText(/docked below 15 %/)).toBeTruthy()

    fireEvent.click(screen.getByRole("radio", { name: "Table" }))
    const table = screen.getByRole("table")
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(21) // header + 20 bins
    expect(within(rows[1]).getAllByRole("cell")[0].textContent).toBe("0–5 %")
    expect(within(rows[20]).getAllByRole("cell")[0].textContent).toBe("95–100 %")
    const total = rows.slice(1).reduce((s, r) => s + Number(within(r).getAllByRole("cell")[1].textContent), 0)
    expect(total).toBe(240)
  })
})
