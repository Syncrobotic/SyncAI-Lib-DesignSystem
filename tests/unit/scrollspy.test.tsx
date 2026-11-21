import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Scrollspy, useScrollspy, type ScrollspyItem } from "@/registry/syncrobotic/ui/scrollspy"

/**
 * Scrollspy measures on scroll rather than with an IntersectionObserver: a section is current once its top is within
 * `offset` px of the top of the viewport (or the root). The layout is faked here: each section's top is its document
 * position minus the scroll position.
 */
const layout = { scrollY: 0, viewport: 800, page: 3000, tops: {} as Record<string, number> }

const items: ScrollspyItem[] = [
  { id: "overview", label: "Overview" },
  { id: "battery", label: "Battery" },
  { id: "cells", label: "Cells", level: 2 },
  { id: "logs", label: "Logs" },
]

function Page(props: Partial<React.ComponentProps<typeof Scrollspy>>) {
  return (
    <>
      <Scrollspy items={items} {...props} />
      {items.map((i) => (
        <section key={i.id} id={i.id}>
          <h2>{i.label}</h2>
        </section>
      ))}
    </>
  )
}

const scrollTo = (y: number) => {
  layout.scrollY = y
  act(() => {
    window.dispatchEvent(new Event("scroll"))
    vi.advanceTimersToNextFrame()
  })
}
const link = (name: string) => screen.getByRole("link", { name })
const current = () =>
  screen
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "location")
    .map((a) => a.textContent)

beforeEach(() => {
  vi.useFakeTimers()
  Object.assign(layout, { scrollY: 0, viewport: 800, page: 3000, tops: { overview: 0, battery: 900, cells: 1400, logs: 2000 } })
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => layout.scrollY)
  vi.spyOn(window, "innerHeight", "get").mockImplementation(() => layout.viewport)
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockImplementation(() => layout.page)
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const top = (layout.tops[this.id] ?? 0) - layout.scrollY
    return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON() {} } as DOMRect
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("Scrollspy", () => {
  it("is a navigation landmark named by its title, with a link per section", () => {
    render(<Page />)
    const nav = screen.getByRole("navigation", { name: "On this page" })
    expect(nav.textContent).toContain("On this page")
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["#overview", "#battery", "#cells", "#logs"])
  })

  it("uses a string title as the landmark name, and falls back for a node title", () => {
    render(<Page title="Robot sections" />)
    expect(screen.getByRole("navigation", { name: "Robot sections" })).toBeTruthy()
    cleanup()
    render(<Page title={<b>Sections</b>} />)
    expect(screen.getByRole("navigation", { name: "On this page" }).textContent).toContain("Sections")
  })

  it("marks the first section current at the top of the page", () => {
    render(<Page />)
    expect(current()).toEqual(["Overview"])
    expect(link("Overview").hasAttribute("data-current")).toBe(true)
    expect(link("Battery").hasAttribute("aria-current")).toBe(false)
  })

  it("moves aria-current as sections pass the offset line (96 px by default)", () => {
    render(<Page />)
    scrollTo(803) // battery top at 97 px: not yet
    expect(current()).toEqual(["Overview"])
    scrollTo(804) // battery top at 96 px
    expect(current()).toEqual(["Battery"])
    scrollTo(1350)
    expect(current()).toEqual(["Cells"])
    scrollTo(1000) // back up
    expect(current()).toEqual(["Battery"])
    expect(screen.getAllByRole("link", { current: "location" })).toHaveLength(1)
  })

  it("respects a custom offset", () => {
    render(<Page offset={0} />)
    scrollTo(850)
    expect(current()).toEqual(["Overview"])
    scrollTo(900)
    expect(current()).toEqual(["Battery"])
  })

  it("gives the last section to the reader at the bottom of the page, even when its top never reaches the line", () => {
    render(<Page />)
    scrollTo(2199) // 1 px short of the bottom (2199 + 800 = 2999)
    expect(current()).toEqual(["Logs"])
    scrollTo(1700) // logs top at 300 px, not at the bottom
    expect(current()).toEqual(["Cells"])
  })

  it("measures once per frame, however many scroll events arrive", () => {
    render(<Page />)
    const rect = vi.mocked(HTMLElement.prototype.getBoundingClientRect)
    rect.mockClear()
    layout.scrollY = 1000
    act(() => {
      for (let i = 0; i < 5; i++) window.dispatchEvent(new Event("scroll"))
    })
    expect(rect).not.toHaveBeenCalled()
    act(() => vi.advanceTimersToNextFrame())
    expect(rect).toHaveBeenCalledTimes(items.length)
    expect(current()).toEqual(["Battery"])
  })

  it("re-measures on resize", () => {
    render(<Page />)
    layout.tops.battery = 50 // content above it shrank
    act(() => {
      window.dispatchEvent(new Event("resize"))
      vi.advanceTimersToNextFrame()
    })
    expect(current()).toEqual(["Battery"])
  })

  it("stops listening after unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener")
    const { unmount } = render(<Page />)
    unmount()
    const types = remove.mock.calls.map((c) => c[0])
    expect(types).toContain("scroll")
    expect(types).toContain("resize")
  })

  it("follows a scrolling container passed as root instead of the window", () => {
    function Panel() {
      const root = React.useRef<HTMLDivElement>(null)
      return (
        <>
          <Scrollspy items={items} root={root} />
          <div ref={root} data-testid="panel">
            {items.map((i) => (
              <section key={i.id} id={i.id} />
            ))}
          </div>
        </>
      )
    }
    render(<Panel />)
    const panel = screen.getByTestId("panel")
    let top = 0
    Object.defineProperties(panel, {
      scrollTop: { get: () => top, configurable: true },
      clientHeight: { value: 400, configurable: true },
      scrollHeight: { value: 3000, configurable: true },
    })
    // The panel sits 200 px down the window: section tops are measured from the panel's top.
    layout.tops = { overview: 200, battery: 1100, cells: 1600, logs: 2200 }
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockImplementation(function (this: HTMLElement) {
      const t = this === panel ? 200 : (layout.tops[this.id] ?? 0) - top
      return { top: t } as DOMRect
    })
    const scrollPanel = (y: number) => {
      top = y
      act(() => {
        panel.dispatchEvent(new Event("scroll"))
        vi.advanceTimersToNextFrame()
      })
    }
    scrollPanel(0)
    expect(current()).toEqual(["Overview"])
    top = 900 // battery at 1100 - 900 = 200 px in the window, 0 px in the panel
    act(() => {
      window.dispatchEvent(new Event("scroll")) // the window's scroll is not the one that counts
      vi.advanceTimersToNextFrame()
    })
    expect(current()).toEqual(["Overview"])
    scrollPanel(900)
    expect(current()).toEqual(["Battery"])
    scrollPanel(2600) // 2600 + 400 = 3000: the end of the panel
    expect(current()).toEqual(["Logs"])
  })

  it("on click scrolls smoothly to the section, moves focus there and updates the hash", () => {
    render(<Page />)
    const section = document.getElementById("cells")!
    const scroll = vi.fn()
    section.scrollIntoView = scroll
    const replace = vi.spyOn(history, "replaceState")
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList)
    const notPrevented = fireEvent.click(link("Cells"))
    expect(notPrevented).toBe(false)
    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "start" })
    expect(section.getAttribute("tabindex")).toBe("-1")
    expect(document.activeElement).toBe(section)
    expect(replace).toHaveBeenCalledWith(null, "", "#cells")
  })

  it("jumps without animation under reduced motion, and keeps a section's own tabindex", () => {
    render(<Page />)
    const section = document.getElementById("battery")!
    section.setAttribute("tabindex", "0")
    const scroll = vi.fn()
    section.scrollIntoView = scroll
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList)
    fireEvent.click(link("Battery"))
    expect(scroll).toHaveBeenCalledWith({ behavior: "auto", block: "start" })
    expect(section.getAttribute("tabindex")).toBe("0")
    expect(document.activeElement).toBe(section)
  })

  it("leaves the link to the browser when its section is missing", () => {
    render(<Scrollspy items={[{ id: "nowhere", label: "Nowhere" }]} />)
    expect(fireEvent.click(link("Nowhere"))).toBe(true) // not prevented
  })

  it("reaches every link with Tab: they are plain links in document order", () => {
    render(<Page />)
    for (const a of screen.getAllByRole("link")) {
      expect(a.tagName).toBe("A")
      expect(a.hasAttribute("tabindex")).toBe(false)
    }
  })

  it("draws pills without the visible title, still named for screen readers", () => {
    render(<Page variant="pills" />)
    const nav = screen.getByRole("navigation", { name: "On this page" })
    expect(nav.textContent).not.toContain("On this page")
    expect(current()).toEqual(["Overview"])
  })

  it("renders an empty list without errors", () => {
    render(<Scrollspy items={[]} />)
    expect(screen.queryAllByRole("link")).toHaveLength(0)
  })
})

describe("useScrollspy", () => {
  it("gives the current id for a custom display, and follows a new list of ids", () => {
    function Readout({ ids }: { ids: string[] }) {
      return <output>{useScrollspy(ids) ?? "none"}</output>
    }
    const { rerender } = render(
      <>
        <Readout ids={["overview", "battery"]} />
        <section id="overview" />
        <section id="battery" />
        <section id="logs" />
      </>,
    )
    expect(screen.getByRole("status").textContent).toBe("overview")
    scrollTo(1000)
    expect(screen.getByRole("status").textContent).toBe("battery")
    rerender(
      <>
        <Readout ids={["overview", "logs"]} />
        <section id="overview" />
        <section id="battery" />
        <section id="logs" />
      </>,
    )
    expect(screen.getByRole("status").textContent).toBe("overview")
  })
})
