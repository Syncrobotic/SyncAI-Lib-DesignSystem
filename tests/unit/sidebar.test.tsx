import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Bell, Bot } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuTag,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/registry/syncrobotic/ui/sidebar"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"

// The sidebar's state: a toggle from the trigger and the shortcut, kept in a cookie, a rail that names its icons in
// tooltips, a sheet on phones that a link closes, and the kit's current look on the current page.

const clearCookie = (name = "sidebar_state") => (document.cookie = `${name}=; path=/; max-age=0`)
beforeEach(() => {
  clearCookie()
  clearCookie("console_sidebar")
  // Ctrl, not ⌘: the shortcut reads the platform.
  vi.spyOn(navigator, "platform", "get").mockReturnValue("Linux x86_64")
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Nav() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Operations</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive tooltip="Robots">
            <a href="#robots">
              <Bot aria-hidden="true" />
              <span>Robots</span>
              <SidebarMenuTag>Beta</SidebarMenuTag>
            </a>
          </SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton href="#robots/fleet">
                <span>Fleet</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Alarms">
            <a href="#alarms">
              <Bell aria-hidden="true" />
              <span>Alarms</span>
              <SidebarMenuBadge count={2} />
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

function Frame(props: Omit<React.ComponentProps<typeof SidebarProvider>, "children">) {
  return (
    <SidebarProvider {...props}>
      <Sidebar>
        <SidebarContent>
          <Nav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <input aria-label="Notes" />
      </SidebarInset>
    </SidebarProvider>
  )
}

const aside = () => document.querySelector<HTMLElement>("aside[data-slot=sidebar]")!

describe("sidebar", () => {
  it("toggles between the open column and the rail from its trigger", () => {
    render(<Frame isMobile={false} />)
    expect(aside().dataset.state).toBe("expanded")
    expect(aside().className).toContain("w-(--sidebar-width)")
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(aside().dataset.state).toBe("collapsed")
    expect(aside().dataset.collapsible).toBe("icon")
    expect(aside().className).toContain("w-18")
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
    expect(aside().dataset.state).toBe("expanded")
  })

  it("starts from defaultOpen, follows a controlled open and reports changes", () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Frame isMobile={false} defaultOpen={false} />)
    expect(aside().dataset.state).toBe("collapsed")
    rerender(<Frame isMobile={false} open onOpenChange={onOpenChange} />)
    expect(aside().dataset.state).toBe("expanded")
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    // Controlled: it stays as the parent says.
    expect(aside().dataset.state).toBe("expanded")
  })

  it("keeps the choice in a cookie, and opens the next page as it was left", () => {
    const { unmount } = render(<Frame isMobile={false} />)
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(document.cookie).toContain("sidebar_state=false")
    unmount()
    render(<Frame isMobile={false} />)
    expect(aside().dataset.state).toBe("collapsed")
  })

  it("writes the cookie it is given, or none", () => {
    const { unmount } = render(<Frame isMobile={false} cookieName="console_sidebar" />)
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(document.cookie).toContain("console_sidebar=false")
    expect(document.cookie).not.toContain("sidebar_state")
    unmount()
    clearCookie("console_sidebar")
    render(<Frame isMobile={false} cookieName={null} />)
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(document.cookie).not.toContain("=false")
  })

  it("names the rail's icons in tooltips, only while collapsed", async () => {
    render(<Frame isMobile={false} />)
    const robots = screen.getByRole("link", { name: /Robots/ })
    act(() => robots.focus())
    expect(screen.queryByRole("tooltip")).toBeNull()
    act(() => robots.blur())
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    act(() => robots.focus())
    expect((await screen.findByRole("tooltip")).textContent).toBe("Robots")
  })

  it("on the rail, a count becomes a dot and the words stay in the link's name", () => {
    render(<Frame isMobile={false} defaultOpen={false} />)
    const alarms = screen.getByRole("link", { name: "Alarms 2" })
    const dot = alarms.querySelector("[data-slot=sidebar-menu-dot]")!
    expect(dot.getAttribute("aria-hidden")).toBe("true")
    expect(dot.hasAttribute("data-sidebar-keep")).toBe(true)
    // Sub-pages hide on the rail (the section is the way in); their list is still in the markup for the open column.
    expect(document.querySelector("[data-slot=sidebar-menu-sub]")!.className).toContain("group-data-[collapsible=icon]/sidebar:hidden")
  })

  it("toggles with Ctrl+B anywhere on the page, but not while typing", () => {
    render(<Frame isMobile={false} />)
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true })
    expect(aside().dataset.state).toBe("collapsed")
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Notes" }), { key: "b", code: "KeyB", ctrlKey: true })
    expect(aside().dataset.state).toBe("collapsed")
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true })
    expect(aside().dataset.state).toBe("expanded")
    expect(screen.getByRole("button", { name: "Collapse sidebar" }).getAttribute("aria-keyshortcuts")).toBe("Control+B")
  })

  it("takes another shortcut, or none", () => {
    const { unmount } = render(<Frame isMobile={false} keyboardShortcut="mod+shift+s" />)
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true })
    expect(aside().dataset.state).toBe("expanded")
    fireEvent.keyDown(window, { key: "S", code: "KeyS", ctrlKey: true, shiftKey: true })
    expect(aside().dataset.state).toBe("collapsed")
    unmount()
    clearCookie()
    render(<Frame isMobile={false} keyboardShortcut={false} />)
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true })
    expect(aside().dataset.state).toBe("expanded")
    expect(screen.getByRole("button", { name: "Collapse sidebar" }).hasAttribute("aria-keyshortcuts")).toBe(false)
  })

  it("is a sheet on phones: the trigger opens it, a link closes it", async () => {
    // A phone-sized screen, read the way the provider reads it.
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({ matches: query === "(max-width: 767px)", media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList,
    )
    render(<Frame />)
    expect(aside()).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }))
    const sheet = await screen.findByRole("dialog", { name: "Navigation" })
    expect(sheet.querySelector("aside[data-mobile=true]")).not.toBeNull()
    fireEvent.click(screen.getByRole("link", { name: "Alarms 2" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    // Ctrl+B opens and closes the sheet, not the desktop column.
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true })
    expect(await screen.findByRole("dialog", { name: "Navigation" })).toBeTruthy()
  })

  it("marks the current page with aria-current and the kit's current look", () => {
    render(<Frame isMobile={false} />)
    const robots = screen.getByRole("link", { name: "Robots Beta" })
    expect(robots.getAttribute("aria-current")).toBe("page")
    expect(robots.dataset.active).toBe("true")
    expect(robots.className).toContain("data-[active=true]:bg-muted")
    expect(robots.className).toContain("data-[active=true]:font-medium")
    const alarms = screen.getByRole("link", { name: "Alarms 2" })
    expect(alarms.hasAttribute("aria-current")).toBe(false)
    expect(alarms.dataset.active).toBeUndefined()
  })

  it("names its landmarks and trigger with labels", () => {
    render(<Frame isMobile={false} labels={{ sidebar: "側邊欄", nav: "主要導覽", collapse: "收合側邊欄" }} />)
    expect(screen.getByRole("complementary", { name: "側邊欄" })).toBeTruthy()
    expect(screen.getByRole("navigation", { name: "主要導覽" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "收合側邊欄" })).toBeTruthy()
  })

  it("useSidebar outside a provider says so", () => {
    function Lost() {
      useSidebar()
      return null
    }
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<Lost />)).toThrow(/SidebarProvider/)
  })
})

describe("app shell on the sidebar", () => {
  it("lists the nav with the current page, its trigger and the account", () => {
    render(
      <AppShell product="Fleet console" nav={sampleNav} current="#robots" title="Robots" user={sampleUser}>
        page
      </AppShell>,
    )
    expect(screen.getByRole("link", { name: "Robots" }).getAttribute("aria-current")).toBe("page")
    expect(screen.getByRole("link", { name: "Alarms 2" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "ML Mei Lin mei.lin@example.com , account menu" })).toBeTruthy()
    // The test screen is 1024 px wide, under 1280: the shell starts as a rail.
    expect(aside().dataset.state).toBe("collapsed")
    fireEvent.keyDown(screen.getByRole("separator", { name: "Resize sidebar" }), { key: "Enter" })
    expect(aside().dataset.state).toBe("expanded")
  })

  it("the handle beside the sidebar: a splitter in the Tab order that folds on a click or Enter", () => {
    render(
      <AppShell product="Fleet console" nav={sampleNav} current="#robots" title="Robots">
        page
      </AppShell>,
    )
    // No trigger inside the sidebar or (on wide screens) in the top bar; the handle is the control.
    expect(aside().querySelector("[data-slot=sidebar-trigger]")).toBeNull()
    const top = document.querySelector("header")!.querySelector<HTMLElement>("[data-slot=sidebar-trigger]")!
    expect(top.dataset.show).toBe("mobile")
    expect(top.className).toContain("md:hidden")
    const rail = screen.getByRole("separator", { name: "Resize sidebar" })
    expect(rail.tabIndex).toBe(0)
    expect(rail.getAttribute("aria-orientation")).toBe("vertical")
    // A rail (the test screen is under 1280 px).
    expect(rail.getAttribute("aria-expanded")).toBe("false")
    expect(rail.getAttribute("aria-valuenow")).toBe("72")
    fireEvent.pointerDown(rail, { button: 0, clientX: 72, pointerId: 1 })
    fireEvent.pointerUp(rail, { button: 0, clientX: 72, pointerId: 1 })
    expect(aside().dataset.state).toBe("expanded")
    expect(rail.getAttribute("aria-valuenow")).toBe("240")
    fireEvent.keyDown(rail, { key: "Enter" })
    expect(aside().dataset.state).toBe("collapsed")
  })

  it("drags to resize between 200 and 320 px, folds under 140 and keeps the width", () => {
    render(
      <AppShell product="Fleet console" nav={sampleNav} current="#robots" title="Robots">
        page
      </AppShell>,
    )
    const rail = screen.getByRole("separator", { name: "Resize sidebar" })
    const wrapper = () => document.querySelector<HTMLElement>("[data-slot=sidebar-wrapper]")!.style.getPropertyValue("--sidebar-width")
    fireEvent.keyDown(rail, { key: "Enter" })
    expect(aside().dataset.state).toBe("expanded")
    fireEvent.pointerDown(rail, { button: 0, clientX: 240, pointerId: 1 })
    fireEvent.pointerMove(rail, { clientX: 300, pointerId: 1 })
    expect(aside().dataset.resizing).toBe("true")
    expect(wrapper()).toBe("300px")
    fireEvent.pointerMove(rail, { clientX: 500, pointerId: 1 })
    expect(wrapper()).toBe("320px")
    fireEvent.pointerUp(rail, { clientX: 500, pointerId: 1 })
    expect(aside().dataset.resizing).toBeUndefined()
    expect(document.cookie).toContain("sidebar_state_width=320")
    // A drag is not a click: still open.
    expect(aside().dataset.state).toBe("expanded")
    fireEvent.pointerDown(rail, { button: 0, clientX: 320, pointerId: 1 })
    fireEvent.pointerMove(rail, { clientX: 100, pointerId: 1 })
    fireEvent.pointerUp(rail, { clientX: 100, pointerId: 1 })
    expect(aside().dataset.state).toBe("collapsed")
    expect(wrapper()).toBe("320px")
  })

  it("resizes from the keyboard: ← and → by 16 px, ← at the narrowest folds, → opens the rail", () => {
    document.cookie = "sidebar_state_width=; path=/; max-age=0"
    render(
      <AppShell product="Fleet console" nav={sampleNav} current="#robots" title="Robots">
        page
      </AppShell>,
    )
    const rail = screen.getByRole("separator", { name: "Resize sidebar" })
    fireEvent.keyDown(rail, { key: "ArrowRight" })
    expect(aside().dataset.state).toBe("expanded")
    expect(rail.getAttribute("aria-valuenow")).toBe("240")
    fireEvent.keyDown(rail, { key: "ArrowRight" })
    expect(rail.getAttribute("aria-valuenow")).toBe("256")
    for (let i = 0; i < 4; i++) fireEvent.keyDown(rail, { key: "ArrowLeft" })
    expect(rail.getAttribute("aria-valuenow")).toBe("200")
    fireEvent.keyDown(rail, { key: "ArrowLeft" })
    expect(aside().dataset.state).toBe("collapsed")
  })

  it("on phones, the top bar's trigger is the menu button and the sidebar has no collapse button", () => {
    render(
      <SidebarProvider isMobile cookieName={null}>
        <Sidebar>
          <SidebarContent>
            <SidebarTrigger show="expanded" />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger show="collapsed" />
        </SidebarInset>
      </SidebarProvider>,
    )
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeTruthy()
  })

  it("shows a section's pages under it while one of them is current", () => {
    const nav = [{ items: [{ ...sampleNav[0]!.items[1]!, items: [{ label: "Fleet", href: "#robots/fleet" }, { label: "Maintenance", href: "#robots/maintenance", tag: "New" }] }] }]
    const { rerender } = render(
      <AppShell product="Fleet console" nav={nav} current="#overview" title="Overview">
        page
      </AppShell>,
    )
    expect(screen.queryByRole("link", { name: "Fleet" })).toBeNull()
    rerender(
      <AppShell product="Fleet console" nav={nav} current="#robots/fleet" title="Fleet">
        page
      </AppShell>,
    )
    expect(screen.getByRole("link", { name: "Fleet" }).getAttribute("aria-current")).toBe("page")
    expect(screen.getByRole("link", { name: "Robots" }).getAttribute("aria-current")).toBe("true")
    expect(screen.getByRole("link", { name: "Maintenance New" })).toBeTruthy()
  })
})
