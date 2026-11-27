import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

// Typography's two section levels in one part (#385): page 16 px bold, surface 14 px medium; the count in full.
afterEach(cleanup)

describe("SectionHeader", () => {
  it("is a page section by default: an h2, 16 px bold", () => {
    render(<SectionHeader title="Robots" />)
    const h = screen.getByRole("heading", { name: "Robots" })
    expect(h.tagName).toBe("H2")
    expect(h.className).toContain("text-base font-bold")
    expect(h.closest("[data-slot=section-header]")?.getAttribute("data-variant")).toBe("page")
  })

  it("inside a surface it is an h3 at 14 px medium, never bold", () => {
    render(<SectionHeader variant="surface" title="Sensors" />)
    const h = screen.getByRole("heading", { name: "Sensors" })
    expect(h.tagName).toBe("H3")
    expect(h.className).toContain("text-sm font-medium")
    expect(h.className).not.toContain("font-bold")
  })

  it.each([
    ["page", "h3"],
    ["surface", "h2"],
    ["surface", "h4"],
  ] as const)("a %s header takes as=%s and keeps its look", (variant, as) => {
    render(
      <>
        <SectionHeader variant={variant} as={as} title="Shifts" />
        <SectionHeader variant={variant} title="Base" />
      </>,
    )
    const h = screen.getByRole("heading", { name: "Shifts" })
    expect(h.tagName).toBe(as.toUpperCase())
    expect(h.className).toBe(screen.getByRole("heading", { name: "Base" }).className)
  })

  it("writes the count in full with grouping, in the heading's name", () => {
    render(<SectionHeader title="Images" count={135287} />)
    expect(screen.getByRole("heading", { name: "Images 135,287" })).toBeTruthy()
    const count = document.querySelector("[data-slot=section-header-count]")!
    expect(count.textContent).toBe("135,287")
    expect(count.className).toContain("tabular-nums")
  })

  it("writes the count in the locale it is given, and shows a count of 0", () => {
    const { rerender } = render(<SectionHeader title="Bilder" count={135287} locale="de" />)
    expect(document.querySelector("[data-slot=section-header-count]")!.textContent).toBe("135.287")
    rerender(<SectionHeader title="Alarms" count={0} />)
    expect(document.querySelector("[data-slot=section-header-count]")!.textContent).toBe("0")
  })

  it("puts the id on the heading, the description under it and the actions beside it", () => {
    render(
      <section aria-labelledby="fleet">
        <SectionHeader id="fleet" title="Fleet" description="Every robot on site." actions={<button type="button">Add robot</button>} />
      </section>,
    )
    expect(screen.getByRole("region", { name: "Fleet" })).toBeTruthy()
    expect(screen.getByText("Every robot on site.").tagName).toBe("P")
    const actions = document.querySelector("[data-slot=section-header-actions]")!
    expect(actions.contains(screen.getByRole("button", { name: "Add robot" }))).toBe(true)
  })

  it("renders no count, line or actions when none are given", () => {
    render(<SectionHeader title="Fleet" />)
    expect(document.querySelector("[data-slot=section-header-count]")).toBeNull()
    expect(document.querySelector("[data-slot=section-header-actions]")).toBeNull()
    expect(document.querySelector("[data-slot=section-header] p")).toBeNull()
  })
})
