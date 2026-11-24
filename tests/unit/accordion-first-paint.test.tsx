import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/syncrobotic/ui/accordion"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// What the expand animation is gated on: open, and measured by Radix.
const animates = `[data-state="open"][style*="--radix-collapsible-content-height:"]`

const faq = () => (
  <Accordion type="single" collapsible defaultValue="a">
    <AccordionItem value="a">
      <AccordionTrigger>Calibration</AccordionTrigger>
      <AccordionContent>Run it weekly.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="b">
      <AccordionTrigger>Charging</AccordionTrigger>
      <AccordionContent>Dock it.</AccordionContent>
    </AccordionItem>
  </Accordion>
)

// Issue #322: an item open in the server render played its open animation on every page load.
describe("AccordionContent first paint", () => {
  it("gates the expand animation on the measured height, not on data-state alone", () => {
    render(faq())
    const content = document.querySelector("[data-slot=accordion-content]")!
    expect(content.className).toContain("[&[data-state=open][style*='--radix-collapsible-content-height:']]:animate-expand")
    expect(content.className).not.toMatch(/(^|\s)data-\[state=open\]:animate-expand/)
    // Closing keeps its motion.
    expect(content.className).toContain("data-[state=closed]:animate-collapse")
  })

  it("does not animate an item that is open in the server's HTML", () => {
    const host = document.createElement("div")
    host.innerHTML = renderToString(faq())
    const open = host.querySelector('[data-slot=accordion-content][data-state="open"]')!
    expect(open).toBeTruthy()
    expect(open.matches(animates)).toBe(false)
  })

  it("animates an item the user opens, once Radix has measured it", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 48, width: 320 } as DOMRect)
    render(faq())
    act(() => fireEvent.click(screen.getByRole("button", { name: "Charging" })))
    const opened = screen.getByText("Dock it.").closest("[data-slot=accordion-content]")!
    expect(opened.getAttribute("data-state")).toBe("open")
    expect(opened.matches(animates)).toBe(true)
  })
})
