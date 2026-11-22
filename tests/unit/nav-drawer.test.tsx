import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/components/c40", useSearchParams: () => new URLSearchParams() }))

import { NavDrawer } from "@/site/nav-drawer"
import type { Scope } from "@/site/scopes"

const scopes: Scope[] = [
  { key: "docs", label: "Docs", href: "/docs", match: ["/docs"], groups: [{ title: "Start", links: [{ href: "/docs", label: "Introduction" }] }] },
  {
    key: "components",
    label: "Components",
    href: "/docs/components",
    match: ["/docs/components"],
    groups: [{ title: "All", links: Array.from({ length: 60 }, (_, i) => ({ href: `/docs/components/c${i}`, label: `C${i}` })) }],
  },
]

// The phone drawer opened scrolled as a whole: the brand, Close and the area tabs scrolled away with the list, and focus
// sat on a Close button off screen. The header now stays put and only the list scrolls.
describe("NavDrawer", () => {
  it("keeps brand, Close and the area tabs out of the scrolling list, and focuses Close", async () => {
    render(<NavDrawer scopes={scopes} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open navigation" })))
    const dialog = screen.getByRole("dialog")
    const list = dialog.querySelector<HTMLElement>("[data-scroll]")!
    expect(list).not.toBe(dialog)
    const close = screen.getByRole("button", { name: "Close navigation" })
    expect(list.contains(close)).toBe(false)
    expect(list.contains(screen.getByRole("list", { name: "Areas" }))).toBe(false)
    expect(list.contains(screen.getByRole("link", { name: "C40" }))).toBe(true)
    expect(document.activeElement).toBe(close)
  })

  it("draws the header's edge only once the list has scrolled", async () => {
    render(<NavDrawer scopes={scopes} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open navigation" })))
    const list = screen.getByRole("dialog").querySelector<HTMLElement>("[data-scroll]")!
    const tabs = screen.getByRole("list", { name: "Areas" })
    act(() => {
      list.scrollTop = 0
      fireEvent.scroll(list)
    })
    expect(tabs.className).toContain("border-transparent")
    act(() => {
      list.scrollTop = 200
      fireEvent.scroll(list)
    })
    expect(tabs.className).toContain("border-border")
  })
})
