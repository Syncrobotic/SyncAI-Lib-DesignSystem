import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import * as catalog from "@/registry/syncrobotic/blocks/data-catalog"
import { DataCatalog, DataCatalogContent } from "@/registry/syncrobotic/blocks/data-catalog"
import { DatasetDetail, DatasetDetailContent } from "@/registry/syncrobotic/blocks/dataset-detail"
import { GovernanceTodo, GovernanceTodoContent } from "@/registry/syncrobotic/blocks/governance-todo"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"
import { tierBadgeLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { TierBadge, tiers } from "@/registry/syncrobotic/ui/tier-badge"

afterEach(cleanup)

// The sample frame is AppShell: its sidebar navigation and the title in its top bar.
const framed = () => screen.queryByRole("heading", { level: 1 })

describe("data blocks: content and frame", () => {
  it.each([
    ["DataCatalog", DataCatalog, "Catalog"],
    ["DatasetDetail", DatasetDetail, "Catalog"],
    ["GovernanceTodo", GovernanceTodo, "Governance"],
  ] as const)("%s still renders its sample shell", (_, Block, title) => {
    render(<Block />)
    expect(framed()?.textContent).toBe(title)
  })

  it.each([
    ["DataCatalogContent", DataCatalogContent, () => screen.getByRole("searchbox", { name: "Search datasets" })],
    ["DatasetDetailContent", DatasetDetailContent, () => screen.getByRole("tablist", { name: "Dataset" })],
    ["GovernanceTodoContent", GovernanceTodoContent, () => screen.getByRole("list", { name: "To-do" })],
  ] as const)("%s renders without a shell, inside the product's own", (_, Content, part) => {
    render(
      <TopBarShell product="DataCore" links={[{ label: "Catalog", href: "#catalog" }]}>
        <Content />
      </TopBarShell>,
    )
    expect(framed()).toBeNull()
    expect(screen.getAllByRole("main")).toHaveLength(1)
    expect(part()).toBeTruthy()
  })

  it("the content takes the block's props", () => {
    render(<DatasetDetailContent name="Warehouse LiDAR sweeps" tier="T2" />)
    expect(screen.getByRole("heading", { name: "Warehouse LiDAR sweeps" })).toBeTruthy()
    expect(screen.getByText("T2")).toBeTruthy()
  })

  it("data-catalog still exports the tier badge, from tier-badge", () => {
    expect(catalog.TierBadge).toBe(TierBadge)
    expect(catalog.tiers).toBe(tiers)
  })
})

describe("DataCatalog: a source row unfolds its label layers", () => {
  const toggle = () => screen.getByRole("button", { name: "3 label layers of Night parking lot people" })

  it("is a button that says whether it is open and which rows it shows", () => {
    render(<DataCatalogContent />)
    const button = toggle()
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(button.getAttribute("aria-controls")).toBeNull()
    expect(screen.queryByRole("link", { name: /labels\/coco@v2/ })).toBeNull()

    fireEvent.click(button)
    expect(button.getAttribute("aria-expanded")).toBe("true")
    const ids = button.getAttribute("aria-controls")!.split(" ")
    expect(ids).toHaveLength(3)
    const rows = ids.map((id) => document.getElementById(id))
    expect(rows.every((r) => r?.tagName === "TR")).toBe(true)
    // Each layer links to its own page and carries its mono ref line.
    const link = within(rows[0]!).getByRole("link")
    expect(link.getAttribute("href")).toBe("#labels/coco@v2")
    expect(link.textContent).toContain("labels/coco@v2")
    expect(link.querySelector(".font-mono")?.textContent).toBe("labels/coco@v2")
  })

  it("toggles with Enter and Space and keeps focus on the toggle", () => {
    vi.useFakeTimers()
    render(<DataCatalogContent />)
    const button = toggle()
    button.focus()
    // A native button, so Enter and Space press it; the test DOM does not turn a key into a click, so it is fired too.
    expect(button.tagName).toBe("BUTTON")
    fireEvent.keyDown(button, { key: "Enter" })
    fireEvent.click(button)
    expect(button.getAttribute("aria-expanded")).toBe("true")
    expect(document.activeElement).toBe(button)
    fireEvent.keyUp(button, { key: " " })
    fireEvent.click(button)
    expect(button.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(button)
    // The layers leave (fade out), then are gone.
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByRole("link", { name: /labels\/coco@v2/ })).toBeNull()
    vi.useRealTimers()
  })

  it("finds a source by a layer's ref", () => {
    render(<DataCatalogContent />)
    fireEvent.change(screen.getByRole("searchbox", { name: "Search datasets" }), { target: { value: "labels/pose-auto" } })
    expect(screen.getByText("1 of 6 datasets")).toBeTruthy()
    expect(toggle()).toBeTruthy()
  })
})

describe("TierBadge", () => {
  it("shows the code and its words", () => {
    render(<TierBadge tier="T1" />)
    expect(screen.getByText("T1").parentElement?.textContent).toBe("T1 · Non-commercial")
  })

  it("compact shows the code alone, and keeps the words for screen readers", () => {
    render(<TierBadge tier="T3" compact />)
    const words = screen.getByText("· On-premises only", { exact: false })
    expect(words.className).toContain("sr-only")
  })

  it("takes its words from labels", () => {
    render(<TierBadge tier="T0" labels={tierBadgeLabels} />)
    expect(screen.getByText("T0").parentElement?.textContent).toBe("T0 · 可商用")
  })

  it("is grey for T0 and outlined for the restricted tiers, never a status colour", () => {
    expect(tiers.T0.tone).toBe("neutral")
    for (const t of ["T1", "T2", "T3"] as const) expect(tiers[t].tone).toBe("outline")
  })
})
