import { readFileSync } from "node:fs"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it } from "vitest"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/syncrobotic/ui/collapsible"

afterEach(cleanup)

function More({ defaultOpen, forceMount }: { defaultOpen?: boolean; forceMount?: true }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>More filters</CollapsibleTrigger>
      <CollapsibleContent forceMount={forceMount}>Night shift only</CollapsibleContent>
    </Collapsible>
  )
}

describe("Collapsible", () => {
  it("is a button with no heading around it, closed by default, that opens and closes its region", () => {
    render(<More />)
    const trigger = screen.getByRole("button", { name: "More filters" })
    expect(trigger.closest("h1, h2, h3, h4, h5, h6")).toBeNull()
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByText("Night shift only")).toBeNull()
    fireEvent.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    const region = screen.getByText("Night shift only").parentElement!
    expect(trigger.getAttribute("aria-controls")).toBe(region.id)
    fireEvent.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("uses the accordion's chevron, turned up while open, its press and a target of --h-sm", () => {
    render(<More />)
    const trigger = screen.getByRole("button")
    const chevron = trigger.querySelector("svg")!
    expect(chevron.getAttribute("aria-hidden")).toBe("true")
    expect(chevron.getAttribute("class")).toContain("lucide-chevron-down")
    expect(chevron.getAttribute("class")).toContain("duration-(--motion-base)")
    expect(trigger.className).toContain("[&[data-state=open]>svg]:rotate-180")
    expect(trigger.className).toContain("press")
    expect(trigger.className).toContain("min-h-(--h-sm)")
    // Focus shows: nothing removes the ring the theme draws.
    expect(trigger.className).not.toContain("outline-none")
  })

  it("keeps the content in the page while closed only with forceMount", () => {
    render(<More forceMount />)
    const region = screen.getByText("Night shift only").parentElement!
    expect(region.getAttribute("data-slot")).toBe("collapsible-content")
    expect(region.getAttribute("data-state")).toBe("closed")
  })

  it("does not animate content that is open in the server's HTML: the expand waits for Radix's measured height", () => {
    const html = renderToString(<More defaultOpen />)
    const region = new DOMParser().parseFromString(html, "text/html").querySelector("[data-slot=collapsible-content]")!
    expect(region.getAttribute("data-state")).toBe("open")
    // The animation applies only once the measured height is in the style attribute, which the server never writes.
    expect(region.getAttribute("style") ?? "").not.toContain("--radix-collapsible-content-height")
    const cls = region.getAttribute("class")!
    expect(cls).toContain("[&[style*=--radix-collapsible-content-height]]:data-[state=open]:animate-expand")
    expect(cls).not.toMatch(/(?:^|\s)data-\[state=open\]:animate-expand/)
  })

  it("uses the expand and collapse motion tokens, which reduced motion makes instant", () => {
    const theme = readFileSync("registry/syncrobotic/styles/syncrobotic-theme.css", "utf8")
    expect(theme).toMatch(/--animate-expand: expand var\(--motion-base\)/)
    expect(theme).toMatch(/--animate-collapse: collapse var\(--motion-base\)/)
    expect(theme).toMatch(/prefers-reduced-motion: reduce[\s\S]*--motion-base: 0\.01ms/)
  })
})
