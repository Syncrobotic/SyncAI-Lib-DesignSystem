import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { configureFeedback } from "@/registry/syncrobotic/lib/feedback"
import { TeleopPad } from "@/registry/syncrobotic/shell/teleop-pad?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's drive console, which keeps the
// speed limit and the measured speed in state and hands the pad a new inline callback on every render) and teleop-pad
// imported with ?react-compiler. A drive pad that kept an old callback, an old limit, or lost its stop on a re-render
// would move a robot nobody is steering: these check it does not, once compiled.

beforeEach(() => {
  vi.useFakeTimers()
  configureFeedback({ haptics: false, sound: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  configureFeedback({ haptics: true, sound: true })
})

const ZERO = { linear: 0, angular: 0 }
type Cmd = { linear: number; angular: number }

let setLimit: (v: number) => void = () => {}
let setSpeed: (v: number) => void = () => {}

/** A product's console: every render passes new onCommand and onStop arrows, closing over the latest state. */
function Console({ sent, stops }: { sent: { gen: number; cmd: Cmd }[]; stops: string[] }) {
  const [limit, setLimitState] = React.useState(1)
  const [speed, setSpeedState] = React.useState(0)
  const [gen, setGen] = React.useState(0)
  React.useEffect(() => {
    setLimit = (v) => {
      setLimitState(v)
      setGen((g) => g + 1)
    }
    setSpeed = (v) => {
      setSpeedState(v)
      setGen((g) => g + 1)
    }
  }, [])
  return <TeleopPad maxSpeed={limit} speed={speed} onCommand={(cmd) => sent.push({ gen, cmd })} onStop={(reason) => stops.push(`${gen}:${reason}`)} />
}

function setup() {
  const sent: { gen: number; cmd: Cmd }[] = []
  const stops: string[] = []
  const utils = render(<Console sent={sent} stops={stops} />)
  const pad = screen.getByRole("application")
  Object.defineProperty(pad, "clientWidth", { value: 224 })
  Object.defineProperty(pad.querySelector("[aria-hidden].size-\\(--h-stop\\)")!, "offsetWidth", { value: 56 })
  return { sent, stops, pad, ...utils }
}
const T = 84
const press = (pad: HTMLElement) => fireEvent.pointerDown(pad, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 100 })
const move = (pad: HTMLElement, dx: number, dy: number) => fireEvent.pointerMove(pad, { pointerId: 1, pointerType: "touch", clientX: 100 + dx, clientY: 100 + dy })

describe("compiled", () => {
  it("keeps driving through re-renders, with the newest callback and the newest speed limit", () => {
    const { pad, sent } = setup()
    press(pad)
    move(pad, 0, -T)
    act(() => vi.advanceTimersByTime(100))
    expect(sent.at(-1)).toEqual({ gen: 0, cmd: { linear: 1, angular: 0 } })
    // The measured speed arrives ten times a second; each one re-renders the console with a new callback.
    for (let i = 1; i <= 5; i++) {
      act(() => setSpeed(i / 10))
      act(() => vi.advanceTimersByTime(100))
    }
    expect(sent.at(-1)).toEqual({ gen: 5, cmd: { linear: 1, angular: 0 } })
    expect(screen.getByText("· 0.5 m/s", { exact: false })).toBeTruthy()
    // The limit drops while the stick is held: the stick's next move is shaped by the new limit, not one closed over
    // in an earlier render. (As uncompiled: the command is shaped when the stick moves.)
    act(() => setLimit(0.3))
    move(pad, 0, -T - 1)
    act(() => vi.advanceTimersByTime(100))
    expect(sent.at(-1)).toEqual({ gen: 6, cmd: { linear: 0.3, angular: 0 } })
  })

  it("stops on release through the latest onStop, and sends nothing after it", () => {
    const { pad, sent, stops } = setup()
    press(pad)
    move(pad, T, 0)
    act(() => setSpeed(0.2))
    act(() => vi.advanceTimersByTime(100))
    fireEvent.pointerUp(pad, { pointerId: 1 })
    expect(sent.at(-1)!.cmd).toEqual(ZERO)
    expect(stops).toEqual(["1:release"])
    const n = sent.length
    act(() => setSpeed(0))
    act(() => vi.advanceTimersByTime(1000))
    expect(sent).toHaveLength(n)
  })

  it("times out a still pointer and stops when the console goes away", () => {
    const { pad, sent, stops, unmount } = setup()
    press(pad)
    move(pad, 0, -T)
    // No pointer event for the default 2 s: input was lost, the robot stops.
    act(() => vi.advanceTimersByTime(1999))
    expect(stops).toEqual([])
    act(() => vi.advanceTimersByTime(1))
    expect(stops).toEqual(["0:timeout"])
    expect(sent.at(-1)!.cmd).toEqual(ZERO)
    press(pad)
    unmount()
    expect(stops.at(-1)).toBe("0:unmount")
    expect(sent.at(-1)!.cmd).toEqual(ZERO)
  })

  it("drives from the keyboard across re-renders and Space stops", () => {
    const { pad, sent, stops } = setup()
    fireEvent.keyDown(pad, { key: "ArrowUp" })
    act(() => setSpeed(0.4))
    act(() => vi.advanceTimersByTime(100))
    expect(sent.at(-1)).toEqual({ gen: 1, cmd: { linear: 1, angular: 0 } })
    fireEvent.keyDown(pad, { key: " " })
    expect(stops).toEqual(["1:key"])
    expect(sent.at(-1)!.cmd).toEqual(ZERO)
  })
})
