import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MediaPlayer, formatMediaTime, type MediaMarker } from "@/registry/syncrobotic/ui/media-player"

// The DOM here does not play media. Stand in for the browser: play() and pause() flip `paused` and fire the events a
// browser fires, so the player reacts to events, as it does for real.
const paused = new WeakMap<HTMLMediaElement, boolean>()
let play: ReturnType<typeof vi.fn>
let pause: ReturnType<typeof vi.fn>
let load: ReturnType<typeof vi.fn>
let requestFullscreen: ReturnType<typeof vi.fn>

beforeEach(() => {
  play = vi.fn(function (this: HTMLMediaElement) {
    paused.set(this, false)
    this.dispatchEvent(new Event("play"))
    return Promise.resolve()
  })
  pause = vi.fn(function (this: HTMLMediaElement) {
    paused.set(this, true)
    this.dispatchEvent(new Event("pause"))
  })
  load = vi.fn()
  requestFullscreen = vi.fn(() => Promise.resolve())
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never)
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as never)
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(load as never)
  Object.defineProperty(HTMLMediaElement.prototype, "paused", { configurable: true, get() { return paused.get(this) ?? true } })
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, writable: true, value: requestFullscreen })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const markers: MediaMarker[] = [
  { time: 2, label: "Patrol started" },
  { time: 42, label: "Obstacle" },
]
const setup = (props: Partial<React.ComponentProps<typeof MediaPlayer>> = {}) => {
  const view = render(<MediaPlayer label="Patrol dog 7F3A, front camera" src="/clip.webm" duration={60} {...props} />)
  const frame = screen.getByRole("region", { name: "Patrol dog 7F3A, front camera" })
  const video = view.container.querySelector("video")!
  return { ...view, frame, video }
}
const key = (el: Element, k: string) => fireEvent.keyDown(el, { key: k })
const time = (c: HTMLElement) => ["current", "total"].map((s) => c.querySelector(`[data-slot=media-player-${s}]`)!.textContent)

describe("formatMediaTime", () => {
  it("writes a clock, with hours only when there are some", () => {
    expect(formatMediaTime(0)).toBe("0:00")
    expect(formatMediaTime(42.9)).toBe("0:42")
    expect(formatMediaTime(725)).toBe("12:05")
    expect(formatMediaTime(3729)).toBe("1:02:09")
    expect(formatMediaTime(NaN)).toBe("–:––")
    expect(formatMediaTime(Infinity)).toBe("–:––")
  })
})

describe("MediaPlayer keyboard", () => {
  it("plays and pauses with Space and K while focus is in the player", () => {
    const { frame } = setup()
    frame.focus()
    key(frame, " ")
    expect(play).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy()
    key(frame, "k")
    expect(pause).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy()
  })

  it("ignores keys pressed outside the player", () => {
    setup()
    key(document.body, " ")
    key(document.body, "k")
    key(document.body, "m")
    expect(play).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Mute" })).toBeTruthy()
  })

  it("lets Space press the focused button instead of playing", () => {
    setup()
    const mute = screen.getByRole("button", { name: "Mute" })
    mute.focus()
    key(mute, " ")
    expect(play).not.toHaveBeenCalled()
    // K still plays from a button.
    key(mute, "k")
    expect(play).toHaveBeenCalledTimes(1)
  })

  it("moves 5 s with the arrows, 10 s with J and L, within the clip", () => {
    const { frame, video } = setup()
    key(frame, "ArrowRight")
    expect(video.currentTime).toBe(5)
    key(frame, "l")
    expect(video.currentTime).toBe(15)
    key(frame, "ArrowLeft")
    expect(video.currentTime).toBe(10)
    key(frame, "j")
    key(frame, "j")
    expect(video.currentTime).toBe(0)
    for (let i = 0; i < 8; i++) key(frame, "L")
    expect(video.currentTime).toBe(60)
  })

  it("takes the arrows on the timeline too, so they move 5 s and not one step", () => {
    const { video } = setup()
    const timeline = screen.getByRole("slider", { name: "Position in clip" })
    key(timeline, "ArrowRight")
    expect(video.currentTime).toBe(5)
    expect(timeline.getAttribute("aria-valuetext")).toBe("0:05 of 1:00")
  })

  it("mutes with M and goes full screen with F", () => {
    const { frame, video } = setup()
    key(frame, "m")
    expect(video.muted).toBe(true)
    expect(screen.getByRole("button", { name: "Unmute" })).toBeTruthy()
    key(frame, "M")
    expect(video.muted).toBe(false)
    key(frame, "f")
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it("leaves modified keys to the browser", () => {
    const { frame } = setup()
    fireEvent.keyDown(frame, { key: "f", ctrlKey: true })
    fireEvent.keyDown(frame, { key: "k", metaKey: true })
    expect(requestFullscreen).not.toHaveBeenCalled()
    expect(play).not.toHaveBeenCalled()
  })

  it("steps the speed through 0.5, 1, 1.5 and 2", () => {
    const { video } = setup()
    const speed = () => screen.getByRole("button", { name: /^Playback speed/ })
    expect(speed().getAttribute("aria-label")).toBe("Playback speed 1×")
    fireEvent.click(speed())
    expect(video.playbackRate).toBe(1.5)
    fireEvent.click(speed())
    fireEvent.click(speed())
    expect(video.playbackRate).toBe(0.5)
    expect(speed().textContent).toBe("0.5×")
  })
})

describe("MediaPlayer markers", () => {
  it("lists markers under the player, and a marker jumps there", () => {
    const { video } = setup({ markers })
    const list = screen.getByRole("list", { name: "Events in this clip" })
    const items = list.querySelectorAll("button")
    expect([...items].map((b) => b.textContent)).toEqual(["0:02Patrol started", "0:42Obstacle"])
    fireEvent.click(items[1])
    expect(video.currentTime).toBe(42)
  })

  it("draws a tick per marker on the timeline, hidden from screen readers and the Tab order", () => {
    const { container, video } = setup({ markers })
    const ticks = container.querySelectorAll<HTMLButtonElement>('[data-slot=media-player-controls] button[aria-hidden="true"]')
    expect(ticks).toHaveLength(2)
    expect(ticks[1].tabIndex).toBe(-1)
    fireEvent.click(ticks[1])
    expect(video.currentTime).toBe(42)
  })
})

describe("MediaPlayer states", () => {
  it("shows a spinner and no controls while the clip's link loads", () => {
    vi.useFakeTimers()
    const { container, video } = setup({ src: undefined, loading: true })
    act(() => void vi.advanceTimersByTime(300))
    expect(screen.getByRole("status", { name: "Loading clip" })).toBeTruthy()
    expect(container.querySelector("[data-slot=media-player-controls]")).toBeNull()
    expect(video.getAttribute("src")).toBeNull()
  })

  it("says Buffering while playback waits for data", () => {
    vi.useFakeTimers()
    const { frame, video } = setup()
    key(frame, " ")
    fireEvent(video, new Event("waiting"))
    act(() => void vi.advanceTimersByTime(300))
    expect(screen.getByRole("status", { name: "Buffering" })).toBeTruthy()
    fireEvent(video, new Event("playing"))
    expect(screen.queryByRole("status", { name: "Buffering" })).toBeNull()
  })

  it("says why a clip is unavailable, with a retry only when one is given", () => {
    const { rerender } = render(<MediaPlayer label="Clip" unavailable="the robot uploads it when it next docks." />)
    expect(screen.getByText("Clip unavailable:")).toBeTruthy()
    expect(screen.getByText("the robot uploads it when it next docks.")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Reload clip" })).toBeNull()
    const onRetry = vi.fn()
    rerender(<MediaPlayer label="Clip" unavailable="the download link expired." onRetry={onRetry} />)
    fireEvent.click(screen.getByRole("button", { name: "Reload clip" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("turns a playback error into an alert with a retry that reloads the clip", () => {
    const { video, container } = setup()
    Object.defineProperty(video, "error", { configurable: true, value: { code: 4 } })
    fireEvent(video, new Event("error"))
    const alert = screen.getByRole("alert")
    expect(alert.textContent).toContain("Clip unavailable:")
    expect(alert.textContent).toContain("not a video this browser plays")
    expect(container.querySelector("[data-slot=media-player-controls]")).toBeNull()
    // Keys do nothing while there is nothing to play.
    key(screen.getByRole("region"), " ")
    expect(play).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Reload clip" }))
    expect(load).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("shows the length from the record before the file's metadata", () => {
    const { container } = setup({ preload: "none" })
    expect(time(container)).toEqual(["0:00", "1:00"])
  })

  it("opens at startAt", () => {
    const { container } = setup({ startAt: 40 })
    expect(time(container)).toEqual(["0:40", "1:00"])
  })
})

describe("MediaPlayer autoplay and controls", () => {
  const motion = (reduce: boolean) =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    )

  it("autoplays muted", () => {
    motion(false)
    const { video } = setup({ autoPlay: true })
    expect(play).toHaveBeenCalledTimes(1)
    expect(video.muted).toBe(true)
  })

  it("never autoplays for someone who asked for reduced motion", () => {
    motion(true)
    setup({ autoPlay: true })
    expect(play).not.toHaveBeenCalled()
  })

  it("hides the controls while playing once the pointer rests, but not while a finger is on them", () => {
    vi.useFakeTimers()
    const { container, frame } = setup()
    const state = () => frame.getAttribute("data-controls")
    expect(state()).toBe("shown") // paused
    act(() => void fireEvent.click(screen.getByRole("button", { name: "Play" })))
    // The click focused nothing here (no real focus in this DOM), so only the pointer keeps them.
    fireEvent.pointerMove(frame, { pointerType: "mouse" })
    expect(state()).toBe("shown")
    act(() => void vi.advanceTimersByTime(2500))
    expect(state()).toBe("hidden")

    const controls = container.querySelector("[data-slot=media-player-controls]")!
    fireEvent.pointerDown(controls, { pointerType: "touch" })
    act(() => void vi.advanceTimersByTime(10000))
    expect(state()).toBe("shown")
    act(() => void window.dispatchEvent(new Event("pointerup")))
    act(() => void vi.advanceTimersByTime(2400))
    expect(state()).toBe("shown")
    act(() => void vi.advanceTimersByTime(100))
    expect(state()).toBe("hidden")
  })

  it("keeps the controls while focus is inside", () => {
    vi.useFakeTimers()
    const { frame } = setup()
    key(frame, " ")
    act(() => void vi.advanceTimersByTime(3000))
    fireEvent.focus(screen.getByRole("button", { name: "Pause" }))
    expect(frame.getAttribute("data-controls")).toBe("shown")
  })
})
