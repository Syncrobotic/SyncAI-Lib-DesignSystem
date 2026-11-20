import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LoadMore } from "@/registry/syncrobotic/ui/load-more"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { RestrictedPreview } from "@/registry/syncrobotic/ui/restricted-preview"
import { ShareBar } from "@/registry/syncrobotic/ui/share-bar"

afterEach(cleanup)

describe("ShareBar", () => {
  it("reads as one sentence and sizes segments by share, skipping empty ones", () => {
    render(
      <ShareBar
        label="Images by use"
        segments={[
          { key: "a", label: "Train", value: 75 },
          { key: "b", label: "Test", value: 25 },
          { key: "c", label: "Other", value: 0 },
        ]}
      />,
    )
    const bar = screen.getByRole("img", { name: "Images by use: Train 75, Test 25" })
    const parts = bar.querySelectorAll("span")
    expect(parts).toHaveLength(2)
    expect((parts[0] as HTMLElement).style.width).toBe("75%")
  })
  it("keeps colour by order, not by size", () => {
    const { container } = render(<ShareBar label="x" segments={[{ key: "a", label: "A", value: 1 }, { key: "b", label: "B", value: 9 }]} />)
    const [a, b] = container.querySelectorAll("[data-slot=share-bar] span")
    expect(a.className).toContain("bg-chart-1")
    expect(b.className).toContain("bg-chart-2")
  })
  it("gives a fourth part and more the Other grey, never a new colour, and shows the part not shown as the track", () => {
    const segments = ["a", "b", "c", "d", "e"].map((key) => ({ key, label: key, value: 1 }))
    const { container } = render(<ShareBar label="x" total={10} segments={segments} />)
    const parts = [...container.querySelectorAll("[data-slot=share-bar] span")].map((s) => s.className)
    expect(parts.slice(0, 5).map((c) => c.match(/bg-chart-\d/)?.[0])).toEqual(["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-4"])
    expect(parts[5]).toContain("bg-track")
  })
})

describe("LoadMore", () => {
  it("says how many the next press adds and how many remain, and goes when all are shown", () => {
    const more = vi.fn()
    const { rerender } = render(<LoadMore shown={40} total={53} step={20} onMore={more} />)
    fireEvent.click(screen.getByRole("button", { name: "Show 13 more (13 left)" }))
    expect(more).toHaveBeenCalled()
    rerender(<LoadMore shown={53} total={53} step={20} onMore={more} />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.getByText("Showing 53 of 53")).toBeTruthy()
  })
})

describe("RestrictedPreview", () => {
  it("renders nothing of the preview until asked, then reports the reveal", () => {
    const reveal = vi.fn()
    render(
      <RestrictedPreview restricted reason="T2 · faces" onReveal={reveal}>
        <img alt="Sample" src="data:," />
      </RestrictedPreview>,
    )
    expect(screen.queryByAltText("Sample")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Restricted: show preview/ }))
    expect(screen.getByAltText("Sample")).toBeTruthy()
    expect(reveal).toHaveBeenCalledTimes(1)
  })
})

describe("Pagination link mode", () => {
  it("makes pages links, keeps a missing end a disabled button, and routes through onNavigate", () => {
    const go = vi.fn()
    render(<Pagination page={0} pageSize={10} total={30} pages href={(p) => `?page=${p + 1}`} onNavigate={go} />)
    expect(screen.getByRole("link", { name: "Page 2" }).getAttribute("href")).toBe("?page=2")
    expect((screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("link", { name: "Next page" }))
    expect(go).toHaveBeenCalledWith("?page=2", "push")
  })
})
