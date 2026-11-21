import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TimeInput, TimePicker, formatTime, normalizeTime, parseTime } from "@/registry/syncrobotic/ui/time-picker"

afterEach(cleanup)

// Values arrive from products as plain strings, so a typo or a half-typed value must read as "no time" and never as
// "9:NaN AM" or "2:99 PM" on screen.
const malformed = ["9", "9:", ":30", "25:99", "24:00", "12:60", "9:5", "nine", "", "  ", "09:30:00", "-1:30"]

describe("formatTime", () => {
  it.each(malformed)("formats %j as an empty string in every mode", (t) => {
    expect(formatTime(t)).toBe("")
    expect(formatTime(t, true)).toBe("")
    expect(formatTime(t, true, "zh-TW")).toBe("")
  })
  it("never writes NaN", () => {
    for (const t of malformed) for (const h12 of [false, true]) expect(formatTime(t, h12)).not.toMatch(/NaN/)
  })
  it("writes a valid time in its canonical form", () => {
    expect(formatTime("09:30")).toBe("09:30")
    expect(formatTime("9:30")).toBe("09:30")
    expect(formatTime("00:05", true)).toBe("12:05 AM")
    expect(formatTime("23:59", true)).toBe("11:59 PM")
  })
})

describe("normalizeTime", () => {
  it("pads the hour and rejects anything that is not a time", () => {
    expect(normalizeTime("9:30")).toBe("09:30")
    expect(normalizeTime(undefined)).toBeUndefined()
    for (const t of malformed) expect(normalizeTime(t)).toBeUndefined()
  })
})

describe("parseTime", () => {
  it("still reads what people type", () => {
    expect(parseTime("930")).toBe("09:30")
    expect(parseTime("9:30 pm")).toBe("21:30")
    expect(parseTime("25:99")).toBeNull()
  })
})

describe("TimePicker with a malformed value", () => {
  it.each(malformed)("shows the placeholder for %j", (t) => {
    render(<TimePicker value={t} hour12 aria-label="Start" />)
    const trigger = screen.getByRole("button")
    expect(trigger.textContent).toContain("Pick a time")
    expect(trigger.textContent).not.toMatch(/NaN/)
    expect(trigger.getAttribute("data-empty")).toBe("true")
  })
  it("picks no slot for a malformed value and the canonical slot for an unpadded one", () => {
    const { rerender } = render(<TimePicker value="25:99" step={60} />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.queryAllByRole("option", { selected: true })).toHaveLength(0)
    rerender(<TimePicker value="9:00" step={60} />)
    expect(screen.getByRole("option", { selected: true }).textContent).toContain("09:00")
  })
  it("keeps a full list when min or max is malformed", () => {
    render(<TimePicker min="9" max="" step={360} />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["00:00", "06:00", "12:00", "18:00"])
  })
})

describe("TimeInput with a malformed value", () => {
  it.each(malformed)("shows an empty field for %j", (t) => {
    render(<TimeInput value={t} hour12 aria-label="Start" />)
    const input = screen.getByRole("textbox") as HTMLInputElement
    expect(input.value).toBe("")
    expect(input.placeholder).toBe("9:30 AM")
  })
  it("ignores a malformed min instead of rejecting every time", () => {
    const change = vi.fn()
    render(<TimeInput min="9:" aria-label="Start" onValueChange={change} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "8:15" } })
    fireEvent.blur(input)
    expect(change).toHaveBeenCalledWith("08:15")
    expect(input.getAttribute("aria-invalid")).toBeNull()
  })
})
