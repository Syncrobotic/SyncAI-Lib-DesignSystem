import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CameraWall, type CameraWallCamera } from "@/registry/syncrobotic/ui/camera-wall?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own page, which keeps its
// cameras in state) and camera-wall imported with ?react-compiler, so these check the wall still follows what its feeds
// report (states arrive through callbacks into refs and state, not props), its focus, its live slots and its pages once
// compiled.

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve())
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
  vi.setSystemTime(new Date(2026, 10, 20, 14, 2, 31))
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const fleet = (n: number): CameraWallCamera[] => Array.from({ length: n }, (_, i) => ({ id: `AMR ${i + 1}`, label: "Front camera", source: `AMR ${i + 1}` }))
const tiles = () => [...document.querySelectorAll<HTMLElement>("[data-slot=camera-wall-tile]")]
const order = () => tiles().map((t) => t.dataset.cameraId)
const frame = (id: string) => act(() => void document.querySelector(`[data-camera-id="${id}"] video`)!.dispatchEvent(new Event("timeupdate")))

function Console({ maxLive }: { maxLive?: number }) {
  const [cameras, setCameras] = React.useState(() => fleet(3))
  return (
    <>
      <button type="button" onClick={() => setCameras((c) => c.map((x) => (x.id === "AMR 3" ? { ...x, alarm: { priority: "critical", title: "Obstacle" } } : x)))}>
        Alarm
      </button>
      <CameraWall cameras={cameras} getSource={(c, { quality }) => ({ src: `/cam/${c.id}.webm?q=${quality}` })} maxLive={maxLive} staleAfterMs={1000} />
    </>
  )
}

describe("camera-wall, compiled", () => {
  it("re-sorts on a new alarm and on a feed that stalls", () => {
    render(<Console />)
    for (const id of ["AMR 1", "AMR 2", "AMR 3"]) frame(id)
    expect(order()).toEqual(["AMR 1", "AMR 2", "AMR 3"])
    fireEvent.click(screen.getByRole("button", { name: "Alarm" }))
    expect(order()).toEqual(["AMR 3", "AMR 1", "AMR 2"])
    act(() => vi.advanceTimersByTime(600))
    frame("AMR 1")
    frame("AMR 3")
    act(() => vi.advanceTimersByTime(600))
    expect(order()).toEqual(["AMR 3", "AMR 2", "AMR 1"])
    expect(tiles()[1]!.querySelector("[role=button]")!.getAttribute("aria-label")).toBe("Front camera, AMR 2, Stalled, last frame 14:02:31")
  })

  it("opens and closes a camera, moving the live slot and the quality with it", () => {
    render(<Console maxLive={1} />)
    expect(document.querySelectorAll("video")).toHaveLength(1)
    fireEvent.click(tiles()[2]!.querySelector("[role=button]")!)
    const feed = screen.getByRole("region", { name: "Front camera, AMR 3" })
    expect(feed.querySelector("video")!.getAttribute("src")).toBe("/cam/AMR 3.webm?q=high")
    expect(document.querySelectorAll("video")).toHaveLength(1)
    expect(screen.getAllByText("Paused to save bandwidth")).toHaveLength(2)
    fireEvent.keyDown(feed, { key: "Escape" })
    expect(order()).toEqual(["AMR 1", "AMR 2", "AMR 3"])
    expect(document.querySelector("video")!.getAttribute("src")).toBe("/cam/AMR 1.webm?q=low")
  })
})
