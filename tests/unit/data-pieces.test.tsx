import type * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LoadMore } from "@/registry/syncrobotic/ui/load-more"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { RestrictedPreview } from "@/registry/syncrobotic/ui/restricted-preview"
import { ShareBar, ShareLegend, type ShareSegment } from "@/registry/syncrobotic/ui/share-bar"

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
  it("makes the legend entry of a part with href a link named with its share, and leaves the bar a picture", () => {
    const Router = ({ href, ...rest }: React.ComponentProps<"a">) => <a data-router="" href={`/app${href}`} {...rest} />
    const { container } = render(
      <ShareBar
        label="Items by source"
        legend
        locale="de"
        linkAs={Router}
        segments={[
          { key: "a", label: "Source A", value: 4200, href: "?source=a" },
          { key: "b", label: "Source B", value: 4133 },
          { key: "c", label: "Source C", value: 1667, href: "?source=c" },
        ]}
      />,
    )
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute("href")).toBe("/app?source=a")
    expect(links[0].hasAttribute("data-router")).toBe(true)
    expect(links[0].textContent).toBe("Source A 4.200 (42 %)")
    expect(links[1].textContent).toContain(" (16,7 %)")
    expect(container.querySelector("[data-slot=share-bar] a")).toBeNull()
    expect(screen.getByText(/Source B/).closest("a")).toBeNull()
  })
  it("draws plain links by default", () => {
    render(<ShareBar label="x" legend segments={[{ key: "a", label: "A", value: 1, href: "/a" }]} />)
    expect(screen.getByRole("link").tagName).toBe("A")
  })
})

describe("ShareLegend", () => {
  const parts = [
    { key: "manual", label: "Manual" },
    { key: "model", label: "Model" },
    { key: "x", label: "Extra" },
    { key: "other", label: "Other", tone: "other" as const },
  ]
  const dots = (root: ParentNode) => [...root.querySelectorAll("[aria-hidden=true]")].map((d) => d.className.match(/bg-chart-\d/)?.[0])
  it("colours each entry as ShareBar colours the same segment, by order, and keeps entries whose rows are empty", () => {
    const { container } = render(
      <>
        <ShareLegend segments={parts} />
        <ShareBar label="Row" segments={parts.map((p) => ({ ...p, value: 1 }))} />
      </>,
    )
    const legend = container.querySelector("[data-slot=share-legend]")!
    const bar = [...container.querySelectorAll("[data-slot=share-bar] span")].map((s) => s.className.match(/bg-chart-\d/)?.[0])
    expect(dots(legend)).toEqual(["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"])
    expect(dots(legend)).toEqual(bar)
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Manual", "Model", "Extra", "Other"])
  })
  it("writes a value after its label only when given, in the locale, and has no links", () => {
    // A ShareBar segment fits as it is; its href is the bar's business, not the legend's.
    const a: ShareSegment = { key: "a", label: "A", value: 4200, href: "/a" }
    render(<ShareLegend locale="de" segments={[a, { key: "b", label: "B" }]} />)
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["A 4.200", "B"])
    expect(screen.queryByRole("link")).toBeNull()
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

  it("moves focus to the count when the last press removes the button, instead of losing it to the page", () => {
    const { rerender } = render(<LoadMore shown={40} total={53} step={20} onMore={() => {}} />)
    const button = screen.getByRole("button", { name: "Show 13 more (13 left)" })
    button.focus()
    fireEvent.click(button)
    rerender(<LoadMore shown={53} total={53} step={20} onMore={() => {}} />)
    expect(document.activeElement).toBe(screen.getByText("Showing 53 of 53"))
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
