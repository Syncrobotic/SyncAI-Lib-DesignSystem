import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Bot } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/registry/syncrobotic/ui/sidebar?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own components) and the sidebar
// imported with ?react-compiler, so these check that the compiled provider still follows its state: the trigger, the
// shortcut and the cookie each reach every reader of useSidebar, and the rail's tooltip follows the state.

beforeEach(() => {
  document.cookie = "sidebar_state=; path=/; max-age=0"
  vi.spyOn(navigator, "platform", "get").mockReturnValue("Linux x86_64")
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** A product's own component that reads the state, as a page header would. */
function State() {
  const { state, open } = useSidebar()
  return (
    <p data-testid="state">
      {state} {String(open)}
    </p>
  )
}

function Frame() {
  return (
    <SidebarProvider isMobile={false}>
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Robots">
                <Bot aria-hidden="true" />
                <span>Robots</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarTrigger />
      <State />
    </SidebarProvider>
  )
}

const state = () => screen.getByTestId("state").textContent

describe("sidebar, compiled", () => {
  it("follows the trigger and the shortcut in every reader", () => {
    render(<Frame />)
    expect(state()).toBe("expanded true")
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(state()).toBe("collapsed false")
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true })
    expect(state()).toBe("expanded true")
    // The handler the shortcut calls is the latest one, not the first render's: a second press collapses again.
    fireEvent.keyDown(window, { key: "b", code: "KeyB", ctrlKey: true })
    expect(state()).toBe("collapsed false")
  })

  it("reads the stored choice and shows the rail's tooltip", async () => {
    document.cookie = "sidebar_state=false; path=/"
    render(<Frame />)
    expect(state()).toBe("collapsed false")
    act(() => screen.getByRole("button", { name: "Robots" }).focus())
    expect((await screen.findByRole("tooltip")).textContent).toBe("Robots")
  })
})
