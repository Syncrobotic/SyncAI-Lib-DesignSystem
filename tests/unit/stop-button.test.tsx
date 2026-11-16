import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"

// The emergency stop must work the same for touch, mouse, keyboard and assistive tech.
describe("StopButton", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const setup = (props: Partial<React.ComponentProps<typeof StopButton>> = {}) => {
    const onStop = vi.fn()
    const onStopAll = vi.fn()
    render(<StopButton onStop={onStop} onStopAll={onStopAll} tag="7F3A" {...props} />)
    return { onStop, onStopAll, button: screen.getByRole("button") }
  }

  it("stops on pointer down, before release", () => {
    const { onStop, button } = setup()
    fireEvent.pointerDown(button)
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it("stops with Enter and with Space", () => {
    const { onStop, button } = setup()
    fireEvent.keyDown(button, { key: "Enter" })
    fireEvent.keyUp(button, { key: "Enter" })
    fireEvent.keyDown(button, { key: " " })
    fireEvent.keyUp(button, { key: " " })
    expect(onStop).toHaveBeenCalledTimes(2)
  })

  it("does not stop twice when the browser follows a key press with a click", () => {
    const { onStop, button } = setup()
    fireEvent.keyDown(button, { key: "Enter" })
    fireEvent.click(button, { detail: 0 })
    fireEvent.keyUp(button, { key: "Enter" })
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it("stops on a click from a screen reader or switch control (no pointer, no key)", () => {
    const { onStop, button } = setup()
    fireEvent.click(button, { detail: 0 })
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it("does not double-stop on a pointer click", () => {
    const { onStop, button } = setup()
    fireEvent.pointerDown(button)
    fireEvent.pointerUp(button)
    fireEvent.click(button, { detail: 1 })
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it("stops all after holding for 2 s, by pointer", () => {
    const { onStopAll, button } = setup()
    fireEvent.pointerDown(button)
    act(() => vi.advanceTimersByTime(2100))
    expect(onStopAll).toHaveBeenCalledTimes(1)
  })

  it("stops all after holding Enter for 2 s, ignoring key repeat", () => {
    const { onStop, onStopAll, button } = setup()
    fireEvent.keyDown(button, { key: "Enter" })
    for (let i = 0; i < 10; i++) fireEvent.keyDown(button, { key: "Enter", repeat: true })
    act(() => vi.advanceTimersByTime(2100))
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onStopAll).toHaveBeenCalledTimes(1)
  })

  it("does not stop all when released early", () => {
    const { onStopAll, button } = setup()
    fireEvent.pointerDown(button)
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.pointerUp(button)
    act(() => vi.advanceTimersByTime(2000))
    expect(onStopAll).not.toHaveBeenCalled()
  })

  it("is disabled with no connection", () => {
    const { button } = setup({ state: "dead" })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it("names itself with label and tag", () => {
    const { button } = setup()
    expect(button.textContent).toContain("Emergency stop")
    expect(button.textContent).toContain("7F3A")
  })
})
