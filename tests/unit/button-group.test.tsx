import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/syncrobotic/ui/button-group"

afterEach(cleanup)

describe("ButtonGroup", () => {
  it("is a group named by its label, with its children in order", () => {
    render(
      <ButtonGroup aria-label="Page">
        <button type="button">Previous</button>
        <ButtonGroupText>3 / 12</ButtonGroupText>
        <button type="button">Next</button>
      </ButtonGroup>,
    )
    const group = screen.getByRole("group", { name: "Page" })
    expect(group.getAttribute("data-slot")).toBe("button-group")
    expect(group.getAttribute("data-orientation")).toBe("horizontal")
    expect(Array.from(group.children).map((c) => c.textContent)).toEqual(["Previous", "3 / 12", "Next"])
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Previous", "Next"])
  })

  it("stacks vertically and merges className", () => {
    render(<ButtonGroup aria-label="Zoom" orientation="vertical" className="custom" />)
    const group = screen.getByRole("group", { name: "Zoom" })
    expect(group.getAttribute("data-orientation")).toBe("vertical")
    expect(group.className).toContain("flex-col")
    expect(group.className).toContain("custom")
  })

  it("ButtonGroupText is a plain span, or its child with asChild", () => {
    render(
      <>
        <ButtonGroupText>GB</ButtonGroupText>
        <ButtonGroupText asChild>
          <label htmlFor="q">Scope</label>
        </ButtonGroupText>
      </>,
    )
    expect(screen.getByText("GB").tagName).toBe("SPAN")
    const label = screen.getByText("Scope")
    expect(label.tagName).toBe("LABEL")
    expect(label.getAttribute("data-slot")).toBe("button-group-text")
  })

  it("ButtonGroupSeparator is a separator, vertical by default", () => {
    render(
      <>
        <ButtonGroupSeparator />
        <ButtonGroupSeparator orientation="horizontal" />
      </>,
    )
    const [v, h] = screen.getAllByRole("separator")
    expect(v!.getAttribute("aria-orientation")).toBe("vertical")
    expect(h!.getAttribute("aria-orientation")).toBe("horizontal")
  })
})
