import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { facetsLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { FacetList, Facets, FacetsDrawer, type Facet, type FacetValue } from "@/registry/syncrobotic/ui/facets"

afterEach(cleanup)

const facets: Facet[] = [
  {
    key: "tier",
    label: "Tier",
    options: [
      { value: "T0", label: "T0 · Open", count: 48210 },
      { value: "T1", label: "T1 · Internal", count: 9120 },
    ],
  },
  {
    key: "task",
    label: "Task",
    options: ["Detection", "Segmentation", "Keypoints", "Depth", "Classification", "Tracking", "Captioning"].map((t, i) => ({ value: t, label: t, count: i })),
  },
]

const boxes = (scope: HTMLElement = document.body) => within(scope).getAllByRole("checkbox")

describe("Facets", () => {
  it("is one group per facet, named by its legend, each option a checkbox with its count in its row", () => {
    render(<FacetList facets={facets} locale="en-US" />)
    const tier = screen.getByRole("group", { name: "Tier" })
    expect(boxes(tier)).toHaveLength(2)
    const rows = [...tier.querySelectorAll("[data-slot=facets-option]")]
    expect(rows.map((r) => r.textContent)).toEqual(["T0 · Open48,210", "T1 · Internal9,120"])
    // The row is a label around the box, so the count is part of the option's name.
    expect(screen.getByRole("checkbox", { name: "T0 · Open 48,210" })).toBeTruthy()
  })

  it("writes the counts in full with grouping, in English without a locale, so the server and the browser agree", () => {
    render(<FacetList facets={facets.slice(0, 1)} />)
    expect(screen.getByRole("checkbox", { name: "T0 · Open 48,210" })).toBeTruthy()
  })

  it("picks and unpicks per facet, held by itself or by the page", () => {
    const changes: FacetValue[] = []
    render(<FacetList facets={facets} onValueChange={(v) => changes.push(v)} />)
    fireEvent.click(screen.getByRole("checkbox", { name: /T1/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /Detection/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /T1/ }))
    expect(changes).toEqual([{ tier: ["T1"] }, { tier: ["T1"], task: ["Detection"] }, { tier: [], task: ["Detection"] }])
    expect(screen.getByRole("checkbox", { name: /Detection/ }).getAttribute("aria-checked")).toBe("true")

    cleanup()
    render(<FacetList facets={facets} value={{ task: ["Depth"] }} />)
    expect(screen.getByRole("checkbox", { name: /Depth/ }).getAttribute("aria-checked")).toBe("true")
    fireEvent.click(screen.getByRole("checkbox", { name: /Depth/ }))
    // Controlled: nothing changes until the page passes a new value.
    expect(screen.getByRole("checkbox", { name: /Depth/ }).getAttribute("aria-checked")).toBe("true")
  })

  it("folds past max, keeps a picked option in view, and says how many in all through labels", () => {
    const { rerender } = render(<FacetList facets={facets} max={3} defaultValue={{ task: ["Captioning"] }} />)
    const task = screen.getByRole("group", { name: "Task" })
    // The tier facet has only 2: no button there.
    expect(within(screen.getByRole("group", { name: "Tier" })).queryByRole("button")).toBeNull()
    expect(boxes(task).map((b) => b.closest("label")!.textContent)).toEqual(["Detection0", "Segmentation1", "Keypoints2", "Captioning6"])
    const more = within(task).getByRole("button", { name: "Show all 7" })
    expect(more.getAttribute("aria-expanded")).toBe("false")
    expect(more.getAttribute("data-slot")).toBe("facets-show-all")
    rerender(<FacetList facets={facets} max={3} locale="zh-TW" labels={facetsLabels} defaultValue={{ task: ["Captioning"] }} />)
    expect(within(task).getByRole("button", { name: "顯示全部 7 個" })).toBeTruthy()
  })

  it("a facet's own max wins over the list's", () => {
    render(<FacetList facets={[{ ...facets[1]!, max: 5 }]} max={2} />)
    expect(boxes()).toHaveLength(5)
    expect(screen.getByRole("button", { name: "Show all 7" })).toBeTruthy()
  })

  it("keyboard: every option is a Tab stop; Show all unfolds the rest and moves focus to the first it shows; folding keeps focus on the button", () => {
    vi.useFakeTimers()
    render(<FacetList facets={facets.slice(1)} max={3} />)
    for (const b of boxes()) {
      expect(b.tagName).toBe("BUTTON")
      expect(b.tabIndex).toBe(0)
    }
    const more = screen.getByRole("button", { name: "Show all 7" })
    expect(document.getElementById(more.getAttribute("aria-controls")!)).toBe(boxes()[0]!.closest("[data-slot=facets-list] [id]"))
    more.focus()
    fireEvent.click(more)
    expect(boxes()).toHaveLength(7)
    expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: /Depth/ }))
    expect(more.getAttribute("aria-expanded")).toBe("true")
    expect(more.textContent).toBe("Show fewer")
    // Enter on a checkbox does nothing (a form is not submitted by it); Space and click toggle it, as a native box.
    fireEvent.keyDown(document.activeElement!, { key: "Enter" })
    expect(screen.getByRole("checkbox", { name: /Depth/ }).getAttribute("aria-checked")).toBe("false")

    more.focus()
    fireEvent.click(more)
    // The unfolded options fade out, then fold; the safety delay folds them when animations do not run.
    act(() => vi.advanceTimersByTime(400))
    expect(boxes()).toHaveLength(3)
    expect(document.activeElement).toBe(more)
    vi.useRealTimers()
  })

  it("the column pins under the shell's bar, scrolls on its own and is named by its title", () => {
    render(<Facets facets={facets} labels={{ title: "Narrow datasets" }} />)
    const aside = screen.getByRole("complementary", { name: "Narrow datasets", hidden: true })
    expect(aside.getAttribute("data-slot")).toBe("facets")
    expect(aside.className).toContain("sticky")
    expect(aside.className).toContain("top-[var(--shell-top,0)]")
    expect(aside.className).toContain("overflow-y-auto")
    // Hidden on phones, where the drawer takes its place.
    expect(aside.className).toMatch(/(?:^|\s)hidden(?:\s|$)/)
    expect(aside.className).toContain("lg:block")
    // Measured: the space under where it pins.
    expect(aside.style.maxHeight).toMatch(/px$/)
  })
})

describe("FacetsDrawer", () => {
  it("is a button on phones that names how many options are on, and opens the same list in a sheet", () => {
    render(<FacetsDrawer facets={facets} defaultValue={{ tier: ["T0"], task: ["Depth", "Tracking"] }} />)
    const trigger = screen.getByRole("button", { name: "Filters 3 active" })
    expect(trigger.getAttribute("data-slot")).toBe("facets-trigger")
    expect(trigger.className).toContain("lg:hidden")
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog")
    fireEvent.click(trigger)
    const sheet = screen.getByRole("dialog", { name: "Filters" })
    expect(within(sheet).getByRole("group", { name: "Tier" })).toBeTruthy()
    expect(within(sheet).getByRole("checkbox", { name: /Depth/ }).getAttribute("aria-checked")).toBe("true")
  })

  it("picks apply at once; Clear all empties them and moves focus to Done; Done closes", () => {
    const changes: FacetValue[] = []
    render(<FacetsDrawer facets={facets} defaultOpen onValueChange={(v) => changes.push(v)} />)
    const sheet = screen.getByRole("dialog", { name: "Filters" })
    const clear = within(sheet).getByRole("button", { name: "Clear all" })
    expect(clear.hasAttribute("disabled")).toBe(true)
    fireEvent.click(within(sheet).getByRole("checkbox", { name: /T1/ }))
    expect(changes).toEqual([{ tier: ["T1"] }])
    expect(screen.getByRole("button", { name: "Filters 1 active", hidden: true })).toBeTruthy()
    fireEvent.click(clear)
    expect(changes.at(-1)).toEqual({})
    expect(document.activeElement).toBe(within(sheet).getByRole("button", { name: "Done" }))
    fireEvent.click(within(sheet).getByRole("button", { name: "Done" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("speaks Traditional Chinese through labels", () => {
    render(<FacetsDrawer facets={facets} labels={facetsLabels} defaultValue={{ tier: ["T0"] }} />)
    expect(screen.getByRole("button", { name: "篩選 1 個已選取" })).toBeTruthy()
  })
})
