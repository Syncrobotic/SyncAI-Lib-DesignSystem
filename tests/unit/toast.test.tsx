import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { toast, toastDuration, Toaster } from "@/registry/syncrobotic/ui/toast"

afterEach(() => {
  act(() => toast.clear())
  vi.useRealTimers()
})

const li = (title: string) => screen.queryByText(title)?.closest("[data-slot=toast]") as HTMLElement | null | undefined
const state = (title: string) => li(title)?.getAttribute("data-state") ?? "gone"
const visible = (title: string) => li(title)?.getAttribute("data-visible")
const index = (title: string) => li(title)?.getAttribute("data-index")
const viewport = () => document.querySelector("[data-slot=toast-viewport]") as HTMLElement

describe("toast", () => {
  it("uses the island's timings: 4 s, 8 s with an action, failures until dismissed", () => {
    expect(toastDuration({ title: "Saved" })).toBe(4000)
    expect(toastDuration({ title: "Deleted", action: { label: "Undo", onClick: () => {} } })).toBe(8000)
    expect(toastDuration({ title: "Failed", tone: "danger" })).toBe(Infinity)
  })

  it("keeps a 4th and later toast, hidden behind a stack of three, and brings it forward when one in front goes", () => {
    render(<Toaster />)
    act(() => {
      toast({ title: "Failure", tone: "danger" })
      toast({ title: "One" })
      toast({ title: "Two" })
      toast({ title: "Three" })
      toast({ title: "Four" })
    })
    // Nothing is closed to make room: all five are open, newest in front.
    expect(["Failure", "One", "Two", "Three", "Four"].map(state)).toEqual(["open", "open", "open", "open", "open"])
    expect(["Four", "Three", "Two", "One", "Failure"].map(index)).toEqual(["0", "1", "2", "3", "4"])
    expect(["Four", "Three", "Two"].map(visible)).toEqual(["true", "true", "true"])
    expect(["One", "Failure"].map(visible)).toEqual(["false", "false"])
    // Hidden ones are out of reach for keyboard and screen reader until they come forward.
    expect(li("One")?.hasAttribute("inert")).toBe(true)
    expect(li("Four")?.hasAttribute("inert")).toBe(false)
    expect(li("Four")?.getAttribute("data-front")).toBe("true")

    act(() => {
      toast.dismiss(-1) // an unknown id changes nothing
    })
    expect(visible("One")).toBe("false")
  })

  it("closes a toast in the middle and moves the ones behind it forward", () => {
    render(<Toaster />)
    let middle = 0
    act(() => {
      toast({ title: "Back" })
      middle = toast({ title: "Middle" })
      toast({ title: "Front" })
      toast({ title: "Waiting" })
    })
    expect(["Waiting", "Front", "Middle", "Back"].map(index)).toEqual(["0", "1", "2", "3"])
    expect(visible("Back")).toBe("false")
    act(() => toast.dismiss(middle))
    expect(state("Middle")).not.toBe("open")
    expect(["Waiting", "Front", "Back"].map(index)).toEqual(["0", "1", "2"])
    expect(["Waiting", "Front", "Back"].map(visible)).toEqual(["true", "true", "true"])
    expect(li("Back")?.hasAttribute("inert")).toBe(false)
  })

  it("pauses the timers while the pointer is on the stack, and spreads it out", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "requestAnimationFrame", "cancelAnimationFrame"] })
    render(<Toaster />)
    act(() => {
      toast({ title: "Saved" })
      toast({ title: "Copied" })
    })
    expect(viewport().getAttribute("data-expanded")).toBe("false")
    // Radix pauses on the region; the Toaster spreads the stack on the list.
    act(() => {
      fireEvent.pointerMove(screen.getByRole("region"))
      fireEvent.pointerMove(viewport())
    })
    expect(viewport().getAttribute("data-expanded")).toBe("true")
    act(() => vi.advanceTimersByTime(10_000))
    expect(["Saved", "Copied"].map(state)).toEqual(["open", "open"])

    act(() => {
      fireEvent.pointerLeave(screen.getByRole("region"), { pointerType: "mouse" })
      fireEvent.pointerLeave(viewport(), { pointerType: "mouse" })
    })
    expect(viewport().getAttribute("data-expanded")).toBe("false")
    act(() => vi.advanceTimersByTime(4100))
    expect(["Saved", "Copied"].map(state)).not.toContain("open")
  })

  it("collapses and runs the timers again after a toast is dismissed with the pointer", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "requestAnimationFrame", "cancelAnimationFrame"] })
    render(<Toaster />)
    act(() => {
      toast({ title: "Saved" })
      toast({ title: "Copied" })
      toast({ title: "Sent" })
    })
    const close = li("Sent")!.querySelector("[data-slot=toast-close]") as HTMLElement
    // A mouse click: the pointer arrives, presses (the browser focuses the button), clicks, and leaves.
    act(() => {
      fireEvent.pointerMove(screen.getByRole("region"))
      fireEvent.pointerMove(viewport())
      fireEvent.pointerDown(close, { pointerType: "mouse" })
      close.focus()
      fireEvent.click(close)
    })
    expect(state("Sent")).not.toBe("open")
    act(() => {
      fireEvent.pointerLeave(screen.getByRole("region"), { pointerType: "mouse" })
      fireEvent.pointerLeave(viewport(), { pointerType: "mouse" })
    })
    // Focus that a click put on the stack does not hold it spread, nor its timers paused.
    expect(viewport().getAttribute("data-expanded")).toBe("false")
    act(() => vi.advanceTimersByTime(4100))
    expect(["Saved", "Copied"].map(state)).not.toContain("open")
  })

  it("stays spread, timers paused, while the keyboard is in the stack", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "requestAnimationFrame", "cancelAnimationFrame"] })
    render(<Toaster />)
    act(() => {
      toast({ title: "Saved" })
      toast({ title: "Copied" })
    })
    act(() => {
      fireEvent.keyDown(document, { key: "F8" })
      viewport().focus()
    })
    expect(viewport().getAttribute("data-expanded")).toBe("true")
    act(() => vi.advanceTimersByTime(10_000))
    expect(["Saved", "Copied"].map(state)).toEqual(["open", "open"])
  })

  it("draws each toast once when more than one Toaster is mounted", () => {
    render(
      <>
        <Toaster />
        <Toaster />
      </>,
    )
    act(() => {
      toast({ title: "Only once" })
    })
    expect(screen.getAllByText("Only once")).toHaveLength(1)
    expect(document.querySelectorAll("[data-slot=toast-viewport]")).toHaveLength(1)
  })
})
