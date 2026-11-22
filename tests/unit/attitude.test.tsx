import * as React from "react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { attitudeIndicatorLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import {
  AttitudeIndicator,
  Gauge,
  compassPoint,
  formatReading,
  normalizeHeading,
  type AttitudeHandle,
  type AttitudeLimits,
  type GaugeHandle,
} from "@/registry/syncrobotic/ui/attitude"
import { Meter } from "@/registry/syncrobotic/ui/meter"

// The instruments draw on animation frames and write their numbers from a timer, so the clock, the frames and the timers
// are faked together and run forward by hand.
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const limits: AttitudeLimits = { roll: { warning: 25, critical: 35 }, pitch: { warning: 20, critical: 30 } }
const root = () => document.querySelector<HTMLElement>("[data-slot=attitude]")!
const instrument = () => screen.getByRole("img")
const readout = (slot: string) => document.querySelector<HTMLElement>(`[data-slot=attitude-${slot}]`)!
const horizon = () => document.querySelector<SVGGElement>("[data-slot=attitude-roll-layer]")!
const announcer = () => document.querySelector("[data-slot=attitude-announcer]")!.textContent

describe("numbers", () => {
  it("writes degrees without −0, with a true minus, and in a locale", () => {
    expect(formatReading(-0.4)).toBe("0")
    expect(formatReading(-12.6)).toBe("−13")
    expect(formatReading(1234.5, 1)).toBe("1234.5")
    expect(formatReading(1.25, 2, "de")).toBe("1,25")
  })

  it("keeps a heading in 0–359 and names its compass point", () => {
    expect(normalizeHeading(-89)).toBe(271)
    expect(normalizeHeading(359.7)).toBe(0)
    expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"][compassPoint(271)]).toBe("W")
    expect(compassPoint(22)).toBe(0)
    expect(compassPoint(23)).toBe(1)
  })
})

describe("AttitudeIndicator", () => {
  it("says every value in words, the direction included", () => {
    render(<AttitudeIndicator label="Attitude" roll={-12} pitch={3} heading={271} limits={limits} />)
    expect(instrument()!.getAttribute("aria-label")).toBe("Roll 12° left, pitch 3° nose down, heading 271° W")
    expect(readout("roll").textContent).toBe("12°left")
    expect(readout("pitch").textContent).toBe("3°nose down")
    expect(readout("heading").textContent).toBe("271°W")
    expect(screen.getByRole("group", { name: "Attitude" })).toBe(root())
    expect(root().dataset.tone).toBe("normal")
  })

  it("turns an axis warning, then danger, only past its limit, with a word", () => {
    const { rerender } = render(<AttitudeIndicator label="Attitude" roll={24} pitch={-4} limits={limits} />)
    expect(readout("roll").dataset.tone).toBe("normal")
    expect(document.querySelectorAll("[data-slot=attitude-limit-mark][data-on]")).toHaveLength(0)
    rerender(<AttitudeIndicator label="Attitude" roll={25} pitch={-4} limits={limits} />)
    expect(readout("roll").dataset.tone).toBe("warning")
    expect(readout("roll").textContent).toContain("Over limit")
    expect(readout("pitch").dataset.tone).toBe("normal")
    expect(instrument().getAttribute("aria-label")).toBe("Roll 25° right, over limit, pitch 4° nose up")
    // The two roll warning triangles light up; the critical squares do not.
    expect(document.querySelectorAll("[data-slot=attitude-roll-scale] [data-slot=attitude-limit-mark][data-on]")).toHaveLength(2)
    rerender(<AttitudeIndicator label="Attitude" roll={-36} pitch={-4} limits={limits} />)
    expect(readout("roll").dataset.tone).toBe("danger")
    expect(readout("roll").textContent).toContain("Critical")
    expect(root().dataset.tone).toBe("danger")
    expect(document.querySelectorAll("[data-slot=attitude-roll-scale] [data-slot=attitude-limit-mark][data-on]")).toHaveLength(4)
  })

  it("leaves the compass off and the heading row out without a heading", () => {
    render(<AttitudeIndicator label="Attitude" roll={1} pitch={2} />)
    expect(document.querySelector("[data-slot=attitude-compass]")!.getAttribute("visibility")).toBe("hidden")
    expect(document.querySelector("[data-slot=attitude-heading]")).toBeNull()
  })

  it("draws pushed readings on the next frame without rendering React, and writes the numbers four times a second", () => {
    const handle = React.createRef<AttitudeHandle>()
    let renders = 0
    render(
      <React.Profiler id="a" onRender={() => renders++}>
        <AttitudeIndicator ref={handle} label="Attitude" limits={limits} />
      </React.Profiler>,
    )
    act(() => handle.current!.push({ roll: 5, pitch: 1, heading: 90 }))
    run(300)
    const before = renders
    // 50 Hz for 200 ms: ten readings, each drawn, the numbers written once at most.
    for (let i = 1; i <= 10; i++) {
      act(() => handle.current!.push({ roll: 5 + i, pitch: 1 }))
      run(20)
    }
    expect(horizon().getAttribute("transform")).toBe("rotate(-15)")
    expect(renders - before).toBeLessThanOrEqual(1)
    run(300)
    expect(readout("roll").textContent).toBe("15°right")
    expect(readout("heading").textContent).toBe("90°E")
  })

  it("writes a crossing at once, without waiting for the next quarter second", () => {
    const handle = React.createRef<AttitudeHandle>()
    render(<AttitudeIndicator ref={handle} label="Attitude" roll={10} pitch={0} limits={limits} />)
    run(300)
    act(() => handle.current!.push({ roll: 11 }))
    run(20)
    act(() => handle.current!.push({ roll: 30 }))
    run(20)
    expect(readout("roll").dataset.tone).toBe("warning")
  })

  it("announces a crossing politely, not what is already past when data arrives, and at most every 5 s", () => {
    const handle = React.createRef<AttitudeHandle>()
    render(<AttitudeIndicator ref={handle} label="Attitude" limits={limits} />)
    act(() => handle.current!.push({ roll: 28, pitch: 0 }))
    run(300)
    expect(announcer()).toBe("")
    act(() => handle.current!.push({ roll: 10 }))
    run(300)
    expect(announcer()).toBe("Roll and pitch within limits")
    act(() => handle.current!.push({ roll: 27 }))
    run(300)
    // Within 5 s of the last: held back.
    expect(announcer()).toBe("Roll and pitch within limits")
    run(5000)
    act(() => handle.current!.push({ roll: 27.2 }))
    run(300)
    expect(announcer()).toBe("Roll 27° right, over limit")
    // A step up to critical is said at once.
    act(() => handle.current!.push({ roll: -40 }))
    run(300)
    expect(announcer()).toBe("Roll 40° left, critical")
  })

  it("goes stale after staleAfterMs with the last update's time, and live again on a reading", () => {
    const handle = React.createRef<AttitudeHandle>()
    render(<AttitudeIndicator ref={handle} label="Attitude" staleAfterMs={500} />)
    expect(root().dataset.state).toBe("waiting")
    act(() => handle.current!.push({ roll: 3, pitch: 1 }, new Date(2026, 10, 21, 14, 2, 3).getTime()))
    run(300)
    expect(root().dataset.state).toBe("live")
    run(600)
    expect(root().dataset.state).toBe("stale")
    expect(screen.getByRole("status").textContent).toBe("Stale, last update 14:02:03")
    act(() => handle.current!.push({ roll: 4 }))
    run(300)
    expect(root().dataset.state).toBe("live")
    act(() => handle.current!.clear())
    run(300)
    expect(root().dataset.state).toBe("waiting")
  })

  it("steps the drawing with the numbers under reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: q.includes("reduce"), addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList)
    const handle = React.createRef<AttitudeHandle>()
    render(<AttitudeIndicator ref={handle} label="Attitude" />)
    act(() => handle.current!.push({ roll: 1, pitch: 0 }))
    run(300)
    // Drawn with its numbers; the next reading within the quarter second waits for them.
    act(() => handle.current!.push({ roll: 2 }))
    run(20)
    expect(horizon().getAttribute("transform")).toBe("rotate(-2)")
    act(() => handle.current!.push({ roll: 9 }))
    run(20)
    expect(horizon().getAttribute("transform")).toBe("rotate(-2)")
    run(300)
    expect(horizon().getAttribute("transform")).toBe("rotate(-9)")
  })

  it("takes its words from labels", () => {
    render(<AttitudeIndicator label="姿態" roll={27} pitch={3} heading={271} limits={limits} labels={attitudeIndicatorLabels} locale="zh-TW" />)
    expect(instrument()!.getAttribute("aria-label")).toBe("滾轉 向右 27°，超過限制，俯仰 低頭 3°，航向 271°（西）")
    expect(readout("roll").textContent).toBe("27°向右超過限制")
  })
})

describe("Gauge", () => {
  it("is a meter whose aria-valuetext reads as Meter's does", () => {
    const { unmount } = render(<Meter label="Motor" value={73.8} unit="°C" min={20} max={90} low={70} critical={80} higherIsWorse />)
    const meterText = screen.getByRole("meter").getAttribute("aria-valuetext")
    unmount()
    render(<Gauge label="Motor" value={73.8} unit="°C" min={20} max={90} low={70} critical={80} higherIsWorse />)
    const g = screen.getByRole("meter", { name: "Motor" })
    expect(g!.getAttribute("aria-valuetext")).toBe(meterText!)
    expect(g!.getAttribute("aria-valuetext")).toBe("73.8 °C, high")
    expect(g!.getAttribute("aria-valuenow")).toBe("73.8")
    expect(g!.getAttribute("aria-valuemin")).toBe("20")
    expect(g!.getAttribute("aria-valuemax")).toBe("90")
    expect(document.querySelector("[data-slot=gauge-state]")!.textContent).toBe("High")
  })

  it("follows Meter's thresholds: lower is worse by default, critical is danger", () => {
    const { rerender } = render(<Gauge label="Pack" value={47} min={42} max={54} unit="V" low={46} critical={44} />)
    const g = () => document.querySelector<HTMLElement>("[data-slot=gauge]")!
    expect(g().dataset.tone).toBe("normal")
    expect(document.querySelector("[data-slot=gauge-state]")!.textContent).toBe("")
    rerender(<Gauge label="Pack" value={45.2} min={42} max={54} unit="V" low={46} critical={44} />)
    expect(g().dataset.tone).toBe("warning")
    expect(screen.getByRole("meter")!.getAttribute("aria-valuetext")).toBe("45.2 V, low")
    rerender(<Gauge label="Pack" value={43.9} min={42} max={54} unit="V" low={46} critical={44} />)
    expect(g().dataset.tone).toBe("danger")
    expect(document.querySelector("[data-slot=gauge-state]")!.textContent).toBe("Critical")
  })

  it("draws the value's share of the arc, clamped to the range", () => {
    const { rerender } = render(<Gauge label="Speed" value={0.5} max={2} unit="m/s" />)
    const arc = () => document.querySelector("[data-slot=gauge-value]")!
    expect(arc()!.getAttribute("stroke-dasharray")).toBe("25 200")
    rerender(<Gauge label="Speed" value={3} max={2} unit="m/s" />)
    expect(arc()!.getAttribute("stroke-dasharray")).toBe("100 200")
    expect(document.querySelector("[data-slot=gauge-number]")!.textContent).toBe("3.0")
  })

  it("is an image saying it waits until the first reading, then a meter from push", () => {
    const handle = React.createRef<GaugeHandle>()
    render(<Gauge ref={handle} label="Speed" max={2} unit="m/s" digits={2} />)
    expect(screen.getByRole("img", { name: "Speed, Waiting for data" })).toBeTruthy()
    act(() => handle.current!.push(1.234))
    run(300)
    expect(screen.getByRole("meter")!.getAttribute("aria-valuetext")).toBe("1.23 m/s")
    expect(document.querySelector("[data-slot=gauge-value]")!.getAttribute("stroke-dasharray")).toBe("61.7 200")
  })

  it("announces crossing a threshold and coming back, and goes stale", () => {
    const handle = React.createRef<GaugeHandle>()
    render(<Gauge ref={handle} label="Speed" max={2} unit="m/s" low={1.5} critical={1.8} higherIsWorse staleAfterMs={1000} />)
    act(() => handle.current!.push(1))
    run(300)
    act(() => handle.current!.push(1.6))
    run(300)
    const said = () => document.querySelector("[data-slot=gauge-announcer]")!.textContent
    expect(said()).toBe("Speed 1.6 m/s, high")
    run(5000)
    act(() => handle.current!.push(1.2))
    run(300)
    expect(said()).toBe("Speed 1.2 m/s, back to normal")
    run(1500)
    expect(document.querySelector<HTMLElement>("[data-slot=gauge]")!.dataset.state).toBe("stale")
    expect(screen.getByRole("meter")!.getAttribute("aria-valuetext")).toBe("1.2 m/s, stale")
  })
})
