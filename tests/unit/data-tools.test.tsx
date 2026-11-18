import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { FilterForm, filterUrl } from "@/registry/syncrobotic/ui/filter-form"
import { RouteProgress } from "@/registry/syncrobotic/ui/route-progress"
import { SearchField } from "@/registry/syncrobotic/ui/search-field"

afterEach(() => vi.useRealTimers())

describe("filterUrl", () => {
  it("keeps non-empty fields in order and drops the page number", () => {
    const data: [string, string][] = [
      ["q", "forklift"],
      ["tier", ""],
      ["page", "3"],
      ["task", "detect"],
    ]
    expect(filterUrl("/catalog", data)).toBe("/catalog?q=forklift&task=detect")
  })
  it("is the bare path when nothing is set", () => {
    expect(filterUrl("/catalog", [["q", ""]])).toBe("/catalog")
  })
})

describe("FilterForm", () => {
  it("applies a pick at once, and typing after the delay as one history entry", () => {
    vi.useFakeTimers()
    const go = vi.fn()
    render(
      <FilterForm action="/catalog" onNavigate={go} delay={400}>
        <input name="q" aria-label="Search" />
        <input type="checkbox" name="ready" value="1" aria-label="Ready" />
      </FilterForm>,
    )
    fireEvent.click(screen.getByLabelText("Ready")) // a click on a checkbox fires its input event
    expect(go).toHaveBeenLastCalledWith("/catalog?ready=1", "push")

    const q = screen.getByLabelText("Search") as HTMLInputElement
    q.value = "fork"
    fireEvent.input(q)
    expect(go).toHaveBeenCalledTimes(1) // waits until typing stops
    act(() => vi.advanceTimersByTime(400))
    expect(go).toHaveBeenLastCalledWith("/catalog?q=fork&ready=1", "push")
  })
})

describe("ChipGroup", () => {
  const items = ["a", "b", "c", "d", "e"].map((v, i) => ({ value: v, label: v.toUpperCase(), count: i }))
  it("folds after max but keeps the selected chip, and unfolds", () => {
    render(<ChipGroup label="Task" items={items} value="e" max={2} onValueChange={() => {}} />)
    expect(screen.getAllByRole("radio").map((b) => b.textContent)).toEqual(["A0", "B1", "E4"])
    fireEvent.click(screen.getByRole("button", { name: "2 more" }))
    expect(screen.getAllByRole("radio")).toHaveLength(5)
  })
  it("marks the current link in link mode", () => {
    render(<ChipGroup label="Saved views" value="b" items={items.slice(0, 2).map((c) => ({ ...c, href: `#${c.value}` }))} />)
    expect(screen.getByRole("link", { name: /B/ }).getAttribute("aria-current")).toBe("page")
    expect(screen.getByRole("link", { name: /A/ }).getAttribute("aria-current")).toBeNull()
  })
})

describe("SearchField", () => {
  it("focuses on / and opens the results page on Enter", () => {
    const go = vi.fn()
    render(<SearchField label="Search the data" onNavigate={go} />)
    const box = screen.getByRole("searchbox", { name: "Search the data" }) as HTMLInputElement
    fireEvent.keyDown(window, { key: "/" })
    expect(document.activeElement).toBe(box)
    box.value = "night shift"
    fireEvent.submit(box.form!)
    expect(go).toHaveBeenCalledWith("/search?q=night%20shift", "push")
  })
  it("does not steal / while typing in another field", () => {
    render(
      <>
        <input aria-label="Other" />
        <SearchField label="Search the data" />
      </>,
    )
    const other = screen.getByLabelText("Other")
    other.focus()
    fireEvent.keyDown(other, { key: "/" })
    expect(document.activeElement).toBe(other)
  })
})

describe("RouteProgress", () => {
  it("shows only after the delay, and goes when the page is in", () => {
    vi.useFakeTimers()
    const { rerender } = render(<RouteProgress active delay={300} />)
    expect(screen.queryByRole("progressbar")).toBeNull()
    act(() => vi.advanceTimersByTime(300))
    expect(screen.getByRole("progressbar")).toBeTruthy()
    rerender(<RouteProgress active={false} delay={300} />)
    expect(screen.queryByRole("progressbar")).toBeNull()
  })
})
