import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"

// Geometry the hook reads: track 300 wide, thumb 48 wide, inset 4 (its top gap) -> travel 300 - 48 - 8 = 244. Dead zone 8 px.
// offsetLeft moves with the thumb in a browser; it is set far off here so a hook that read it would fail.
function layout() {
  const slider = screen.getByRole("slider")
  const thumb = slider.querySelector<HTMLElement>(".absolute.top-1")!
  Object.defineProperty(slider, "clientWidth", { value: 300 })
  Object.defineProperty(thumb, "offsetWidth", { value: 48 })
  Object.defineProperty(thumb, "offsetTop", { value: 4 })
  Object.defineProperty(thumb, "offsetLeft", { value: 180 })
  return { slider, thumb }
}
const drag = (thumb: HTMLElement, fraction: number) => {
  fireEvent.pointerDown(thumb, { clientX: 0, pointerId: 1 })
  fireEvent.pointerMove(thumb, { clientX: 30, pointerId: 1 })
  fireEvent.pointerMove(thumb, { clientX: fraction * 244, pointerId: 1 })
  fireEvent.pointerUp(thumb, { clientX: fraction * 244, pointerId: 1 })
}

describe("SlideToRelease", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("releases when let go past 85%", () => {
    const onRelease = vi.fn()
    render(<SlideToRelease onRelease={onRelease} />)
    const { thumb } = layout()
    drag(thumb, 0.9)
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it("springs back and does not release short of 85%", () => {
    const onRelease = vi.fn()
    render(<SlideToRelease onRelease={onRelease} />)
    const { slider, thumb } = layout()
    drag(thumb, 0.6)
    expect(onRelease).not.toHaveBeenCalled()
    expect(slider.getAttribute("aria-valuenow")).toBe("0")
  })

  it("follows the finger 1:1 wherever the thumb is", () => {
    render(<SlideToRelease onRelease={() => {}} />)
    const { slider, thumb } = layout()
    fireEvent.pointerDown(thumb, { clientX: 0, pointerId: 1 })
    fireEvent.pointerMove(thumb, { clientX: 61, pointerId: 1 })
    expect(slider.getAttribute("aria-valuenow")).toBe("25")
    fireEvent.pointerMove(thumb, { clientX: 122, pointerId: 1 })
    expect(slider.getAttribute("aria-valuenow")).toBe("50")
  })

  it("ignores movement under 8 px, so a tap or a slip never moves the thumb", () => {
    const onRelease = vi.fn()
    render(<SlideToRelease onRelease={onRelease} />)
    const { slider, thumb } = layout()
    fireEvent.pointerDown(thumb, { clientX: 0, pointerId: 1 })
    fireEvent.pointerMove(thumb, { clientX: 6, pointerId: 1 })
    expect(slider.getAttribute("aria-valuenow")).toBe("0")
    fireEvent.pointerUp(thumb, { pointerId: 1 })
    expect(onRelease).not.toHaveBeenCalled()
  })

  it("releases after holding Enter for 2 s, and not before", () => {
    const onRelease = vi.fn()
    render(<SlideToRelease onRelease={onRelease} />)
    const slider = screen.getByRole("slider")
    fireEvent.keyDown(slider, { key: "Enter" })
    act(() => vi.advanceTimersByTime(1900))
    expect(onRelease).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(200))
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it("cancels the keyboard hold when the key is let go early", () => {
    const onRelease = vi.fn()
    render(<SlideToRelease onRelease={onRelease} />)
    const slider = screen.getByRole("slider")
    fireEvent.keyDown(slider, { key: " " })
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.keyUp(slider, { key: " " })
    act(() => vi.advanceTimersByTime(2000))
    expect(onRelease).not.toHaveBeenCalled()
  })

  it("cannot be released by viewers (locked)", () => {
    const onRelease = vi.fn()
    render(<SlideToRelease onRelease={onRelease} locked />)
    const { slider, thumb } = layout()
    drag(thumb, 1)
    fireEvent.keyDown(slider, { key: "Enter" })
    act(() => vi.advanceTimersByTime(3000))
    expect(onRelease).not.toHaveBeenCalled()
  })
})
