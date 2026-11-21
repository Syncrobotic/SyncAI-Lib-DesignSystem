import * as React from "react"
import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { StreamingChart, type StreamingChartHandle, type StreamingChartPush } from "@/registry/syncrobotic/ui/streaming-chart?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own component) and the chart
// imported with ?react-compiler, so these check that once compiled the chart still connects its source once, keeps one
// push for its life, follows a parent that rebuilds its props every render, and pauses and resumes.

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
const value = () => document.querySelector("[data-slot=streaming-chart-legend] [data-slot=streaming-chart-value]")!.textContent
const state = () => document.querySelector<HTMLElement>("[data-slot=streaming-chart]")!.dataset.state

describe("compiled", () => {
  it("connects once and keeps one push while the parent re-renders with new objects", () => {
    const pushes: StreamingChartPush[] = []
    const stop = vi.fn()
    const handle = React.createRef<StreamingChartHandle>()
    function Panel({ n }: { n: number }) {
      // A config, limits and a subscribe built afresh in the body, as product code often writes them.
      const config = { left: { label: `Left ${n}`, color: 1 as const, unit: "A" } }
      const subscribe = (push: StreamingChartPush) => {
        pushes.push(push)
        return stop
      }
      return <StreamingChart ref={handle} config={config} label="Currents" limits={[{ value: 16 }]} subscribe={subscribe} />
    }
    const { rerender } = render(<Panel n={1} />)
    const first = handle.current!.push
    rerender(<Panel n={2} />)
    rerender(<Panel n={2} />)
    expect(handle.current!.push).toBe(first)
    // The compiler memoises the subscribe built from nothing that changes, so the source is connected once.
    expect(pushes).toHaveLength(1)
    expect(pushes[0]).toBe(first)
    expect(document.body.textContent).toContain("Left 2")
    act(() => handle.current!.push({ left: 4.25 }))
    run(300)
    expect(value()).toBe("4.3 A")
  })

  it("pauses and resumes from the button and the handle", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<StreamingChart ref={handle} config={{ v: { label: "Speed", color: 1, unit: "m/s" } }} label="Speed" />)
    act(() => handle.current!.push({ v: 1 }))
    run(300)
    expect(state()).toBe("live")
    fireEvent.click(document.querySelector<HTMLElement>("[data-slot=streaming-chart-pause]")!)
    expect(state()).toBe("paused")
    act(() => handle.current!.resume())
    expect(state()).toBe("live")
    act(() => handle.current!.pause())
    expect(state()).toBe("paused")
  })
})
