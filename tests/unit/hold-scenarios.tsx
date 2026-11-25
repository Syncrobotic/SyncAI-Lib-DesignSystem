import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import type { useLongPress as UseLongPress } from "@/registry/syncrobotic/hooks/use-long-press"
import type { useSlideRelease as UseSlideRelease } from "@/registry/syncrobotic/hooks/use-slide-release"

/*
  The behaviour of the two hold-to-act hooks behind the e-stop (useLongPress: one touch stops, a long hold stops all;
  useSlideRelease: slide to release). Run twice: on the hook as written (use-long-press.test.tsx,
  use-slide-release.test.tsx) and on the hook compiled by the React Compiler as a product builds it (*.compiler.test.tsx), each
  passing in its own import of the hook. The harness components re-render on every frame of a hold and hand the hook new
  inline callbacks each time, as a product's screen does.
*/

const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

export function longPressScenarios(useLongPress: typeof UseLongPress) {
  function Stop({ onPress, onLongPress }: { onPress: () => void; onLongPress: () => void }) {
    const [renders, setRenders] = React.useState(0)
    const { progress, holding, handlers } = useLongPress({ onPress: () => onPress(), onLongPress: () => onLongPress(), duration: 2000, showAfter: 500 })
    return (
      <>
        <button type="button" {...handlers} data-progress={progress.toFixed(2)} data-holding={holding ? "" : undefined}>
          Stop all
        </button>
        <button type="button" onClick={() => setRenders((n) => n + 1)}>
          Re-render {renders}
        </button>
      </>
    )
  }
  const setup = () => {
    const onPress = vi.fn()
    const onLongPress = vi.fn()
    render(<Stop onPress={onPress} onLongPress={onLongPress} />)
    const button = screen.getByRole("button", { name: "Stop all" })
    const progress = () => Number(button.dataset.progress)
    const rerender = () => fireEvent.click(screen.getByRole("button", { name: /^Re-render/ }), { detail: 1 })
    return { onPress, onLongPress, button, progress, rerender }
  }

  it("presses at once on pointer down, shows no fill for a tap, and fires the long press once after the hold", () => {
    const { onPress, onLongPress, button, progress } = setup()
    fireEvent.pointerDown(button, { pointerId: 1 })
    expect(onPress).toHaveBeenCalledTimes(1)
    run(400)
    expect(progress()).toBe(0)
    expect(button.hasAttribute("data-holding")).toBe(false)
    run(850)
    expect(progress()).toBeGreaterThan(0.4)
    expect(progress()).toBeLessThan(0.6)
    expect(button.hasAttribute("data-holding")).toBe(true)
    run(800)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(progress()).toBe(0)
    run(3000)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("cancels on release, on leaving the target, on a cancelled pointer and on blur", () => {
    for (const end of ["pointerUp", "pointerLeave", "pointerCancel", "blur"] as const) {
      const { onLongPress, button, progress } = setup()
      fireEvent.pointerDown(button, { pointerId: 1 })
      run(1500)
      expect(progress()).toBeGreaterThan(0)
      fireEvent[end](button, { pointerId: 1 })
      expect(progress()).toBe(0)
      run(3000)
      expect(onLongPress).not.toHaveBeenCalled()
      document.body.innerHTML = ""
    }
  })

  it("keeps holding through re-renders with new callbacks, and stops its frames when unmounted", () => {
    const onPress = vi.fn()
    const onLongPress = vi.fn()
    const { unmount } = render(<Stop onPress={onPress} onLongPress={onLongPress} />)
    const button = screen.getByRole("button", { name: "Stop all" })
    fireEvent.pointerDown(button, { pointerId: 1 })
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /^Re-render/ }), { detail: 1 })
      run(300)
    }
    expect(Number(button.dataset.progress)).toBeGreaterThan(0.5)
    run(600)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    // A hold under way when the screen goes away fires nothing afterwards.
    fireEvent.pointerDown(button, { pointerId: 1 })
    run(1000)
    unmount()
    run(3000)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("Enter or Space presses and holds; key repeat and the click after the key are not second presses", () => {
    const { onPress, onLongPress, button } = setup()
    fireEvent.keyDown(button, { key: "Enter" })
    fireEvent.keyDown(button, { key: "Enter", repeat: true })
    expect(onPress).toHaveBeenCalledTimes(1)
    fireEvent.keyUp(button, { key: "Enter" })
    fireEvent.click(button, { detail: 0 })
    expect(onPress).toHaveBeenCalledTimes(1)
    run(10)
    fireEvent.keyDown(button, { key: " " })
    run(2100)
    expect(onPress).toHaveBeenCalledTimes(2)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("a click with no pointer or key before it (a screen reader, switch control) presses", () => {
    const { onPress, onLongPress, button } = setup()
    fireEvent.click(button, { detail: 0 })
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onLongPress).not.toHaveBeenCalled()
  })
}

export function slideReleaseScenarios(useSlideRelease: typeof UseSlideRelease) {
  // jsdom-like environments lay nothing out: the track is 300 wide, the thumb 60 with a 4 px inset, so it travels 232 px.
  function Slide({ onRelease, disabled }: { onRelease: () => void; disabled?: boolean }) {
    const [, setRenders] = React.useState(0)
    const { trackRef, thumbRef, position, dragging, released, reset, thumbHandlers, trackHandlers } = useSlideRelease({ onRelease: () => onRelease(), disabled })
    return (
      <>
        <div
          ref={(el) => {
            trackRef.current = el
            if (el) Object.defineProperty(el, "clientWidth", { value: 300, configurable: true })
          }}
          role="slider"
          aria-label="Slide to release"
          aria-valuenow={Math.round(position * 100)}
          tabIndex={0}
          data-dragging={dragging ? "" : undefined}
          data-released={released ? "" : undefined}
          {...trackHandlers}
        >
          <div
            ref={(el) => {
              thumbRef.current = el
              if (el) {
                Object.defineProperty(el, "offsetWidth", { value: 60, configurable: true })
                Object.defineProperty(el, "offsetTop", { value: 4, configurable: true })
              }
            }}
            data-testid="thumb"
            {...thumbHandlers}
          />
        </div>
        <button type="button" onClick={() => setRenders((n) => n + 1)}>
          Re-render
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </>
    )
  }
  const setup = (props: { disabled?: boolean } = {}) => {
    const onRelease = vi.fn()
    const utils = render(<Slide onRelease={onRelease} {...props} />)
    const track = screen.getByRole("slider")
    const thumb = screen.getByTestId("thumb")
    const value = () => Number(track.getAttribute("aria-valuenow"))
    const drag = (dx: number) => fireEvent.pointerMove(thumb, { pointerId: 1, clientX: 10 + dx })
    const down = () => fireEvent.pointerDown(thumb, { pointerId: 1, clientX: 10 })
    const up = () => fireEvent.pointerUp(thumb, { pointerId: 1, clientX: 10 })
    return { onRelease, track, thumb, value, drag, down, up, ...utils }
  }

  it("ignores a tap and a slip under 8 px, then follows the finger 1:1", () => {
    const { onRelease, value, drag, down, up, track } = setup()
    down()
    drag(7)
    expect(value()).toBe(0)
    expect(track.hasAttribute("data-dragging")).toBe(false)
    drag(116)
    expect(value()).toBe(50)
    expect(track.hasAttribute("data-dragging")).toBe(true)
    up()
    expect(value()).toBe(0)
    expect(onRelease).not.toHaveBeenCalled()
  })

  it("releases past 85 % of the track, once, and stays released until reset", () => {
    const { onRelease, value, drag, down, up, track } = setup()
    down()
    drag(232 * 0.9)
    up()
    expect(onRelease).toHaveBeenCalledTimes(1)
    expect(value()).toBe(100)
    expect(track.hasAttribute("data-released")).toBe(true)
    down()
    drag(232)
    up()
    expect(onRelease).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(value()).toBe(0)
    expect(track.hasAttribute("data-released")).toBe(false)
  })

  it("decides on the finger's last position even when a re-render lands between the move and the release", () => {
    const { onRelease, drag, down, up } = setup()
    down()
    drag(232 * 0.9)
    fireEvent.click(screen.getByRole("button", { name: "Re-render" }))
    up()
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it("holding Enter or Space releases after 2 s, the thumb travelling with it; letting go, blur or a hidden page cancel", () => {
    const { onRelease, track, value } = setup()
    fireEvent.keyDown(track, { key: "Enter" })
    run(1000)
    expect(value()).toBeGreaterThan(40)
    fireEvent.keyUp(track, { key: "Enter" })
    expect(value()).toBe(0)
    run(3000)
    expect(onRelease).not.toHaveBeenCalled()

    fireEvent.keyDown(track, { key: " " })
    run(1500)
    fireEvent.blur(track)
    run(3000)
    expect(onRelease).not.toHaveBeenCalled()

    fireEvent.keyDown(track, { key: " " })
    run(1000)
    Object.defineProperty(document, "hidden", { value: true, configurable: true })
    fireEvent(document, new Event("visibilitychange"))
    Object.defineProperty(document, "hidden", { value: false, configurable: true })
    run(3000)
    expect(onRelease).not.toHaveBeenCalled()

    fireEvent.keyDown(track, { key: "Enter" })
    fireEvent.click(screen.getByRole("button", { name: "Re-render" }))
    run(2000)
    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it("does nothing while disabled, and a hold under way when it unmounts never releases", () => {
    const disabled = setup({ disabled: true })
    disabled.down()
    disabled.drag(232)
    disabled.up()
    fireEvent.keyDown(disabled.track, { key: "Enter" })
    run(3000)
    expect(disabled.onRelease).not.toHaveBeenCalled()
    disabled.unmount()

    const { onRelease, track, unmount } = setup()
    fireEvent.keyDown(track, { key: "Enter" })
    run(1000)
    unmount()
    run(3000)
    expect(onRelease).not.toHaveBeenCalled()
  })
}

