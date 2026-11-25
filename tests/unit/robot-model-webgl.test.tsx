import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { RobotModel, defaultRobotModelLabels } from "@/registry/syncrobotic/ui/robot-model"
import { demoArmPose, demoArmUrdf } from "../../stories/robot-model-arm"

// The DOM here has no GPU. three's renderer is replaced by a stand-in that draws nothing, so the view goes through its
// 3D path: the graphics context's life and the theme's colours, which the words fallback never reaches.
vi.mock("three", async (importOriginal) => {
  const three = await importOriginal<typeof import("three")>()
  class WebGLRenderer {
    constructor(public options: { canvas: HTMLCanvasElement }) {}
    setPixelRatio() {}
    setClearColor() {}
    setSize() {}
    render() {}
    dispose() {}
  }
  return { ...three, WebGLRenderer }
})

/**
 * The 2D context the theme's colours are read through. Like a browser's, it ignores a colour it cannot parse (here,
 * anything but rgb(), hex, black and white) and keeps the last one; each fill is recorded with the colour it used.
 */
const fills: string[] = []
const swatch = {
  style: "#000000",
  get fillStyle() {
    return this.style
  },
  set fillStyle(v: string) {
    if (/^(#|rgb|black$|white$)/.test(v)) this.style = v
  },
  clearRect() {},
  fillRect() {
    fills.push(this.style)
  },
  getImageData: () => ({ data: new Uint8ClampedArray([128, 128, 128, 255]) }),
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((type: string) =>
    type === "2d" ? swatch : type === "webgl2" || type === "webgl" ? { getExtension: () => null } : null) as never)
  if (typeof ResizeObserver === "undefined")
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    )
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] })
  fills.length = 0
  swatch.style = "#000000"
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const settle = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(20)
  })
const state = (container: HTMLElement) => container.querySelector("[data-slot=robot-model]")!.getAttribute("data-state")
const loseContext = (container: HTMLElement) =>
  act(() => void container.querySelector("canvas")!.dispatchEvent(new Event("webglcontextlost", { cancelable: true })))

// These arms hold one pose for seconds of fake time while the context is lost and restored: not a live feed, so they
// opt out of going stale (on by default), which would otherwise be the state these tests read.
describe("RobotModel's graphics context", () => {
  it("draws in 3D here, through the stand-in", async () => {
    const { container } = render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} />)
    await settle()
    expect(state(container)).toBe("ready")
    expect(container.querySelector("canvas")).toBeTruthy()
  })

  it("says the view could not be restored when a lost context does not come back, and Load again draws it anew", async () => {
    const onRetry = vi.fn()
    const { container } = render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} onRetry={onRetry} />)
    await settle()
    const first = container.querySelector("canvas")
    await loseContext(container)
    expect(state(container)).toBe("context-lost")
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(state(container)).toBe("error")
    expect(container.querySelector("[data-slot=robot-model-frame]")!.textContent).toContain(defaultRobotModelLabels.contextFailed)
    expect(screen.getByRole("status").textContent).toBe(defaultRobotModelLabels.contextFailed)
    fireEvent.click(screen.getByRole("button", { name: defaultRobotModelLabels.retry }))
    await settle()
    expect(state(container)).toBe("ready")
    // A new canvas, since the old one's context is gone for good; the files were not loaded again by the app.
    expect(container.querySelector("canvas")).not.toBe(first)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it("comes back from a lost context when it is restored in time", async () => {
    const { container } = render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} />)
    await settle()
    await loseContext(container)
    act(() => void container.querySelector("canvas")!.dispatchEvent(new Event("webglcontextrestored")))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })
    expect(state(container)).toBe("ready")
  })

  it("forgets a loss when the view is drawn on a new canvas", async () => {
    const { container, rerender } = render(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} />)
    await settle()
    await loseContext(container)
    expect(state(container)).toBe("context-lost")
    rerender(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} webgl={false} />)
    await settle()
    rerender(<RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} />)
    await settle()
    expect(state(container)).toBe("ready")
  })
})

describe("RobotModel's theme colours", () => {
  // This DOM does not inherit custom properties into computed styles; a browser does. The stand-in reads each variable
  // from the nearest element that sets it, as inheritance would.
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (el: Element) =>
        ({
          getPropertyValue: (name: string) => {
            for (let p: HTMLElement | null = el as HTMLElement; p; p = p.parentElement) {
              const v = p.style?.getPropertyValue(name)
              if (v) return v
            }
            return ""
          },
        }) as CSSStyleDeclaration,
    )
  })

  it("follows a theme set on an element above it, not only on <html>", async () => {
    const { container } = render(
      <div data-testid="panel" style={{ "--muted-foreground": "rgb(1, 2, 3)" } as React.CSSProperties}>
        <RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} />
      </div>,
    )
    await settle()
    const panel = screen.getByTestId("panel")
    fills.length = 0
    await act(async () => {
      panel.setAttribute("style", "--muted-foreground: rgb(9, 9, 9)")
      panel.className = "dark"
      await vi.advanceTimersByTimeAsync(20)
    })
    expect(fills).toContain("rgb(9, 9, 9)")
    expect(state(container)).toBe("ready")
  })

  it("does not paint a part in the previous part's colour when its own colour does not parse", async () => {
    render(
      <div style={{ "--muted-foreground": "not-a-colour", "--map-point": "rgb(1, 2, 3)" } as React.CSSProperties}>
        <RobotModel urdf={demoArmUrdf} joints={demoArmPose} staleAfterMs={null} />
      </div>,
    )
    await settle()
    // --muted-foreground, read first, does not parse: it is skipped, never filled with whatever colour the canvas held.
    expect(fills.length).toBeGreaterThan(0)
    expect(new Set(fills)).toEqual(new Set(["rgb(1, 2, 3)"]))
  })
})
