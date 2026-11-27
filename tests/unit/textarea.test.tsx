import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Textarea } from "@/registry/syncrobotic/ui/textarea"

afterEach(cleanup)

describe("Textarea", () => {
  it("renders a multi-line textbox named by its label, with a data-slot", () => {
    render(
      <label>
        Notes
        <Textarea placeholder="What happened?" />
      </label>,
    )
    const box = screen.getByRole("textbox", { name: "Notes" })
    expect(box.tagName).toBe("TEXTAREA")
    expect(box.getAttribute("data-slot")).toBe("textarea")
    expect(box.getAttribute("placeholder")).toBe("What happened?")
  })

  it("forwards value and onChange when controlled", () => {
    const onChange = vi.fn((e: React.ChangeEvent<HTMLTextAreaElement>) => e.target.value)
    render(<Textarea aria-label="Notes" value="Lidar" onChange={onChange} />)
    const box = screen.getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement
    expect(box.value).toBe("Lidar")
    fireEvent.change(box, { target: { value: "Lidar fault" } })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveReturnedWith("Lidar fault")
  })

  it("takes typing when uncontrolled", () => {
    render(<Textarea aria-label="Notes" defaultValue="a" />)
    const box = screen.getByRole("textbox") as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: "ab" } })
    expect(box.value).toBe("ab")
  })

  it("passes disabled, aria-invalid, rows and a ref through, and merges className", () => {
    const ref = { current: null as HTMLTextAreaElement | null }
    render(<Textarea ref={ref} aria-label="Notes" disabled aria-invalid rows={6} className="custom" />)
    const box = screen.getByRole("textbox") as HTMLTextAreaElement
    expect(ref.current).toBe(box)
    expect(box.disabled).toBe(true)
    expect(box.getAttribute("aria-invalid")).toBe("true")
    expect(box.getAttribute("rows")).toBe("6")
    expect(box.className).toContain("custom")
    expect(box.className).toContain("aria-invalid:ring-danger")
    expect(box.className).toContain("disabled:cursor-not-allowed")
  })
})
