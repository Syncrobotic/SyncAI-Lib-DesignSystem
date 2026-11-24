import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const page = () => document.scrollingElement as HTMLElement

const shell = (children: React.ReactNode = "Page") =>
  render(
    <TopBarShell product="Fleet portal" links={[{ label: "Overview", href: "#o" }]}>
      {children}
    </TopBarShell>,
  )

// Issue #344 (WCAG 2.4.11): Shift+Tab up a long page left focused controls under the sticky bar.
describe("TopBarShell scroll padding", () => {
  it("pads the page's scroll by the bar and 8 px of air, from tokens, and puts it back when it goes", () => {
    page().style.scrollPaddingTop = "3px"
    const { unmount } = shell()
    expect(page().style.scrollPaddingTop).toBe("calc(var(--h-row) + var(--spacing, 0.25rem) * 4)")
    unmount()
    expect(page().style.scrollPaddingTop).toBe("3px")
    page().style.scrollPaddingTop = ""
  })

  it("adds a sticky tab row's height while it is pinned under the bar", () => {
    shell(
      <Tabs defaultValue="a" data-testid="section">
        <TabsList sticky aria-label="Dataset">
          <TabsTrigger value="a">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Long overview</TabsContent>
      </Tabs>,
    )
    expect(page().style.scrollPaddingTop).not.toContain("--h-md")
    // Scrolled: the section's top has gone up past the pinned row.
    vi.spyOn(screen.getByTestId("section"), "getBoundingClientRect").mockReturnValue({ top: -400 } as DOMRect)
    vi.spyOn(screen.getByRole("tablist"), "getBoundingClientRect").mockReturnValue({ top: 48 } as DOMRect)
    act(() => void window.dispatchEvent(new Event("scroll")))
    expect(page().style.scrollPaddingTop).toBe("calc(var(--h-row) + var(--h-md) + var(--spacing, 0.25rem) * 4)")
    // Back at the top, the row sits in its own place again.
    vi.spyOn(screen.getByTestId("section"), "getBoundingClientRect").mockReturnValue({ top: 200 } as DOMRect)
    vi.spyOn(screen.getByRole("tablist"), "getBoundingClientRect").mockReturnValue({ top: 200 } as DOMRect)
    act(() => void window.dispatchEvent(new Event("scroll")))
    expect(page().style.scrollPaddingTop).not.toContain("--h-md")
  })
})
