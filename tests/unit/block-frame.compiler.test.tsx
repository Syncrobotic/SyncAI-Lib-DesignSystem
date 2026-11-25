import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BlockFrame } from "@/site/block-frame"

/**
 * A docs block card is still until it comes within a screen of the viewport (an IntersectionObserver, faked here), and
 * its still controls are real: using one brings the card live with that choice made. Compiled, as the site builds it.
 */
let near: (() => void) | undefined
beforeEach(() => {
  // happy-dom does not load frames and logs "Iframe page loading is disabled" for each live card: expected here.
  near = undefined
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe() {
        near = () => this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }
      disconnect() {}
    },
  )
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const card = () => render(<BlockFrame name="bar-chart-missions" height={420} initial="desktop" code={<pre>listing</pre>} />)

describe("BlockFrame", () => {
  it("is a still card until it nears the screen, with its controls named as the live ones", () => {
    card()
    expect(document.querySelector("iframe")).toBeNull()
    expect(screen.getByRole("tablist", { name: "View" })).toBeTruthy()
    expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("aria-selected")).toBe("true")
    expect(screen.getByRole("tab", { name: "Code" }).getAttribute("aria-selected")).toBe("false")
    expect(screen.getByRole("button", { name: "desktop view, 1280 pixels" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("link", { name: "Open ↗" }).getAttribute("href")).toBe("/preview/bar-chart-missions")
  })

  it("goes live near the screen: the iframe and the device widths", () => {
    card()
    act(() => near?.())
    expect(screen.getByTitle("bar-chart-missions preview at 1280 pixels").tagName).toBe("IFRAME")
    fireEvent.click(screen.getByRole("button", { name: "tablet view, 768 pixels" }))
    expect(screen.getByRole("button", { name: "tablet view, 768 pixels" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByTitle("bar-chart-missions preview at 768 pixels")).toBeTruthy()
  })

  it("a still tab used before it is near opens live on that tab, with the focus on it", () => {
    card()
    fireEvent.click(screen.getByRole("tab", { name: "Code" }))
    const code = screen.getByRole("tab", { name: "Code" })
    expect(code.getAttribute("aria-selected")).toBe("true")
    expect(code.dataset.slot).toBe("tabs-trigger")
    expect(document.activeElement).toBe(code)
    expect(screen.getByText("listing")).toBeTruthy()
  })

  it("a still device width used before it is near opens live at that width", () => {
    card()
    fireEvent.click(screen.getByRole("button", { name: "mobile view, 390 pixels" }))
    expect(screen.getByRole("button", { name: "mobile view, 390 pixels" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByTitle("bar-chart-missions preview at 390 pixels").tagName).toBe("IFRAME")
  })
})
