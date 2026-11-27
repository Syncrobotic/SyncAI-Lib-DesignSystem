import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { FilterForm, filterUrl } from "@/registry/syncrobotic/ui/filter-form"
import { RouteProgress } from "@/registry/syncrobotic/ui/route-progress"
import { SearchField } from "@/registry/syncrobotic/ui/search-field"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

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
    expect(screen.getAllByRole("radio").map((b) => b.textContent)).toEqual(["A 0", "B 1", "E 4"])
    fireEvent.click(screen.getByRole("button", { name: "2 more" }))
    expect(screen.getAllByRole("radio")).toHaveLength(5)
  })
  it("marks the current link in link mode", () => {
    render(<ChipGroup label="Saved views" value="b" items={items.slice(0, 2).map((c) => ({ ...c, href: `#${c.value}` }))} />)
    expect(screen.getByRole("link", { name: /B/ }).getAttribute("aria-current")).toBe("page")
    expect(screen.getByRole("link", { name: /A/ }).getAttribute("aria-current")).toBeNull()
  })
  it("takes the aria-current value, so a filter row does not mark a second page", () => {
    render(<ChipGroup label="Filters" value="b" current="true" items={items.slice(0, 2).map((c) => ({ ...c, href: `#${c.value}` }))} />)
    expect(screen.getByRole("link", { name: /B/ }).getAttribute("aria-current")).toBe("true")
  })
  it("spreads each chip's props on its button or link, under the group's own attributes", () => {
    const withProps = items.slice(0, 2).map((c) => ({ ...c, props: { "data-testid": `chip-${c.value}`, title: `Only ${c.label}`, className: "extra" } }))
    const { unmount } = render(<ChipGroup label="Task" items={withProps} value="a" onValueChange={() => {}} />)
    const a = screen.getByTestId("chip-a")
    expect(a.getAttribute("title")).toBe("Only A")
    expect(a.className).toContain("extra")
    expect(a.className).toContain("h-(--h-sm)")
    expect(a.getAttribute("data-state")).toBe("on")
    unmount()
    render(<ChipGroup label="Views" value="b" items={withProps.map((c) => ({ ...c, href: `#${c.value}`, props: { ...c.props, "aria-current": "false" as const } }))} />)
    expect(screen.getByTestId("chip-b").getAttribute("aria-current")).toBe("page")
    expect(screen.getByTestId("chip-b").getAttribute("href")).toBe("#b")
  })
  it("chooses several with type multiple, as pressed buttons, and keeps every chosen chip when folded", () => {
    const change = vi.fn()
    render(<ChipGroup type="multiple" label="Task" items={items} value={["a", "e"]} max={2} onValueChange={change} />)
    const buttons = screen.getAllByRole("button", { pressed: true })
    expect(buttons.map((b) => b.textContent)).toEqual(["A 0", "E 4"])
    expect(screen.getByRole("button", { name: /^B/ }).getAttribute("aria-pressed")).toBe("false")
    expect(screen.getByRole("button", { name: "2 more" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /^B/ }))
    expect(change).toHaveBeenLastCalledWith(["a", "e", "b"])
  })
  it("keeps one chosen with allowNone false in multiple", () => {
    const change = vi.fn()
    render(<ChipGroup type="multiple" allowNone={false} label="Task" items={items} value={["a"]} onValueChange={change} />)
    fireEvent.click(screen.getByRole("button", { name: /^A/ }))
    expect(change).not.toHaveBeenCalled()
  })
  it("marks several chosen links as selected, not current", () => {
    render(<ChipGroup type="multiple" label="Task" value={["a", "b"]} items={items.slice(0, 3).map((c) => ({ ...c, href: `#${c.value}` }))} />)
    const a = screen.getByRole("link", { name: /^A.*selected$/ })
    expect(a.getAttribute("aria-current")).toBeNull()
    expect(a.getAttribute("data-state")).toBe("on")
    expect(screen.getByRole("link", { name: /^C/ }).getAttribute("data-state")).toBeNull()
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

  it("runs to the end and fades when the page is in, instead of vanishing mid-way", () => {
    vi.useFakeTimers()
    const { rerender, container } = render(<RouteProgress active delay={300} />)
    act(() => vi.advanceTimersByTime(300))
    rerender(<RouteProgress active={false} delay={300} />)
    const done = container.querySelector("[data-slot=route-progress]") as HTMLElement
    expect(done.getAttribute("data-state")).toBe("done")
    expect(done.className).toContain("animate-disappear")
    expect(done.firstElementChild!.className).not.toContain("scale-x-60")
    act(() => {
      fireEvent.animationEnd(done)
    })
    expect(container.querySelector("[data-slot=route-progress]")).toBeNull()
  })
})
