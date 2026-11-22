import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { DatePicker, DateRangePicker } from "@/registry/syncrobotic/ui/date-selector"
import { Field } from "@/registry/syncrobotic/ui/field"
import { PhoneInput } from "@/registry/syncrobotic/ui/phone-input"
import { Sortable, SortableHandle, SortableItem, SortablePosition } from "@/registry/syncrobotic/ui/sortable"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("Sortable", () => {
  it("announces the pick-up, and no move until the item has moved", async () => {
    // A real layout: each item 44 px tall, 52 px below the last, so the lifted item is over its own place, as in a browser.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      const li = this.closest("[data-slot=sortable-item]")
      const i = li ? [...li.parentElement!.children].indexOf(li) : 0
      const top = i * 52
      return { x: 0, y: top, top, left: 0, width: 200, height: 44, right: 200, bottom: top + 44, toJSON: () => ({}) } as DOMRect
    })
    render(
      <Sortable value={["a", "b", "c"]} onValueChange={() => {}} getId={(x) => x} getLabel={(x) => `Stop ${x.toUpperCase()}`}>
        {["a", "b", "c"].map((x) => (
          <SortableItem key={x} id={x}>
            <SortableHandle label={`Move ${x}`} />
          </SortableItem>
        ))}
      </Sortable>,
    )
    const handle = screen.getByRole("button", { name: "Move b" })
    handle.focus()
    await act(async () => {
      fireEvent.keyDown(handle, { code: "Space", key: " " })
      await new Promise((r) => setTimeout(r, 50))
    })
    const spoken = document.body.textContent ?? ""
    expect(spoken).toContain("Picked up Stop B. Position 2 of 3.")
    expect(spoken).not.toContain("moved to position")
  })

  it("writes each item's place with SortablePosition", () => {
    render(
      <Sortable value={["a", "b"]} onValueChange={() => {}} getId={(x) => x}>
        {["a", "b"].map((x) => (
          <SortableItem key={x} id={x}>
            <span data-testid={x}>
              <SortablePosition format={(n) => `Step ${n}`} />
            </span>
          </SortableItem>
        ))}
      </Sortable>,
    )
    expect(screen.getByTestId("a").textContent).toBe("Step 1")
    expect(screen.getByTestId("b").textContent).toBe("Step 2")
  })
})

describe("PhoneInput in a Field", () => {
  it("is named by the Field's label, not by a fixed name", () => {
    render(
      <Field label="On-call phone">
        <PhoneInput />
      </Field>,
    )
    expect(screen.getByRole("textbox", { name: "On-call phone" })).toBeTruthy()
  })

  it("is still named alone", () => {
    render(<PhoneInput />)
    expect(screen.getByRole("textbox", { name: "Phone number" })).toBeTruthy()
  })
})

describe("CopyButton with text", () => {
  it("keeps every word in the button for its width, and is named by the one shown", async () => {
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true })
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn(async () => {}) }, configurable: true })
    render(<CopyButton value="x">Copy install command</CopyButton>)
    expect(screen.getByRole("button", { name: "Copy install command" })).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByRole("button")))
    // All three words are laid out in one cell, so the button is as wide as the longest; the name is the current one.
    expect(screen.getByRole("button").textContent).toContain("Copy install command")
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy()
  })
})

describe("Date pickers", () => {
  it("mark the given today, so presets built from it agree with the calendar", async () => {
    render(<DatePicker aria-label="Report day" value={new Date(2026, 10, 10)} today={new Date(2026, 10, 17)} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /^Report day/ })))
    expect(screen.getByRole("button", { name: "17 November 2026, Tuesday, today" })).toBeTruthy()
  })

  it("show one month on a phone, two from 640 px", async () => {
    let wide = false
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (q: string) => ({ matches: wide, media: q, addEventListener: () => {}, removeEventListener: () => {} }),
    })
    const { unmount } = render(<DateRangePicker aria-label="Shift" value={{ from: new Date(2026, 10, 3) }} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /^Shift/ })))
    expect(screen.getAllByRole("grid")).toHaveLength(1)
    unmount()
    wide = true
    render(<DateRangePicker aria-label="Shift" value={{ from: new Date(2026, 10, 3) }} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /^Shift/ })))
    expect(screen.getAllByRole("grid")).toHaveLength(2)
    Reflect.deleteProperty(window, "matchMedia")
  })
})

