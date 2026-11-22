import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CameraWall, cameraWallColumns, defaultCameraWallLabels, type CameraWallCamera } from "@/registry/syncrobotic/ui/camera-wall"

// happy-dom plays nothing: a `timeupdate` on a tile's video is a frame arriving, as in camera-feed's tests. Each camera's
// source is a URL that carries the quality the wall asked for, so the tests can read it back from the video.
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve())
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const cam = (id: string, extra: Partial<CameraWallCamera> = {}): CameraWallCamera => ({ id, label: "Front camera", source: id, ...extra })
const fleet = (n: number) => Array.from({ length: n }, (_, i) => cam(`AMR ${i + 1}`))
const source = (camera: CameraWallCamera, { quality }: { quality: string }) => ({ src: `/cam/${encodeURIComponent(camera.id)}.webm?q=${quality}` })

const tiles = () => [...document.querySelectorAll<HTMLElement>("[data-slot=camera-wall-tile]")]
const tileButtons = () => tiles().map((t) => t.querySelector<HTMLElement>("[role=button]")!)
const names = () => tileButtons().map((b) => b.getAttribute("aria-label"))
const order = () => tiles().map((t) => t.dataset.cameraId)
const videoOf = (id: string) => document.querySelector<HTMLVideoElement>(`[data-camera-id="${id}"] video`)
const frame = (v: HTMLVideoElement | null) => act(() => void v!.dispatchEvent(new Event("timeupdate")))

describe("cameraWallColumns", () => {
  it("is 1, 2×2, 3×3 or 4×4 by count, and fewer when the container is narrow", () => {
    expect([1, 2, 4, 5, 9, 10, 16, 40].map((n) => cameraWallColumns(n, null))).toEqual([1, 2, 2, 3, 3, 4, 4, 4])
    expect(cameraWallColumns(16, 1200)).toBe(4)
    expect(cameraWallColumns(16, 800)).toBe(3)
    expect(cameraWallColumns(16, 600)).toBe(2)
    expect(cameraWallColumns(16, 300)).toBe(1)
    expect(cameraWallColumns(2, 1200)).toBe(2)
  })
})

describe("CameraWall tiles", () => {
  it("names each tile with its camera, robot and state, and its alarm in words", () => {
    render(<CameraWall cameras={[cam("Forklift 2", { alarm: { priority: "critical", title: "Obstacle in path" } }), cam("AMR 1")]} getSource={source} />)
    expect(screen.getByRole("region", { name: "Cameras" })).toBeTruthy()
    expect(names()).toEqual(["Front camera, Forklift 2, Connecting, Critical · Obstacle in path", "Front camera, AMR 1, Connecting"])
    frame(videoOf("AMR 1"))
    expect(names()[1]).toBe("Front camera, AMR 1, Live")
    // The alarm is a shape and a word on the picture, not a tinted tile.
    const marker = tiles()[0]!.querySelector("[data-slot=camera-wall-alarm]")!
    expect(marker.textContent).toBe("Critical · Obstacle in path")
    expect(marker.querySelector("svg")).toBeTruthy()
    // In the picture's top-right half, clear of the clock a camera burns into the top-left.
    expect(marker.parentElement!.className).toMatch(/\bright-2\b.*\bw-1\/2\b.*\bjustify-end\b/)
    expect(marker.parentElement!.className).not.toMatch(/\b(left|inset-x)-/)
    expect(tiles()[0]!.className).not.toMatch(/bg-danger|bg-warning/)
  })

  it("sorts attention first (alarms, offline, stalled, then by name), or by name", () => {
    const cameras = [
      cam("Charlie"),
      cam("Bravo", { alarm: { priority: "low", title: "Wheel slip" } }),
      cam("Alpha"),
      cam("Delta", { status: "offline" }),
      cam("Echo", { alarm: { priority: "critical", title: "Obstacle" } }),
    ]
    render(<CameraWall cameras={cameras} getSource={source} />)
    expect(order()).toEqual(["Echo", "Delta", "Bravo", "Alpha", "Charlie"])
    fireEvent.click(screen.getByRole("radio", { name: "Name" }))
    expect(order()).toEqual(["Alpha", "Bravo", "Charlie", "Delta", "Echo"])
  })

  it("moves a stalled camera up, and the filter keeps only what needs attention", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 20, 14, 2, 31))
    render(<CameraWall cameras={[cam("Alpha"), cam("Bravo"), cam("Charlie")]} getSource={source} staleAfterMs={1000} />)
    for (const id of ["Alpha", "Bravo", "Charlie"]) frame(videoOf(id))
    expect(order()).toEqual(["Alpha", "Bravo", "Charlie"])
    act(() => vi.advanceTimersByTime(600))
    frame(videoOf("Alpha"))
    frame(videoOf("Bravo"))
    act(() => vi.advanceTimersByTime(600))
    expect(order()).toEqual(["Charlie", "Alpha", "Bravo"])
    expect(names()[0]).toBe("Front camera, Charlie, Stalled, last frame 14:02:31")
    fireEvent.click(screen.getByRole("button", { name: /Needs attention/ }))
    expect(order()).toEqual(["Charlie"])
  })

  it("says when no camera needs attention, and shows all again", () => {
    render(<CameraWall cameras={fleet(3)} getSource={source} defaultNeedsAttention />)
    expect(screen.getByText("No camera needs attention")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Show all cameras" }))
    expect(tiles()).toHaveLength(3)
  })
})

describe("CameraWall bandwidth", () => {
  it("plays at most maxLive streams, all low; the rest say Paused to save bandwidth", () => {
    const getSource = vi.fn(source)
    const onLiveChange = vi.fn()
    render(<CameraWall cameras={fleet(5)} getSource={getSource} maxLive={2} onLiveChange={onLiveChange} />)
    expect(document.querySelectorAll("video")).toHaveLength(2)
    expect(new Set(getSource.mock.calls.map(([c, o]) => `${c.id}:${o.quality}`))).toEqual(new Set(["AMR 1:low", "AMR 2:low"]))
    expect(onLiveChange).toHaveBeenLastCalledWith([
      { id: "AMR 1", quality: "low" },
      { id: "AMR 2", quality: "low" },
    ])
    expect(screen.getAllByText("Paused to save bandwidth")).toHaveLength(3)
    expect(names()[4]).toBe("Front camera, AMR 5, Paused, Paused to save bandwidth")
  })

  it("never spends a live slot on an offline camera", () => {
    render(<CameraWall cameras={[cam("A", { status: "offline", offlineReason: "Out of range." }), cam("B"), cam("C")]} getSource={source} maxLive={2} />)
    expect(screen.queryByText("Paused to save bandwidth")).toBeNull()
    expect(screen.getByText("Out of range.")).toBeTruthy()
    // An offline tile offers no Reconnect inside it: the tile itself is the button.
    expect(screen.queryByRole("button", { name: "Reconnect" })).toBeNull()
  })
})

describe("CameraWall focus", () => {
  it("opens a camera large on click, in high quality with the rest paused or low; Esc goes back", () => {
    const getSource = vi.fn(source)
    const onFocusedChange = vi.fn()
    render(<CameraWall cameras={fleet(4)} getSource={getSource} onFocusedChange={onFocusedChange} />)
    getSource.mockClear()
    fireEvent.click(tileButtons()[2]!)
    expect(onFocusedChange).toHaveBeenLastCalledWith("AMR 3")
    const feed = screen.getByRole("region", { name: "Front camera, AMR 3" })
    expect(feed.querySelector("video")!.getAttribute("src")).toBe("/cam/AMR%203.webm?q=high")
    expect(document.activeElement).toBe(feed)
    expect(new Set(getSource.mock.calls.filter(([, o]) => o.quality === "high").map(([c]) => c.id))).toEqual(new Set(["AMR 3"]))
    // The rest are in a strip under it, without the focused one.
    expect(order()).toEqual(["AMR 1", "AMR 2", "AMR 4"])
    fireEvent.keyDown(feed, { key: "Escape" })
    expect(onFocusedChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByRole("region", { name: "Front camera, AMR 3" })).toBeNull()
    expect(order()).toEqual(["AMR 1", "AMR 2", "AMR 3", "AMR 4"])
    expect(document.activeElement).toBe(tileButtons()[2])
  })

  it("follows a controlled focused camera", () => {
    const { rerender } = render(<CameraWall cameras={fleet(3)} getSource={source} focused="AMR 2" />)
    expect(screen.getByRole("region", { name: "Front camera, AMR 2" })).toBeTruthy()
    rerender(<CameraWall cameras={fleet(3)} getSource={source} focused={null} />)
    expect(tiles()).toHaveLength(3)
  })
})

describe("CameraWall keyboard", () => {
  it("is one Tab stop; arrows move by tile and by row; Enter opens", () => {
    render(<CameraWall cameras={fleet(9)} getSource={source} />)
    const b = tileButtons()
    expect(b.filter((x) => x.tabIndex === 0)).toEqual([b[0]])
    act(() => b[0]!.focus())
    fireEvent.keyDown(b[0]!, { key: "ArrowRight" })
    expect(document.activeElement).toBe(b[1])
    fireEvent.keyDown(b[1]!, { key: "ArrowDown" })
    expect(document.activeElement).toBe(b[4])
    expect(tileButtons().filter((x) => x.tabIndex === 0)).toEqual([b[4]])
    fireEvent.keyDown(b[4]!, { key: "End" })
    expect(document.activeElement).toBe(b[8])
    fireEvent.keyDown(b[8]!, { key: "ArrowRight" })
    expect(document.activeElement).toBe(b[8])
    fireEvent.keyDown(b[8]!, { key: "Enter" })
    expect(screen.getByRole("region", { name: "Front camera, AMR 9" })).toBeTruthy()
  })

  it("pages when there are more tiles than fit, with Page Down too", () => {
    render(<CameraWall cameras={fleet(10)} getSource={source} pageSize={4} />)
    expect(screen.getByText("1–4 of 10 cameras")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Next cameras" }))
    expect(order()).toEqual(["AMR 5", "AMR 6", "AMR 7", "AMR 8"])
    const first = tileButtons()[0]!
    act(() => first.focus())
    fireEvent.keyDown(first, { key: "PageDown" })
    expect(order()).toEqual(["AMR 9", "AMR 10"])
    expect(document.activeElement).toBe(tileButtons()[0])
  })

  it("goes back to the page of the camera it showed", () => {
    render(<CameraWall cameras={fleet(10)} getSource={source} pageSize={4} defaultFocused="AMR 7" />)
    fireEvent.click(screen.getByRole("button", { name: "All cameras" }))
    expect(order()).toEqual(["AMR 5", "AMR 6", "AMR 7", "AMR 8"])
    expect(document.activeElement).toBe(tileButtons()[2])
  })
})

describe("CameraWall announcements", () => {
  it("announces cameras that stall, batched politely, at most every announceEveryMs", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date(2026, 10, 20, 14, 2, 31))
    render(<CameraWall cameras={fleet(3)} getSource={source} staleAfterMs={1000} announceEveryMs={5000} />)
    const status = () => screen.getAllByRole("status").find((s) => s.closest("[data-slot=camera-wall]") && !s.closest("[data-slot=camera-feed]"))!
    for (const id of ["AMR 1", "AMR 2", "AMR 3"]) frame(videoOf(id))
    // Connecting to Live is not news.
    act(() => vi.advanceTimersByTime(500))
    expect(status().textContent!.trim()).toBe("")
    frame(videoOf("AMR 2"))
    frame(videoOf("AMR 3"))
    act(() => vi.advanceTimersByTime(600))
    // The feed reports after its commit; the announcement goes out on the next tick.
    act(() => vi.advanceTimersByTime(1))
    expect(status().textContent!.trim()).toBe("Front camera, AMR 1: Stalled, last frame 14:02:31.")
    // Within the next 5 s, changes wait and are read together.
    frame(videoOf("AMR 1"))
    act(() => vi.advanceTimersByTime(1000))
    expect(status().textContent!.trim()).toBe("Front camera, AMR 1: Stalled, last frame 14:02:31.")
    act(() => vi.advanceTimersByTime(4000))
    // Each camera once, in its latest state: AMR 1 came back and stalled again meanwhile.
    expect(status().textContent!.trim()).toBe("Front camera, AMR 1: Stalled, last frame 14:02:32. Front camera, AMR 2: Stalled, last frame 14:02:31. Front camera, AMR 3: Stalled, last frame 14:02:31.")
  })

  it("exports its defaults, and takes any label it is given", () => {
    expect(defaultCameraWallLabels.pausedToSave).toBe("Paused to save bandwidth")
    render(
      <CameraWall
        cameras={fleet(2)}
        getSource={source}
        maxLive={1}
        labels={{ name: "攝影機", pausedToSave: "為節省頻寬已暫停", feed: { paused: "已暫停", connecting: "連線中" } }}
      />,
    )
    expect(screen.getByRole("region", { name: "攝影機" })).toBeTruthy()
    expect(within(tiles()[1]!).getByText("為節省頻寬已暫停")).toBeTruthy()
    expect(names()).toEqual(["Front camera, AMR 1, 連線中", "Front camera, AMR 2, 已暫停, 為節省頻寬已暫停"])
  })
})
