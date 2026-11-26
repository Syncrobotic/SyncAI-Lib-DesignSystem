import { readFileSync } from "node:fs"
import * as React from "react"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { barListLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { BarList, type BarListItem } from "@/registry/syncrobotic/ui/bar-list"

afterEach(cleanup)

const items: BarListItem[] = [
  { key: "person", label: "person", value: 400000, href: "/classes/person" },
  { key: "pallet", label: "pallet", value: 200000 },
  { key: "box", label: "box", value: 1 },
  { key: "cone", label: "cone", value: 0 },
]

const bars = () => [...document.querySelectorAll<HTMLElement>("[data-slot=bar-list-bar]")]

describe("BarList", () => {
  it("is a list named by its label, each row's value in its text, so it needs no table view", () => {
    render(<BarList label="Items by class" items={items} locale="en-US" />)
    const list = screen.getByRole("list", { name: "Items by class" })
    const rows = within(list).getAllByRole("listitem")
    expect(rows.map((r) => r.textContent)).toEqual(["person400,000", "pallet200,000", "box1", "cone0"])
    // The bar is a picture of the written value: hidden from screen readers.
    for (const b of bars()) expect(b.closest("[aria-hidden=true]")).not.toBeNull()
  })

  it("scales the bars to the largest value, in --chart-1 only, and a value above zero keeps a sliver", () => {
    render(<BarList label="Items by class" items={items} />)
    expect(bars().map((b) => b.style.width)).toEqual(["100%", "50%", `${(1 / 400000) * 100}%`, "0%"])
    for (const b of bars()) {
      expect(b.className).toContain("bg-chart-1")
      expect(b.className).not.toMatch(/bg-(?:chart-[2-5]|warning|danger|info|success)/)
    }
    expect(bars()[2].className).toContain("min-w-1")
    expect(bars()[3].className).not.toContain("min-w-1")
    // The width moves with the motion token, which reduced motion makes instant.
    expect(bars()[0].className).toContain("duration-(--motion-base)")
  })

  it("rows with href are links through linkAs, a target of --h-sm (44 px on touch) with the ring inside", () => {
    const Router = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>((props, ref) => <a ref={ref} data-router="" {...props} />)
    render(<BarList label="Items by class" items={items} linkAs={Router} locale="en-US" />)
    const link = screen.getByRole("link", { name: "person 400,000" })
    expect(link.getAttribute("href")).toBe("/classes/person")
    expect(link.hasAttribute("data-router")).toBe(true)
    expect(link.getAttribute("data-slot")).toBe("bar-list-link")
    expect(link.className).toContain("min-h-(--h-sm)")
    expect(link.className).toContain("focus-visible:-outline-offset-2")
    expect(screen.getAllByRole("link")).toHaveLength(1)
  })

  it("writes values grouped in English without a locale (formatNumber), and by the locale and format when asked", () => {
    const { rerender } = render(<BarList label="L" items={items.slice(0, 1)} />)
    expect(screen.getByRole("listitem").textContent).toContain("400,000")
    rerender(<BarList label="L" items={items.slice(0, 1)} locale="en-US" format={{ notation: "compact" }} />)
    expect(screen.getByRole("listitem").textContent).toContain("400K")
  })

  it("shows max rows, then says how many more through labels, keeping the scale of all the items", () => {
    const many = [{ key: "big", label: "big", value: 1000 }, ...Array.from({ length: 1205 }, (_, i) => ({ key: `k${i}`, label: `k${i}`, value: 500 }))]
    const { rerender } = render(<BarList label="L" items={many} max={2} locale="en-US" />)
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(screen.getByText("1,204 more")).toBeTruthy()
    expect(bars().map((b) => b.style.width)).toEqual(["100%", "50%"])
    rerender(<BarList label="L" items={many} max={2} locale="zh-TW" labels={barListLabels} />)
    expect(screen.getByText("還有 1,204 項")).toBeTruthy()
  })

  it("says it is empty, through labels, with no list", () => {
    render(<BarList label="L" items={[]} labels={{ empty: "No classes yet" }} />)
    expect(screen.queryByRole("list")).toBeNull()
    expect(screen.getByText("No classes yet")).toBeTruthy()
  })

  it("has no surface of its own and no chart library", () => {
    const { container } = render(<BarList label="L" items={items} />)
    const root = container.firstElementChild!
    expect(root.getAttribute("data-slot")).toBe("bar-list")
    expect(root.className).not.toMatch(/(?:^|\s)(?:bg-|ring-|shadow|border|rounded|p-)/)
    const src = readFileSync("registry/syncrobotic/ui/bar-list.tsx", "utf8")
    expect(src).not.toMatch(/recharts|from "@\/registry\/syncrobotic\/ui\/chart"/)
  })
})
