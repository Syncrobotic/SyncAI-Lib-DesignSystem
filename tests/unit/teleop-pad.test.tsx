import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { configureFeedback, haptics } from "@/registry/syncrobotic/lib/feedback"
import { TeleopPad, shapeTeleopCommand } from "@/registry/syncrobotic/shell/teleop-pad"

const ZERO = { linear: 0, angular: 0 }

// Geometry the pad reads on press: 224 wide, knob 56, so the stick travels (224 − 56) / 2 = 84 px each way.
function setup(props: Partial<React.ComponentProps<typeof TeleopPad>> = {}) {
  const onCommand = vi.fn()
  const onStop = vi.fn()
  const utils = render(<TeleopPad onCommand={onCommand} onStop={onStop} {...props} />)
  const pad = screen.getByRole("application")
  Object.defineProperty(pad, "clientWidth", { value: 224 })
  Object.defineProperty(pad.querySelector("[aria-hidden].size-\\(--h-stop\\)")!, "offsetWidth", { value: 56 })
  return { onCommand, onStop, pad, ...utils }
}
const T = 84
const press = (pad: HTMLElement) => fireEvent.pointerDown(pad, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 })
const move = (pad: HTMLElement, dx: number, dy: number) =>
  fireEvent.pointerMove(pad, { pointerId: 1, pointerType: "touch", clientX: 100 + dx, clientY: 100 + dy })
const last = (f: ReturnType<typeof vi.fn>) => f.mock.calls.at(-1)?.[0]

describe("shapeTeleopCommand", () => {
  it("sends zero inside the dead zone and ramps from zero past it", () => {
    expect(shapeTeleopCommand(0, -0.09)).toEqual(ZERO)
    expect(shapeTeleopCommand(0.05, 0.05)).toEqual(ZERO)
    const just = shapeTeleopCommand(0, -0.11)
    expect(just.linear).toBeGreaterThan(0)
    expect(just.linear).toBeLessThan(0.02)
    expect(shapeTeleopCommand(0, -1)).toEqual({ linear: 1, angular: 0 })
  })
  it("follows REP 103: up is forward, left turns left (+)", () => {
    expect(shapeTeleopCommand(-1, 0)).toEqual({ linear: 0, angular: 1 })
    expect(shapeTeleopCommand(1, 0)).toEqual({ linear: 0, angular: -1 })
    expect(shapeTeleopCommand(0, 1)).toEqual({ linear: -1, angular: 0 })
  })
  it("cuts to the unit circle and scales by maxSpeed", () => {
    expect(shapeTeleopCommand(0, -3, 0.1, 0.6)).toEqual({ linear: 0.6, angular: 0 })
    const d = shapeTeleopCommand(-1, -1)
    expect(Math.hypot(d.linear, d.angular)).toBeCloseTo(1, 2)
  })
  it("honours a custom dead zone", () => {
    expect(shapeTeleopCommand(0, -0.25, 0.3)).toEqual(ZERO)
    expect(shapeTeleopCommand(0, -0.25, 0)).toEqual({ linear: 0.25, angular: 0 })
  })
})

describe("TeleopPad", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    configureFeedback({ haptics: true, sound: false })
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    configureFeedback({ haptics: true, sound: true })
  })

  it("is one Tab stop with a name and a description of the controls", () => {
    const { pad } = setup()
    expect(pad.tabIndex).toBe(0)
    expect(screen.getByRole("application", { name: "Drive the robot" })).toBe(pad)
    expect(pad.getAttribute("aria-roledescription")).toBe("drive pad")
    const desc = document.getElementById(pad.getAttribute("aria-describedby")!)!.textContent
    expect(desc).toContain("Hold to drive. Release to stop.")
    expect(desc).toContain("Space stops")
    expect(screen.getByRole("status").textContent).toBe("Hold to drive")
  })

  it("pressing alone sends zero: the stick starts where the finger lands", () => {
    const { pad, onCommand } = setup()
    press(pad)
    expect(onCommand).toHaveBeenCalledTimes(1)
    expect(last(onCommand)).toEqual(ZERO)
  })

  it("drives at a fixed rate while held, and only then", () => {
    const { pad, onCommand } = setup({ rateHz: 10 })
    press(pad)
    move(pad, 0, -T) // full forward
    // Moves do not send by themselves; the next tick carries the newest command.
    expect(onCommand).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(100))
    expect(last(onCommand)).toEqual({ linear: 1, angular: 0 })
    act(() => vi.advanceTimersByTime(900))
    expect(onCommand).toHaveBeenCalledTimes(11) // press + 10 ticks in one second
    expect(screen.getByRole("status").textContent).toBe("Driving")
  })

  it("respects rateHz", () => {
    const { pad, onCommand } = setup({ rateHz: 20, timeoutMs: 5000 })
    press(pad)
    act(() => vi.advanceTimersByTime(1000))
    expect(onCommand).toHaveBeenCalledTimes(21)
  })

  it("sends zero inside the dead zone while held", () => {
    const { pad, onCommand } = setup()
    press(pad)
    move(pad, 0, -0.08 * T)
    act(() => vi.advanceTimersByTime(100))
    expect(last(onCommand)).toEqual(ZERO)
  })

  it("caps full stick at maxSpeed", () => {
    const { pad, onCommand } = setup({ maxSpeed: 0.5 })
    press(pad)
    move(pad, 0, -2 * T)
    act(() => vi.advanceTimersByTime(100))
    expect(last(onCommand)).toEqual({ linear: 0.5, angular: 0 })
    expect(screen.getByText("Speed limit 50 %")).toBeTruthy()
  })

  it.each([
    ["release", (pad: HTMLElement) => fireEvent.pointerUp(pad, { pointerId: 1 })],
    ["cancel", (pad: HTMLElement) => fireEvent.pointerCancel(pad, { pointerId: 1 })],
    ["blur", () => fireEvent.blur(window)],
    [
      "hidden",
      () => {
        Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true })
        fireEvent(document, new Event("visibilitychange"))
        Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true })
      },
    ],
  ] as const)("on %s: sends zero at once, calls onStop and sends nothing more", (reason, end) => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true })
    const { pad, onCommand, onStop } = setup()
    press(pad)
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.driveStart])
    move(pad, T, 0)
    act(() => vi.advanceTimersByTime(100))
    expect(last(onCommand)).toEqual({ linear: 0, angular: -1 })
    act(() => end(pad))
    expect(last(onCommand)).toEqual(ZERO)
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onStop).toHaveBeenCalledWith(reason)
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.driveStop])
    const n = onCommand.mock.calls.length
    act(() => vi.advanceTimersByTime(1000))
    expect(onCommand).toHaveBeenCalledTimes(n)
    // Moves after the stop do nothing until a new press.
    move(pad, 0, -T)
    act(() => vi.advanceTimersByTime(300))
    expect(onCommand).toHaveBeenCalledTimes(n)
  })

  it("stops when the pad itself loses focus", () => {
    const { pad, onStop } = setup()
    press(pad)
    fireEvent.blur(pad)
    expect(onStop).toHaveBeenCalledWith("blur")
  })

  it("stops after timeoutMs without pointer events, and says input was lost", () => {
    const { pad, onCommand, onStop } = setup({ timeoutMs: 500 })
    press(pad)
    move(pad, 0, -T)
    act(() => vi.advanceTimersByTime(400))
    move(pad, 0, -T + 1) // any event re-arms it
    act(() => vi.advanceTimersByTime(400))
    expect(onStop).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(150))
    expect(onStop).toHaveBeenCalledWith("timeout")
    expect(last(onCommand)).toEqual(ZERO)
    expect(screen.getByRole("status").textContent).toMatch(/input lost/)
  })

  it("with timeoutMs={false}, a still pointer keeps driving (the robot's own watchdog guards it)", () => {
    const { pad, onCommand, onStop } = setup({ timeoutMs: false })
    press(pad)
    move(pad, 0, -T)
    act(() => vi.advanceTimersByTime(10_000))
    expect(onStop).not.toHaveBeenCalled()
    expect(last(onCommand)).not.toEqual(ZERO)
  })

  it("ignores a second finger", () => {
    const { pad, onStop } = setup()
    press(pad)
    fireEvent.pointerDown(pad, { pointerId: 2, pointerType: "touch", clientX: 0, clientY: 0 })
    fireEvent.pointerUp(pad, { pointerId: 2 })
    expect(onStop).not.toHaveBeenCalled()
  })

  it("stops with zero when disabled while driving, and cannot be driven while disabled", () => {
    const { pad, onCommand, onStop, rerender } = setup()
    press(pad)
    rerender(<TeleopPad onCommand={onCommand} onStop={onStop} disabled disabledReason="robot in autonomous mode" />)
    expect(onStop).toHaveBeenCalledWith("disabled")
    expect(last(onCommand)).toEqual(ZERO)
    expect(screen.getByRole("status").textContent).toBe("Disabled: robot in autonomous mode")
    expect(pad.getAttribute("aria-disabled")).toBe("true")
    const n = onCommand.mock.calls.length
    press(pad)
    fireEvent.keyDown(pad, { key: "ArrowUp" })
    act(() => vi.advanceTimersByTime(500))
    expect(onCommand).toHaveBeenCalledTimes(n)
  })

  it("stops with zero when it leaves the page while driving", () => {
    const { pad, onCommand, onStop, unmount } = setup()
    press(pad)
    unmount()
    expect(onStop).toHaveBeenCalledWith("unmount")
    expect(last(onCommand)).toEqual(ZERO)
  })

  it("shows the measured speed while driving", () => {
    const { pad } = setup({ speed: 0.42 })
    expect(screen.queryByText(/m\/s/)).toBeNull()
    press(pad)
    expect(screen.getByText("· 0.4 m/s", { exact: false })).toBeTruthy()
  })

  describe("keyboard", () => {
    it("drives while arrow keys or W A S D are held and stops on release", () => {
      const { pad, onCommand, onStop } = setup()
      fireEvent.keyDown(pad, { key: "ArrowUp" })
      expect(last(onCommand)).toEqual({ linear: 1, angular: 0 })
      fireEvent.keyDown(pad, { key: "a", code: "KeyA" })
      act(() => vi.advanceTimersByTime(100))
      const c = last(onCommand)
      expect(c.linear).toBeCloseTo(0.707, 2)
      expect(c.angular).toBeCloseTo(0.707, 2)
      fireEvent.keyUp(pad, { key: "ArrowUp" })
      act(() => vi.advanceTimersByTime(100))
      expect(last(onCommand)).toEqual({ linear: 0, angular: 1 })
      fireEvent.keyUp(pad, { key: "a", code: "KeyA" })
      expect(last(onCommand)).toEqual(ZERO)
      expect(onStop).toHaveBeenCalledWith("release")
      expect(screen.getByRole("status").textContent).toBe("Stopped")
    })

    it("does not time out a held key (key repeat may be off)", () => {
      const { pad, onStop } = setup({ timeoutMs: 500 })
      fireEvent.keyDown(pad, { key: "ArrowDown" })
      act(() => vi.advanceTimersByTime(2000))
      expect(onStop).not.toHaveBeenCalled()
    })

    it("Space stops, and keys still held do nothing until released", () => {
      const { pad, onCommand, onStop } = setup()
      fireEvent.keyDown(pad, { key: "ArrowUp" })
      fireEvent.keyDown(pad, { key: " " })
      expect(onStop).toHaveBeenCalledWith("key")
      expect(last(onCommand)).toEqual(ZERO)
      const n = onCommand.mock.calls.length
      fireEvent.keyDown(pad, { key: "ArrowUp", repeat: true })
      act(() => vi.advanceTimersByTime(500))
      expect(onCommand).toHaveBeenCalledTimes(n)
      fireEvent.keyUp(pad, { key: "ArrowUp" })
      fireEvent.keyDown(pad, { key: "ArrowUp" })
      expect(last(onCommand)).toEqual({ linear: 1, angular: 0 })
    })

    it("Tab away stops", () => {
      const { pad, onStop } = setup()
      fireEvent.keyDown(pad, { key: "ArrowRight" })
      fireEvent.blur(pad)
      expect(onStop).toHaveBeenCalledWith("blur")
    })

    it("leaves shortcuts with modifiers alone", () => {
      const { pad, onCommand } = setup()
      fireEvent.keyDown(pad, { key: "ArrowLeft", metaKey: true })
      expect(onCommand).not.toHaveBeenCalled()
    })
  })
})
