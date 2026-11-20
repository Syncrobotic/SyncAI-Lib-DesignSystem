import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CameraFeed, defaultCameraFeedLabels } from "@/registry/syncrobotic/ui/camera-feed"

// The DOM here (happy-dom) plays nothing and has no requestVideoFrameCallback, so the feed falls back to `timeupdate`: firing it is a
// frame arriving. play() and pause() are stood in for, as in the media player's tests.
let play: ReturnType<typeof vi.fn>
let pause: ReturnType<typeof vi.fn>
let requestFullscreen: ReturnType<typeof vi.fn>

beforeEach(() => {
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  requestFullscreen = vi.fn(() => Promise.resolve())
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never)
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as never)
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, writable: true, value: requestFullscreen })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const setup = (props: Partial<React.ComponentProps<typeof CameraFeed>> = {}) => {
  const view = render(<CameraFeed label="Front camera" source="Patrol dog 7F3A" src="/live.webm" {...props} />)
  const root = screen.getByRole("region", { name: "Front camera, Patrol dog 7F3A" })
  const video = view.container.querySelector("video")!
  const frame = () => act(() => void video.dispatchEvent(new Event("timeupdate")))
  return { ...view, root, video, frame }
}
const state = (root: HTMLElement) => root.getAttribute("data-state")
const stateLine = (c: HTMLElement) => c.querySelector("[data-slot=camera-feed-state]")!.textContent
const key = (el: Element, k: string) => fireEvent.keyDown(el, { key: k })

describe("CameraFeed states", () => {
  it("says No camera with nothing to show, and offers nothing to press", () => {
    render(<CameraFeed label="Rear camera" source="Delivery bot 3" />)
    const root = screen.getByRole("region", { name: "Rear camera, Delivery bot 3" })
    expect(state(root)).toBe("none")
    expect(screen.getAllByText("No camera").length).toBeGreaterThan(0)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("is connecting until the first frame, then live with the latency", () => {
    const { root, frame, container } = setup({ latencyMs: 182.4 })
    expect(state(root)).toBe("connecting")
    expect(screen.getByText("Connecting to camera…")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Pause view" })).toBeNull()
    frame()
    expect(state(root)).toBe("live")
    expect(stateLine(container)).toContain("Live")
    expect(stateLine(container)).toContain("182 ms")
  })

  it("stays connecting while the app says so, even with frames", () => {
    const { root, frame } = setup({ status: "connecting" })
    frame()
    expect(state(root)).toBe("connecting")
  })

  it("says Camera offline with the reason, and Reconnect only with onRetry", () => {
    const onRetry = vi.fn()
    const { rerender } = render(<CameraFeed label="Front camera" status="offline" offlineReason="The robot is out of network range." />)
    expect(screen.getByText("The robot is out of network range.")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Reconnect" })).toBeNull()
    rerender(<CameraFeed label="Front camera" status="offline" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("goes offline when the video fails, and a src can reload itself", () => {
    const { root, video } = setup()
    act(() => void video.dispatchEvent(new Event("error")))
    expect(state(root)).toBe("offline")
    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }))
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled()
    expect(state(root)).toBe("connecting")
  })

  it("hides overlays while there is no picture", () => {
    const { container, frame } = setup({ children: <span data-testid="box" /> })
    expect(screen.queryByTestId("box")).toBeNull()
    frame()
    expect(container.querySelector("[data-slot=camera-feed-overlay] [data-testid=box]")).toBeTruthy()
  })

  it("holds its aspect ratio before the first frame", () => {
    const { container } = setup({ aspectRatio: 4 / 3 })
    const box = container.querySelector<HTMLElement>("[data-slot=camera-feed-frame]")!
    expect(box.style.getPropertyValue("--camera-feed-ratio")).toBe(String(4 / 3))
  })
})

describe("CameraFeed stalled", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 20, 14, 2, 31))
  })

  it("says Stalled with the last frame's time after staleAfterMs without a frame", () => {
    const { root, frame, container } = setup()
    frame()
    act(() => vi.advanceTimersByTime(1999))
    expect(state(root)).toBe("live")
    act(() => vi.advanceTimersByTime(1))
    expect(state(root)).toBe("stalled")
    expect(stateLine(container)).toContain("Stalled")
    expect(screen.getByText("last frame 14:02:31")).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe("Stalled, last frame 14:02:31")
  })

  it("keeps live while frames keep coming, and recovers when they come back", () => {
    const { root, frame } = setup({ staleAfterMs: 500 })
    for (let i = 0; i < 10; i++) {
      frame()
      act(() => vi.advanceTimersByTime(400))
    }
    expect(state(root)).toBe("live")
    act(() => vi.advanceTimersByTime(200))
    expect(state(root)).toBe("stalled")
    frame()
    expect(state(root)).toBe("live")
  })

  it("never stalls while the view is paused here", () => {
    const { root, frame } = setup()
    frame()
    root.focus()
    key(root, " ")
    expect(state(root)).toBe("paused")
    act(() => vi.advanceTimersByTime(10_000))
    expect(state(root)).toBe("paused")
  })
})

describe("CameraFeed keyboard and controls", () => {
  it("pauses and resumes the view with Space while focus is inside", () => {
    const { root, frame, container } = setup()
    frame()
    root.focus()
    key(root, " ")
    expect(pause).toHaveBeenCalledTimes(1)
    expect(state(root)).toBe("paused")
    expect(stateLine(container)).toContain("Paused")
    expect(screen.getByRole("button", { name: "Resume view" })).toBeTruthy()
    key(root, " ")
    expect(play).toHaveBeenCalled()
    expect(state(root)).toBe("live")
  })

  it("goes full screen with F", () => {
    const { root, frame } = setup()
    frame()
    root.focus()
    key(root, "f")
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it("ignores keys pressed outside the feed", () => {
    const { root, frame } = setup()
    frame()
    key(document.body, " ")
    key(document.body, "f")
    expect(state(root)).toBe("live")
    expect(requestFullscreen).not.toHaveBeenCalled()
  })

  it("lets Space press a focused button instead of pausing twice", () => {
    const { root, frame } = setup()
    frame()
    const button = screen.getByRole("button", { name: "Pause view" })
    button.focus()
    key(button, " ")
    expect(pause).not.toHaveBeenCalled()
    expect(state(root)).toBe("live")
  })

  it("offers Mute only when the stream has sound", () => {
    const { frame, unmount } = setup()
    frame()
    expect(screen.queryByRole("button", { name: /mute/i })).toBeNull()
    unmount()
    const second = setup({ audio: true })
    second.frame()
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }))
    expect(second.video.muted).toBe(false)
  })

  it("draws the frame on screen to a PNG for onSnapshot", () => {
    const onSnapshot = vi.fn()
    const blob = new Blob(["png"], { type: "image/png" })
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as never)
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (cb: BlobCallback, type?: string) {
      expect(type).toBe("image/png")
      cb(blob)
    })
    const { video, frame } = setup({ onSnapshot })
    Object.defineProperty(video, "videoWidth", { value: 1280 })
    Object.defineProperty(video, "videoHeight", { value: 720 })
    frame()
    fireEvent.click(screen.getByRole("button", { name: "Take snapshot" }))
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
    expect(onSnapshot).toHaveBeenCalledWith(blob)
  })
})

describe("CameraFeed labels", () => {
  it("exports its defaults", () => {
    expect(defaultCameraFeedLabels.live).toBe("Live")
    expect(defaultCameraFeedLabels.formatTime(new Date(2026, 0, 1, 9, 5, 7))).toBe("09:05:07")
  })

  it("takes any label it is given and keeps the rest", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 20, 14, 2, 31))
    const { root, frame, container } = setup({
      latencyMs: 90,
      labels: { live: "En direct", latency: (ms) => `${ms} ms de retard`, stalled: "Figé", lastFrame: (t) => `dernière image ${t}`, formatTime: () => "2:02:31 PM" },
    })
    frame()
    expect(stateLine(container)).toContain("En direct")
    expect(stateLine(container)).toContain("90 ms de retard")
    expect(screen.getByRole("button", { name: "Pause view" })).toBeTruthy()
    act(() => vi.advanceTimersByTime(2000))
    expect(state(root)).toBe("stalled")
    expect(screen.getByText("dernière image 2:02:31 PM")).toBeTruthy()
  })
})
