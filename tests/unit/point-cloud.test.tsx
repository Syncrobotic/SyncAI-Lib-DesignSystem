import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  PointCloud,
  defaultPointCloudLabels,
  fitPointCloudCamera,
  orbitPointCloudCamera,
  packPointCloud,
  panPointCloudCamera,
  pointCloudBounds,
  pointCloudCameraForKey,
  pointCloudColorRange,
  pointCloudGizmo,
  pointCloudGizmoLayout,
  pointCloudGrid,
  pointCloudRampPosition,
  zoomPointCloudCamera,
  pointCloudPaletteSources,
  pointCloudWheelZoom,
  type PointCloudCamera,
} from "@/registry/syncrobotic/ui/point-cloud"

// The DOM here has no GPU. The pure parts (bounds, camera, colour) are checked directly; the component is checked
// without WebGL (its fallback), and with a stand-in context that accepts every call, for what only shows once it can draw.
const FOV = (50 * Math.PI) / 180
const cloud = (...xyz: number[]) => new Float32Array(xyz)
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)
/** The text an element is described by: each id in aria-describedby, in order. */
const description = (el: Element) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ")

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("pointCloudBounds", () => {
  it("spans the finite points and counts them, skipping NaN rays", () => {
    const b = pointCloudBounds(cloud(1, -2, 0, NaN, 0, 0, 4, 3, 2.5, -1, 0, Infinity, 0, 0, -0.5))
    expect(b).toEqual({ min: [0, -2, -0.5], max: [4, 3, 2.5], count: 3 })
  })

  it("is null with no finite point", () => {
    expect(pointCloudBounds(cloud())).toBeNull()
    expect(pointCloudBounds(cloud(NaN, NaN, NaN))).toBeNull()
    // A trailing partial point is not a point.
    expect(pointCloudBounds(cloud(1, 2))).toBeNull()
  })
})

describe("fitPointCloudCamera", () => {
  const b = { min: [0, -2, 0] as [number, number, number], max: [10, 2, 3] as [number, number, number], count: 2 }

  it("looks at the cloud's centre", () => {
    expect(fitPointCloudCamera(b, 16 / 9).target).toEqual([5, 0, 1.5])
  })

  it("backs off just far enough to keep every corner in view, with a small margin", () => {
    // A 2 m cube seen level from +x: the near face is 1 m closer, and 1 m off centre fills the vertical half-field.
    const cube = { min: [-1, -1, -1] as [number, number, number], max: [1, 1, 1] as [number, number, number], count: 8 }
    const c = fitPointCloudCamera(cube, 2, 0, 0)
    close(c.distance, (1 + 1 / Math.tan(FOV / 2)) * 1.08)
  })

  it("backs off further in a tall, narrow view, where the width decides", () => {
    expect(fitPointCloudCamera(b, 0.5).distance).toBeGreaterThan(fitPointCloudCamera(b, 2).distance)
  })

  it("keeps the angle it is given, and frames the ground round the origin with nothing to fit", () => {
    const c = fitPointCloudCamera(b, 1, 1, 0.3)
    expect([c.yaw, c.pitch]).toEqual([1, 0.3])
    const empty = fitPointCloudCamera(null, 1)
    expect(empty.target).toEqual([0, 0, 0])
    expect(empty.distance).toBeGreaterThan(5)
  })
})

describe("camera moves", () => {
  const c: PointCloudCamera = { target: [0, 0, 0], yaw: 0, pitch: 0.5, distance: 10 }

  it("orbits: a drag right turns the cloud with the hand, down raises the eye, and the pitch stops short of the poles", () => {
    const o = orbitPointCloudCamera(c, 100, 50)
    expect(o.yaw).toBeLessThan(0)
    expect(o.pitch).toBeGreaterThan(0.5)
    expect(orbitPointCloudCamera(c, 0, 10_000).pitch).toBeLessThan(Math.PI / 2)
    expect(orbitPointCloudCamera(c, 0, -10_000).pitch).toBeGreaterThan(-Math.PI / 2)
    expect(o.distance).toBe(10)
  })

  it("zooms by a factor, within limits, and ignores a factor that is not one", () => {
    expect(zoomPointCloudCamera(c, 2).distance).toBe(5)
    expect(zoomPointCloudCamera(c, 1e9).distance).toBeGreaterThan(0)
    expect(zoomPointCloudCamera(c, 0)).toBe(c)
    expect(zoomPointCloudCamera(c, NaN)).toBe(c)
  })

  it("pans so the target follows the pointer: a full view's height moves it the view's height in metres", () => {
    // Looking back along x (yaw 0, level): screen right is +y, screen up is +z.
    const level = { ...c, pitch: 0 }
    const viewMetres = 2 * level.distance * Math.tan(FOV / 2)
    const right = panPointCloudCamera(level, 400, 0, 400)
    close(right.target[1], -viewMetres)
    close(right.target[0], 0)
    const down = panPointCloudCamera(level, 0, 400, 400)
    close(down.target[2], viewMetres)
  })

  it("gives the gizmo each axis's direction on screen", () => {
    // From +x looking back, level: y points right on screen, z up (negative y on screen), x straight at the eye.
    const [x, y, z] = pointCloudGizmo({ ...c, pitch: 0 })
    close(x!.x, 0)
    close(x!.y, 0)
    close(y!.x, 1)
    close(z!.y, -1)
  })
})

describe("pointCloudGizmoLayout", () => {
  const words = ["x forward", "y left", "z up"]
  const boxes = (c: PointCloudCamera) =>
    pointCloudGizmoLayout(c, words, 26).map((g, i) => ({ ...g.label, w: words[i]!.length * 7.2 + 4 }))
  const overlaps = (b: ReturnType<typeof boxes>) =>
    b.some((p, i) => b.some((q, j) => j > i && Math.abs(p.x - q.x) < (p.w + q.w) / 2 && Math.abs(p.y - q.y) < 14))

  it("never lets two words cover each other, at any angle", () => {
    for (let yaw = 0; yaw < 2 * Math.PI; yaw += Math.PI / 16)
      for (const pitch of [-1.4, -0.6, 0, 0.3, 0.8, 1.4]) expect(overlaps(boxes({ target: [0, 0, 0], yaw, pitch, distance: 5 }))).toBe(false)
  })

  it("puts each word past its arm's tip", () => {
    const [x, y, z] = pointCloudGizmoLayout({ target: [0, 0, 0], yaw: 0.6, pitch: 0.4, distance: 5 }, words, 26)
    for (const g of [x!, y!, z!]) expect(Math.hypot(g.label.x, g.label.y)).toBeGreaterThan(Math.hypot(g.tip.x, g.tip.y))
  })
})

describe("pointCloudCameraForKey", () => {
  const c: PointCloudCamera = { target: [1, 2, 3], yaw: 0, pitch: 0.2, distance: 10 }
  const reset: PointCloudCamera = { target: [0, 0, 0], yaw: 2, pitch: 0.5, distance: 20 }
  const key = (k: string, shiftKey = false) => pointCloudCameraForKey(c, { key: k, shiftKey }, reset, 400)

  it("turns with the arrows", () => {
    expect(key("ArrowLeft")!.yaw).toBeGreaterThan(0)
    expect(key("ArrowRight")!.yaw).toBeLessThan(0)
    expect(key("ArrowUp")!.pitch).toBeGreaterThan(0.2)
    expect(key("ArrowDown")!.pitch).toBeLessThan(0.2)
  })

  it("pans with Shift and the arrows, keeping the angle", () => {
    const p = key("ArrowRight", true)!
    expect(p.yaw).toBe(0)
    expect(p.target).not.toEqual(c.target)
  })

  it("zooms with + and −, resets with 0, and leaves every other key alone", () => {
    expect(key("+")!.distance).toBeLessThan(10)
    expect(key("=")!.distance).toBeLessThan(10)
    expect(key("-")!.distance).toBeGreaterThan(10)
    expect(key("0")).toBe(reset)
    expect(key("a")).toBeNull()
    expect(key("Enter")).toBeNull()
  })
})

describe("colour", () => {
  const pts = cloud(0, 0, -1, 0, 0, 3, NaN, 0, 0, 0, 0, 1)
  const inten = new Float32Array([10, 200, 999, 50])

  it("runs the height scale over the finite points' z", () => {
    expect(pointCloudColorRange(pts, "height")).toEqual([-1, 3])
  })

  it("runs the intensity scale over the finite points' intensities only", () => {
    expect(pointCloudColorRange(pts, "intensity", inten)).toEqual([10, 200])
  })

  it("uses a fixed range when the app gives one, and has none for colorBy none", () => {
    expect(pointCloudColorRange(pts, "height", undefined, [0, 2])).toEqual([0, 2])
    expect(pointCloudColorRange(pts, "none")).toBeNull()
  })

  it("places a value on the ramp from 0 to 1, clamped", () => {
    expect(pointCloudRampPosition(-1, [-1, 3])).toBe(0)
    expect(pointCloudRampPosition(1, [-1, 3])).toBe(0.5)
    expect(pointCloudRampPosition(10, [-1, 3])).toBe(1)
    expect(pointCloudRampPosition(-10, [-1, 3])).toBe(0)
    expect(pointCloudRampPosition(5, [2, 2])).toBe(1)
    expect(pointCloudRampPosition(NaN, [0, 1])).toBe(0)
  })

  it("packs x, y, z and the ramp position into one buffer, leaving out NaN points", () => {
    const { data, count } = packPointCloud(pts, "height", undefined, [-1, 3])
    expect(count).toBe(3)
    expect([...data]).toEqual([0, 0, -1, 0, 0, 0, 3, 1, 0, 0, 1, 0.5])
    expect([...packPointCloud(pts, "none").data].filter((_, i) => i % 4 === 3)).toEqual([0, 0, 0])
  })
})

describe("pointCloudGrid", () => {
  it("lays round steps past the cloud and the origin on the ground", () => {
    const { step, lines } = pointCloudGrid({ min: [2, -3, 0], max: [18, 3, 4], count: 1 })
    expect(step).toBe(1)
    const xs = [...lines].filter((_, i) => i % 3 === 0)
    const zs = [...lines].filter((_, i) => i % 3 === 2)
    expect(Math.min(...xs)).toBeLessThanOrEqual(-1)
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(19)
    expect(new Set(zs)).toEqual(new Set([0]))
  })

  it("never draws more than about two dozen lines a side", () => {
    const { lines } = pointCloudGrid({ min: [-400, -10, 0], max: [400, 10, 1], count: 1 })
    expect(lines.length / 6).toBeLessThan(60)
  })
})

describe("PointCloud without WebGL2", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  })
  const pts = cloud(0, -1, 0, 4, 1, 2)

  it("says so in words, and still gives the count and extent to screen readers, in the description", () => {
    const { container } = render(<PointCloud label="Front lidar" points={pts} robot />)
    expect(container.querySelector("[data-slot=point-cloud]")!.getAttribute("data-state")).toBe("no-webgl")
    expect(screen.getByText(defaultPointCloudLabels.noWebGL)).toBeTruthy()
    const img = screen.getByRole("img")
    expect(img.getAttribute("aria-label")).toBe("Front lidar, 3D point cloud")
    expect(description(img)).toBe(
      "This browser cannot draw the 3D view. 2 points. x 0.0 to 4.0 m forward, y -1.0 to 1.0 m left, z 0.0 to 2.0 m up. The robot is at the origin, facing x",
    )
  })

  it("has nothing to Tab to and nothing to press", () => {
    render(<PointCloud label="Front lidar" points={pts} />)
    expect(screen.getByRole("img").getAttribute("tabindex")).toBeNull()
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("speaks the app's language through labels", () => {
    render(
      <PointCloud
        label="Lidar avant"
        points={pts}
        labels={{ noWebGL: "Ce navigateur ne peut pas afficher la 3D.", count: (n) => `${n} points`, bounds: () => "étendue" }}
      />,
    )
    expect(screen.getByText("Ce navigateur ne peut pas afficher la 3D.")).toBeTruthy()
    expect(description(screen.getByRole("img"))).toContain("2 points. étendue")
  })
})

describe("PointCloud states", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  })

  it("loading says so and keeps the view", () => {
    const { container } = render(<PointCloud label="Front lidar" points={cloud()} loading />)
    expect(container.querySelector("[data-slot=point-cloud]")!.getAttribute("data-state")).toBe("loading")
    expect(screen.getByRole("status").textContent).toBe(defaultPointCloudLabels.loading)
  })

  it("empty says No points", () => {
    withWebGL()
    const { container } = render(<PointCloud label="Front lidar" points={cloud(NaN, NaN, NaN)} />)
    expect(container.querySelector("[data-slot=point-cloud]")!.getAttribute("data-state")).toBe("empty")
    expect(screen.getAllByText("No points").length).toBeGreaterThan(0)
  })

  it("an error says what failed and offers to try again", () => {
    const onRetry = vi.fn()
    render(<PointCloud label="Front lidar" points={cloud()} error onRetry={onRetry} />)
    expect(screen.getByRole("alert").textContent).toContain(defaultPointCloudLabels.error)
    fireEvent.click(screen.getByRole("button", { name: defaultPointCloudLabels.retry }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("goes stale after staleAfterMs without a new cloud, with when the last one arrived, and a new cloud clears it", () => {
    const at = new Date(2026, 10, 21, 14, 2, 31).getTime()
    vi.useFakeTimers({ now: at + 500, toFake: ["setTimeout", "clearTimeout", "Date"] })
    const { container, rerender } = render(<PointCloud label="Front lidar" points={cloud(1, 1, 1)} staleAfterMs={2000} receivedAt={at} />)
    const root = container.querySelector("[data-slot=point-cloud]")!
    expect(root.hasAttribute("data-stale")).toBe(false)
    act(() => void vi.advanceTimersByTime(1600))
    expect(root.hasAttribute("data-stale")).toBe(true)
    expect(screen.getByRole("status").textContent).toBe("Stale, last scan 14:02:31")
    rerender(<PointCloud label="Front lidar" points={cloud(1, 1, 1)} staleAfterMs={2000} receivedAt={at + 3000} />)
    expect(root.hasAttribute("data-stale")).toBe(false)
  })
})

/** A WebGL2 stand-in: every method answers with something truthy, so the component believes it can draw. */
function fakeGl() {
  const fn = () => ({})
  return new Proxy({} as Record<string, unknown>, {
    get: (_, prop) => (prop === "isContextLost" ? () => false : prop === "getParameter" ? () => null : typeof prop === "string" && /^[A-Z_0-9]+$/.test(prop) ? 1 : fn),
  })
}

/** WebGL2 through the stand-in; any other context (the 2D one the theme's colours are read through) is not there. */
function withWebGL() {
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(((type: string) => (type === "webgl2" ? fakeGl() : null)) as never)
}

describe("PointCloud with WebGL2", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    withWebGL()
  })
  const pts = cloud(0, 0, 0, 4, 2, 1)

  it("is one Tab stop for the view, then Reset view and Fit, 44 px each", () => {
    render(<PointCloud label="Front lidar" points={pts} />)
    const img = screen.getByRole("img")
    expect(img.getAttribute("tabindex")).toBe("0")
    expect(img.getAttribute("aria-describedby")).toBeTruthy()
    for (const name of [defaultPointCloudLabels.resetView, defaultPointCloudLabels.fit])
      expect(screen.getByRole("button", { name }).className).toContain("size-(--h-md)")
  })

  it("takes the arrows, + − and 0 on the view, and lets every other key through", () => {
    render(<PointCloud label="Front lidar" points={pts} />)
    const img = screen.getByRole("img")
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "0"]) expect(fireEvent.keyDown(img, { key })).toBe(false)
    expect(fireEvent.keyDown(img, { key: "ArrowLeft", shiftKey: true })).toBe(false)
    expect(fireEvent.keyDown(img, { key: "Tab" })).toBe(true)
    expect(fireEvent.keyDown(img, { key: "a" })).toBe(true)
    // With a modifier the browser's own shortcut wins (Ctrl + minus zooms the page).
    expect(fireEvent.keyDown(img, { key: "-", ctrlKey: true })).toBe(true)
  })

  it("draws the axes gizmo in words, and the footer with the count and the colour scale's ends", () => {
    const { container } = render(<PointCloud label="Front lidar" points={pts} colorBy="height" />)
    const gizmo = container.querySelector("[data-slot=point-cloud-axes]")!
    expect(gizmo.textContent).toBe("x forwardy leftz up")
    const footer = container.querySelector("[data-slot=point-cloud-footer]")!.textContent
    expect(footer).toContain("2 points")
    expect(footer).toContain("Height")
    expect(footer).toContain("0.0 m")
    expect(footer).toContain("1.0 m")
  })

  it("colours by intensity when it is given, and falls back to height when it is asked for without the array", () => {
    const { container, rerender } = render(<PointCloud label="Front lidar" points={pts} intensity={new Float32Array([5, 80])} />)
    const scale = () => container.querySelector("[data-slot=point-cloud-scale]")!.textContent
    expect(scale()).toContain("Intensity")
    expect(scale()).toContain("80")
    rerender(<PointCloud label="Front lidar" points={pts} colorBy="intensity" />)
    expect(scale()).toContain("Height")
  })

  it("leaves the wheel to the page until the view has focus", () => {
    render(<PointCloud label="Front lidar" points={pts} />)
    const img = screen.getByRole("img")
    // This DOM's WheelEvent drops ctrlKey from its init, so it is set on the event itself.
    const wheel = (ctrlKey = false) => {
      const e = new WheelEvent("wheel", { deltaY: 100, cancelable: true, bubbles: true })
      Object.defineProperty(e, "ctrlKey", { value: ctrlKey })
      return img.dispatchEvent(e)
    }
    expect(wheel()).toBe(true)
    expect(wheel(true)).toBe(false)
    act(() => img.focus())
    expect(wheel()).toBe(false)
  })
})

/**
 * A WebGL2 stand-in that records each call by name, with constants as their own names (so DYNAMIC_DRAW and STATIC_DRAW
 * tell apart), and a 2D context for the theme's colours, so the view has a palette and really draws.
 */
function recordingGl(options: { failLinkAfter?: number } = {}) {
  const calls: { name: string; args: unknown[] }[] = []
  let links = 0
  const gl = new Proxy({} as Record<string, unknown>, {
    get: (_, prop) => {
      if (typeof prop !== "string") return undefined
      if (/^[A-Z_0-9]+$/.test(prop)) return prop
      return (...args: unknown[]) => {
        calls.push({ name: prop, args })
        if (prop === "isContextLost") return false
        if (prop === "getParameter") return null
        if (prop === "getProgramParameter") return options.failLinkAfter === undefined || ++links <= options.failLinkAfter
        if (prop === "getSyncParameter") return "SIGNALED"
        return {}
      }
    },
  })
  const paint = {
    fillStyle: "",
    clearRect: () => {},
    fillRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray([40, 80, 120, 255]) }),
  }
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) => (type === "webgl2" ? gl : type === "2d" ? paint : null)) as never)
  const count = (name: string, arg?: unknown) => calls.filter((c) => c.name === name && (arg === undefined || c.args.includes(arg))).length
  return { calls, count, reset: () => void (calls.length = 0) }
}

/** Runs the frames the view asked for (requestAnimationFrame is faked, with the timers). */
const nextFrame = () => act(() => void vi.advanceTimersByTime(20))

describe("PointCloud: what a live view costs", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  const pts = cloud(0, 0, 0, 4, 2, 1)

  it("packs and uploads the cloud once, though an inline colorRange is a new array on every render", () => {
    const gl = recordingGl()
    const { rerender } = render(<PointCloud label="Front lidar" points={pts} colorRange={[0, 3]} />)
    const uploads = gl.count("bufferData") + gl.count("bufferSubData")
    expect(uploads).toBeGreaterThan(0)
    for (let i = 0; i < 3; i++) rerender(<PointCloud label="Front lidar" points={pts} colorRange={[0, 3]} />)
    expect(gl.count("bufferData") + gl.count("bufferSubData")).toBe(uploads)
    // A different range is a different colouring: that one is uploaded.
    rerender(<PointCloud label="Front lidar" points={pts} colorRange={[0, 4]} />)
    expect(gl.count("bufferData") + gl.count("bufferSubData")).toBeGreaterThan(uploads)
  })

  it("keeps the points in a dynamic buffer and writes a scan of the same size into it, without a new buffer", () => {
    const gl = recordingGl()
    const { rerender } = render(<PointCloud label="Front lidar" points={pts} />)
    expect(gl.count("bufferData", "DYNAMIC_DRAW")).toBe(1)
    rerender(<PointCloud label="Front lidar" points={cloud(1, 1, 1, 5, 3, 2)} />)
    expect(gl.count("bufferData", "DYNAMIC_DRAW")).toBe(1)
    expect(gl.count("bufferSubData")).toBe(1)
    // A bigger scan needs a bigger buffer.
    rerender(<PointCloud label="Front lidar" points={cloud(1, 1, 1, 5, 3, 2, 6, 6, 6)} />)
    expect(gl.count("bufferData", "DYNAMIC_DRAW")).toBe(2)
  })

  it("packs into the array it is given when it is large enough", () => {
    const into = new Float32Array(16)
    const packed = packPointCloud(cloud(0, 0, 0, NaN, 0, 0, 1, 1, 1), "height", undefined, [0, 1], into)
    expect(packed.data.buffer).toBe(into.buffer)
    expect(packed.count).toBe(2)
    expect([...packed.data]).toEqual([0, 0, 0, 0, 1, 1, 1, 1])
    // Too small: a new array, and the one given is left alone.
    const small = new Float32Array(4)
    expect(packPointCloud(cloud(0, 0, 0, 1, 1, 1), "height", undefined, null, small).data.buffer).not.toBe(small.buffer)
  })

  it("draws in the same task as a resize, so the cleared buffer is never shown", () => {
    let onResize: () => void = () => {}
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          onResize = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    const gl = recordingGl()
    const { container } = render(<PointCloud label="Front lidar" points={pts} />)
    nextFrame()
    const canvas = container.querySelector("canvas")!
    Object.defineProperty(canvas, "clientWidth", { configurable: true, value: 640 })
    Object.defineProperty(canvas, "clientHeight", { configurable: true, value: 360 })
    gl.reset()
    act(() => onResize())
    expect(canvas.width).toBeGreaterThanOrEqual(640)
    expect(gl.count("clear")).toBe(1)
    expect(gl.count("drawArrays")).toBeGreaterThan(0)
    vi.unstubAllGlobals()
  })

  it("frees the first shader program when the second fails to link", () => {
    const gl = recordingGl({ failLinkAfter: 1 })
    const { container } = render(<PointCloud label="Front lidar" points={pts} />)
    expect(container.querySelector("[data-slot=point-cloud]")!.getAttribute("data-state")).toBe("no-webgl")
    // One for the program that failed, one for the program that linked before it.
    expect(gl.count("deleteProgram")).toBe(2)
  })
})

describe("PointCloud: pointer, wheel and forced colours", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  const pts = cloud(0, 0, 0, 4, 2, 1)
  const gizmo = (container: HTMLElement) => [...container.querySelectorAll("[data-slot=point-cloud-axes] line")].map((l) => l.getAttribute("x2")).join()

  it("ends the drag when the pointer capture is lost, so moving over the view afterwards does not turn it", () => {
    recordingGl()
    const { container } = render(<PointCloud label="Front lidar" points={pts} />)
    nextFrame()
    const img = screen.getByRole("img")
    const before = gizmo(container)
    fireEvent.pointerDown(img, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 100, clientY: 100 })
    fireEvent.lostPointerCapture(img, { pointerId: 1 })
    fireEvent.pointerMove(img, { pointerId: 1, pointerType: "mouse", clientX: 220, clientY: 100 })
    nextFrame()
    expect(gizmo(container)).toBe(before)
    // The same drag with the capture kept does turn it: the check above is not vacuous.
    fireEvent.pointerDown(img, { pointerId: 2, pointerType: "mouse", button: 0, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(img, { pointerId: 2, pointerType: "mouse", clientX: 220, clientY: 100 })
    nextFrame()
    expect(gizmo(container)).not.toBe(before)
  })

  it("keeps the middle button's press from starting the browser's autoscroll", () => {
    recordingGl()
    render(<PointCloud label="Front lidar" points={pts} />)
    const img = screen.getByRole("img")
    expect(fireEvent.pointerDown(img, { pointerId: 1, pointerType: "mouse", button: 1 })).toBe(false)
    expect(fireEvent.pointerDown(img, { pointerId: 2, pointerType: "mouse", button: 0 })).toBe(true)
  })

  it("zooms as far for a wheel that scrolls by lines or pages as for one that scrolls by pixels", () => {
    expect(pointCloudWheelZoom(100, 0, 400)).toBeCloseTo(Math.exp(-0.2))
    expect(pointCloudWheelZoom(3, 1, 400)).toBeCloseTo(Math.exp(-3 * 16 * 0.002))
    expect(pointCloudWheelZoom(1, 2, 400)).toBeCloseTo(Math.exp(-400 * 0.002))
    expect(pointCloudWheelZoom(-1, 2, 400)).toBeGreaterThan(1)
  })

  it("draws in system colours under forced colours, and reads the colours again when forced colours turn on or off", () => {
    const forced = pointCloudPaletteSources("height", true)
    expect(forced.background).toBe("Canvas")
    expect(new Set(forced.ramp)).toEqual(new Set(["CanvasText"]))
    expect(forced.grid).not.toBe(forced.background)
    const themed = pointCloudPaletteSources("height")
    expect(themed.ramp[0]).toContain("var(--chart-1) 20.00%")
    expect(themed.ramp.at(-1)).toContain("var(--chart-1) 100.00%")
    expect(new Set(pointCloudPaletteSources("none").ramp)).toEqual(new Set(["var(--map-point)"]))

    const listened: string[] = []
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener: () => listened.push(q), removeEventListener: () => {} }))
    recordingGl()
    render(<PointCloud label="Front lidar" points={pts} />)
    expect(listened).toContain("(forced-colors: active)")
    vi.unstubAllGlobals()
  })
})

describe("PointCloud: what a screen reader hears while scans arrive", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("keeps the name the same, and changes the count in the description at most every few seconds", () => {
    recordingGl()
    const scan = (n: number) => new Float32Array(Array.from({ length: n * 3 }, (_, i) => i % 5))
    const { rerender } = render(<PointCloud label="Front lidar" points={scan(10)} />)
    const img = screen.getByRole("img")
    expect(img.getAttribute("aria-label")).toBe("Front lidar, 3D point cloud")
    expect(description(img)).toContain("10 points")
    // Scans at 10 Hz for half a second: the name never changes; the description takes the first and then holds.
    for (let i = 11; i < 16; i++) {
      rerender(<PointCloud label="Front lidar" points={scan(i)} />)
      act(() => void vi.advanceTimersByTime(100))
      expect(img.getAttribute("aria-label")).toBe("Front lidar, 3D point cloud")
    }
    expect(description(img)).toContain("11 points")
    act(() => void vi.advanceTimersByTime(5000))
    expect(description(img)).toContain("15 points")
    // The key instructions are in the description too, once the view can be used.
    expect(description(img)).toContain(defaultPointCloudLabels.keys)
  })
})
