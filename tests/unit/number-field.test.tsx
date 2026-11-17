import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(cleanup)
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { NumberField } from "@/registry/syncrobotic/ui/number-field"

const setup = (props: Partial<React.ComponentProps<typeof NumberField>> = {}) => {
  const onValueChange = vi.fn()
  render(
    <Field label="Speed limit">
      <NumberField defaultValue={1.2} min={0.2} max={2} step={0.1} unit="m/s" onValueChange={onValueChange} {...props} />
    </Field>,
  )
  return { input: screen.getByRole("spinbutton", { name: "Speed limit" }), onValueChange }
}

describe("NumberField", () => {
  it("is a labelled spinbutton that reads its unit", () => {
    const { input } = setup()
    expect(input.getAttribute("aria-valuenow")).toBe("1.2")
    expect(input.getAttribute("aria-valuetext")).toBe("1.2 m/s")
    expect(input.getAttribute("aria-valuemin")).toBe("0.2")
  })

  it("steps with arrows and by largeStep with Shift, and stays in range", () => {
    const { input, onValueChange } = setup()
    fireEvent.keyDown(input, { key: "ArrowUp" })
    expect(onValueChange).toHaveBeenLastCalledWith(1.3)
    fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true })
    expect(onValueChange).toHaveBeenLastCalledWith(2)
    fireEvent.keyDown(input, { key: "Home" })
    expect(onValueChange).toHaveBeenLastCalledWith(0.2)
  })

  it("never blocks typing; keeps the value in range when the field loses focus", () => {
    const { input, onValueChange } = setup()
    fireEvent.change(input, { target: { value: "9" } })
    expect((input as HTMLInputElement).value).toBe("9")
    fireEvent.blur(input)
    expect(onValueChange).toHaveBeenLastCalledWith(2)
    expect((input as HTMLInputElement).value).toBe("2.0")
  })

  it("restores the last value when the text is not a number", () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: "fast" } })
    fireEvent.blur(input)
    expect((input as HTMLInputElement).value).toBe("1.2")
  })

  it("disables the decrease button at the minimum", () => {
    setup({ defaultValue: 0.2 })
    expect(screen.getByRole("button", { name: "Decrease" }).hasAttribute("disabled")).toBe(true)
  })
})

describe("Field", () => {
  it("keeps a control's own id so the label still points at it", () => {
    render(
      <Field label="Site name">
        <Input id="site-name" />
      </Field>,
    )
    expect(screen.getByLabelText("Site name").id).toBe("site-name")
  })

  it("marks the control invalid and describes it with the error", () => {
    render(
      <Field label="Robot name" error="Already used">
        <Input />
      </Field>,
    )
    const input = screen.getByLabelText("Robot name")
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(input.getAttribute("aria-describedby") && document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("Already used")
  })
})

describe("Field with an InputGroup", async () => {
  const { InputGroup, InputGroupAddon } = await import("@/registry/syncrobotic/ui/input-group")
  it("labels the text box inside the group, not the group", () => {
    render(
      <Field label="Geofence radius" error="Too large">
        <InputGroup>
          <InputGroupAddon>≈</InputGroupAddon>
          <Input />
          <InputGroupAddon>m</InputGroupAddon>
        </InputGroup>
      </Field>,
    )
    const input = screen.getByLabelText("Geofence radius")
    expect(input.tagName).toBe("INPUT")
    expect(input.getAttribute("aria-invalid")).toBe("true")
  })
})
