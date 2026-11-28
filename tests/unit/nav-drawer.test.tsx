import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/components/c40", useSearchParams: () => new URLSearchParams() }))

import { NavDrawer } from "@/site/nav-drawer"
import { rememberArea } from "@/site/nav-data"
import type { AreaNav } from "@/site/scopes"

const scopes = [
  { key: "docs", label: "Docs", href: "/docs", match: ["/docs"] },
  { key: "components", label: "Components", href: "/docs/components", match: ["/docs/components"] },
]
const docs: AreaNav = { key: "docs", label: "Docs", groups: [{ title: "Start", links: [{ href: "/docs", label: "Introduction" }] }] }
const components: AreaNav = {
  key: "components",
  label: "Components",
  groups: [{ title: "All", links: Array.from({ length: 60 }, (_, i) => ({ href: `/docs/components/c${i}`, label: `C${i}` })) }],
}

// The drawer's other areas come from /nav.json; the page's own is there from its sidebar.
const fetchNav = vi.fn(async () => new Response(JSON.stringify([docs, components])))
vi.stubGlobal("fetch", fetchNav)

describe("NavDrawer areas", () => {
  it("shows the area's front page until its pages arrive, then asks /nav.json once", async () => {
    let answer!: (r: Response) => void
    fetchNav.mockImplementationOnce(() => new Promise<Response>((r) => (answer = r)))
    render(<NavDrawer scopes={scopes} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open navigation" })))
    expect(fetchNav).toHaveBeenCalledWith("/nav.json")
    expect(screen.getByRole("link", { name: "Components" }).getAttribute("href")).toBe("/docs/components")
    expect(screen.queryByRole("link", { name: "C40" })).toBeNull()
    await act(async () => answer(new Response(JSON.stringify([docs, components]))))
    expect(screen.getByRole("link", { name: "C40" })).toBeTruthy()
    expect(fetchNav).toHaveBeenCalledTimes(1)
  })
})

// The phone drawer opened scrolled as a whole: the brand, Close and the area tabs scrolled away with the list, and focus
// sat on a Close button off screen. The header now stays put and only the list scrolls.
describe("NavDrawer", () => {
  beforeAll(() => {
    rememberArea(docs)
    rememberArea(components)
  })

  it("keeps brand, Close and the area tabs out of the scrolling list, and focuses Close", async () => {
    render(<NavDrawer scopes={scopes} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open navigation" })))
    const dialog = screen.getByRole("dialog")
    const list = dialog.querySelector<HTMLElement>("[data-scroll]")!
    expect(list).not.toBe(dialog)
    const close = screen.getByRole("button", { name: "Close navigation" })
    expect(list.contains(close)).toBe(false)
    expect(list.contains(screen.getByRole("tablist", { name: "Areas" }))).toBe(false)
    expect(list.contains(screen.getByRole("link", { name: "C40" }))).toBe(true)
    expect(document.activeElement).toBe(close)
  })

  it("draws the header's edge only once the list has scrolled", async () => {
    render(<NavDrawer scopes={scopes} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open navigation" })))
    const list = screen.getByRole("dialog").querySelector<HTMLElement>("[data-scroll]")!
    const tabs = screen.getByRole("tablist", { name: "Areas" })
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

  it("switches area with a tab, without leaving the page", async () => {
    render(<NavDrawer scopes={scopes} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open navigation" })))
    expect(screen.getByRole("tab", { name: "Components" }).getAttribute("aria-selected")).toBe("true")
    const docs = screen.getByRole("tab", { name: "Docs" })
    expect(docs.tagName).toBe("BUTTON")
    act(() => fireEvent.click(docs))
    expect(docs.getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("tabpanel", { name: "Docs" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Introduction" })).toBeTruthy()
    expect(screen.queryByRole("link", { name: "C40" })).toBeNull()
    act(() => fireEvent.keyDown(docs, { key: "ArrowRight" }))
    expect(screen.getByRole("tab", { name: "Components" }).getAttribute("aria-selected")).toBe("true")
  })
})
