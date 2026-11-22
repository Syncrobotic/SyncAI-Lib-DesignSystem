import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"
import { AppShell } from "@/registry/syncrobotic/blocks/app-shell"
import { AppShellMobileTabs } from "@/registry/syncrobotic/blocks/app-shell-mobile-tabs"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const tabs = (sticky?: boolean) =>
  render(
    <Tabs defaultValue="overview" data-testid="root">
      <TabsList sticky={sticky} aria-label="Dataset">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="browse">Browse</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Long overview</TabsContent>
      <TabsContent value="browse">Grid</TabsContent>
    </Tabs>,
  )

/** Where the tabs' section and its list sit on screen. */
const place = (rootTop: number, listTop: number) => {
  const root = screen.getByTestId("root")
  const list = screen.getByRole("tablist")
  vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ top: rootTop } as DOMRect)
  vi.spyOn(list, "getBoundingClientRect").mockReturnValue({ top: listTop } as DOMRect)
}

const pick = (name: string) => fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0 })

describe("TabsList sticky", () => {
  it("is a plain row by default", () => {
    tabs()
    const list = screen.getByRole("tablist")
    expect(list.hasAttribute("data-sticky")).toBe(false)
    expect(list.className).toContain("relative")
    expect(list.className).not.toMatch(/(^| )sticky( |$)/)
  })

  it("sticks under the shell's bar, on the shell's surface, below the bar", () => {
    tabs(true)
    const list = screen.getByRole("tablist")
    expect(list.hasAttribute("data-sticky")).toBe(true)
    expect(list.className).toMatch(/(^| )sticky( |$)/)
    expect(list.className).toContain("top-[var(--shell-top,0)]")
    expect(list.className).toContain("bg-[var(--shell-surface,var(--color-background))]")
    expect(list.className).toContain("z-10")
  })

  it("picking a tab while stuck scrolls back to the start of the tabs", async () => {
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {})
    tabs(true)
    // Stuck at 64 px (under the bar) while the section began 900 px further up.
    place(-836, 64)
    pick("Browse")
    await waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ top: -900 }))
  })

  it("does not scroll when the row is in its own place", async () => {
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {})
    tabs(true)
    place(300, 300)
    pick("Browse")
    await waitFor(() => expect(screen.getByRole("tab", { name: "Browse" }).getAttribute("data-state")).toBe("active"))
    await new Promise((r) => queueMicrotask(() => r(null)))
    expect(scrollBy).not.toHaveBeenCalled()
  })

  it("a list without sticky never scrolls the page", async () => {
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {})
    tabs()
    place(-836, 64)
    pick("Browse")
    await waitFor(() => expect(screen.getByRole("tab", { name: "Browse" }).getAttribute("data-state")).toBe("active"))
    await new Promise((r) => queueMicrotask(() => r(null)))
    expect(scrollBy).not.toHaveBeenCalled()
  })
})

describe("shells set --shell-top and --shell-surface", () => {
  it("top-bar-shell: the floating bar's bottom edge, on the background", () => {
    const { container } = render(
      <TopBarShell product="Fleet portal" links={[{ label: "Overview", href: "#o" }]}>
        Page
      </TopBarShell>,
    )
    const root = container.firstElementChild!
    expect(root.className).toContain("[--shell-top:calc(var(--h-row)+--spacing(2))]")
    expect(root.className).toContain("[--shell-surface:var(--color-background)]")
  })

  it("app-shell: 0, since the page scrolls under the bar inside main; the card surface when inset", () => {
    const { container } = render(
      <AppShell product="DataCore" nav={[]} title="Catalog">
        Page
      </AppShell>,
    )
    const root = container.querySelector("[data-slot=sidebar-wrapper]") ?? container.firstElementChild!
    expect(root.className).toContain("[--shell-top:0]")
    expect(root.className).toContain("[--shell-surface:var(--color-card)]")
  })

  it("app-shell-mobile-tabs: the bar's measured height", () => {
    // As browsers do: an observer reports the size it starts with.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private cb: ResizeObserverCallback) {}
        observe() {
          this.cb([], this as unknown as ResizeObserver)
        }
        unobserve() {}
        disconnect() {}
      },
    )
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(61)
    const { container } = render(<AppShellMobileTabs>Page</AppShellMobileTabs>)
    vi.unstubAllGlobals()
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain("[--shell-top:var(--h-lg)]")
    expect(root.style.getPropertyValue("--shell-top")).toBe("61px")
  })
})
