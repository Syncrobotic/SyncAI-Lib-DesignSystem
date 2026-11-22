import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/syncrobotic/ui/accordion"
import { CardDataHeader, CardTitle } from "@/registry/syncrobotic/ui/card"

// A heading's level follows the page's outline, so a card or accordion right under the h1 (or deep in a section) does
// not skip a level (#303). The default stays h3, and the look never changes with the level.
afterEach(cleanup)

describe("CardTitle", () => {
  it("is an h3 by default", () => {
    render(<CardTitle>Storage</CardTitle>)
    const h = screen.getByRole("heading", { name: "Storage" })
    expect(h.tagName).toBe("H3")
    expect(h.getAttribute("data-slot")).toBe("card-title")
  })

  it.each(["h2", "h4"] as const)("takes as=%s with the same classes", (as) => {
    render(<CardTitle as={as} className="extra">Storage</CardTitle>)
    const h = screen.getByRole("heading", { name: "Storage" })
    expect(h.tagName).toBe(as.toUpperCase())
    expect(h.className).toBe("text-lg font-bold extra")
  })
})

describe("CardDataHeader", () => {
  it("titles with an h3 by default and titleAs sets the level", () => {
    const { rerender } = render(<CardDataHeader title="Items by source" />)
    expect(screen.getByRole("heading", { name: "Items by source" }).tagName).toBe("H3")
    rerender(<CardDataHeader title="Items by source" titleAs="h2" />)
    const h = screen.getByRole("heading", { name: "Items by source" })
    expect(h.tagName).toBe("H2")
    expect(h.className).toBe("text-sm font-medium")
  })
})

describe("AccordionTrigger", () => {
  const faq = (as?: "h2" | "h3" | "h4") => (
    <Accordion type="single" collapsible>
      <AccordionItem value="licence">
        <AccordionTrigger as={as}>Licence</AccordionTrigger>
        <AccordionContent>MIT</AccordionContent>
      </AccordionItem>
    </Accordion>
  )

  it("sits in an h3 by default, as Radix renders it, with Radix's state on the heading", () => {
    render(faq())
    const h = screen.getByRole("heading", { name: "Licence" })
    expect(h.tagName).toBe("H3")
    expect(h.className).toBe("flex")
    expect(h.getAttribute("data-state")).toBe("closed")
    expect(h.querySelector("button")).toBe(screen.getByRole("button", { name: "Licence" }))
  })

  it.each(["h2", "h4"] as const)("takes as=%s and still opens", (as) => {
    render(faq(as))
    const h = screen.getByRole("heading", { name: "Licence" })
    expect(h.tagName).toBe(as.toUpperCase())
    fireEvent.click(screen.getByRole("button", { name: "Licence" }))
    expect(h.getAttribute("data-state")).toBe("open")
    expect(screen.getByText("MIT")).toBeTruthy()
  })
})
