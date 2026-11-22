import * as React from "react"
import { act, cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AttitudeIndicator, Gauge, type AttitudeHandle, type GaugeHandle } from "@/registry/syncrobotic/ui/attitude?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own component) and the
// instruments imported with ?react-compiler, so these check that once compiled they still connect a source once, keep one
// push for their life, follow a parent that rebuilds its props every render, and write what is pushed.

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const readout = (slot: string) => document.querySelector<HTMLElement>(`[data-slot=attitude-${slot}]`)!

describe("compiled", () => {
  it("connects once, keeps one push, and follows limits rebuilt every render", () => {
    const pushes: AttitudeHandle["push"][] = []
    const stop = vi.fn()
    const handle = React.createRef<AttitudeHandle>()
    function Panel({ warning }: { warning: number }) {
      // Limits and a subscribe built afresh in the body, as product code often writes them.
      const subscribe = (push: AttitudeHandle["push"]) => {
        pushes.push(push)
        return stop
      }
      return <AttitudeIndicator ref={handle} label="Attitude" limits={{ roll: { warning } }} subscribe={subscribe} />
    }
    const { rerender } = render(<Panel warning={25} />)
    const first = handle.current!.push
    expect(pushes).toHaveLength(1)
    act(() => pushes[0]!({ roll: 20, pitch: 1 }))
    run(300)
    expect(readout("roll").dataset.tone).toBe("normal")
    rerender(<Panel warning={15} />)
    expect(readout("roll").dataset.tone).toBe("warning")
    rerender(<Panel warning={15} />)
    expect(pushes).toHaveLength(1)
    expect(stop).not.toHaveBeenCalled()
    expect(handle.current!.push).toBe(first)
    // A crossing pushed after the re-render is judged by the new limits.
    act(() => handle.current!.push({ roll: 10 }))
    run(300)
    expect(readout("roll").dataset.tone).toBe("normal")
    expect(readout("roll").textContent).toBe("10°right")
  })

  it("writes a pushed gauge reading and its tone", () => {
    const handle = React.createRef<GaugeHandle>()
    function Panel() {
      return <Gauge ref={handle} label="Motor" min={20} max={90} unit="°C" low={70} critical={80} higherIsWorse />
    }
    render(<Panel />)
    act(() => handle.current!.push(75.25))
    run(300)
    const root = document.querySelector<HTMLElement>("[data-slot=gauge]")!
    expect(root.dataset.tone).toBe("warning")
    expect(document.querySelector("[data-slot=gauge-number]")!.textContent).toBe("75.3")
  })
})
