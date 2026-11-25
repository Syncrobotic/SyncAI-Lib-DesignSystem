import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  StreamBuffer,
  StreamingChart,
  defaultStreamingChartLabels,
  formatStreamingValue,
  pastLimit,
  streamingNiceScale,
  streamingTimeStep,
  type StreamingChartConfig,
  type StreamingChartHandle,
  type StreamingChartPush,
} from "@/registry/syncrobotic/ui/streaming-chart"

// The chart keeps its readings in ring buffers and writes the legend, the status and the screen-reader text from a frame
// loop and a few timers, so the clock, the frames and the timers are faked together and run forward by hand.
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const motors = {
  left: { label: "Left wheel", color: 1, unit: "A" },
  right: { label: "Right wheel", color: 2, unit: "A" },
} satisfies StreamingChartConfig
const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const root = () => document.querySelector<HTMLElement>("[data-slot=streaming-chart]")!
const legendItem = (name: string) => [...document.querySelectorAll("[data-slot=streaming-chart-legend] li")].find((li) => li.textContent?.includes(name))!
const legendValue = (name: string) => legendItem(name).querySelector("[data-slot=streaming-chart-value]")!.textContent
const pauseButton = () => document.querySelector<HTMLElement>("[data-slot=streaming-chart-pause]")!

function Chart(props: Partial<React.ComponentProps<typeof StreamingChart>> & { handle?: React.RefObject<StreamingChartHandle | null> }) {
  const { handle, ...rest } = props
  return <StreamingChart config={motors} label="Motor currents" ref={handle} {...rest} />
}

describe("StreamBuffer", () => {
  it("keeps the newest readings, overwriting the oldest past its capacity", () => {
    const b = new StreamBuffer(3)
    for (let i = 0; i < 5; i++) b.push(i * 10, i)
    expect(b.size).toBe(3)
    expect([b.time(0), b.time(1), b.time(2)]).toEqual([20, 30, 40])
    expect([b.value(0), b.value(1), b.value(2)]).toEqual([2, 3, 4])
  })

  it("drops a reading older than the newest, and one without a time", () => {
    const b = new StreamBuffer(8)
    expect(b.push(100, 1)).toBe(true)
    expect(b.push(90, 2)).toBe(false)
    expect(b.push(Number.NaN, 2)).toBe(false)
    expect(b.push(100, 3)).toBe(true)
    expect(b.size).toBe(2)
  })

  it("stores a missing value as a gap (NaN)", () => {
    const b = new StreamBuffer(4)
    b.push(1, Number.POSITIVE_INFINITY)
    expect(Number.isNaN(b.value(0))).toBe(true)
  })

  it("finds readings by time across the wrap", () => {
    const b = new StreamBuffer(4)
    for (let i = 0; i < 6; i++) b.push(i * 10, i)
    // Holds 20, 30, 40, 50.
    expect(b.lowerBound(25)).toBe(1)
    expect(b.lowerBound(20)).toBe(0)
    expect(b.lowerBound(99)).toBe(4)
    expect(b.lastAtOrBefore(45)).toBe(2)
    expect(b.lastAtOrBefore(10)).toBe(-1)
    b.clear()
    expect(b.size).toBe(0)
  })
})

describe("axes and numbers", () => {
  it("picks a round time step that fits the room", () => {
    expect(streamingTimeStep(30_000, 6)).toBe(5_000)
    expect(streamingTimeStep(30_000, 3)).toBe(10_000)
    expect(streamingTimeStep(120_000, 6)).toBe(30_000)
    expect(streamingTimeStep(600_000, 6)).toBe(120_000)
  })

  it("rounds the value range to 1, 2, 2.5 or 5 steps", () => {
    expect(streamingNiceScale(0.3, 9.7, 4)).toEqual({ min: 0, max: 10, step: 2.5, ticks: [0, 2.5, 5, 7.5, 10] })
    expect(streamingNiceScale(44.1, 47.9, 4).step).toBe(1)
    // One flat value still gets a range around it.
    const flat = streamingNiceScale(12, 12)
    expect(flat.min).toBeLessThan(12)
    expect(flat.max).toBeGreaterThan(12)
  })

  it("writes numbers with a true minus sign, never −0.0, and in the given locale", () => {
    expect(formatStreamingValue(-1.26, 1)).toBe("\u22121.3")
    expect(formatStreamingValue(-0.04, 1)).toBe("0.0")
    expect(formatStreamingValue(1234.5, 1, "de")).toBe("1.234,5")
    expect(formatStreamingValue(1234.5, 1, "not a tag")).toBe("1,234.5")
  })

  it("tells which side of a limit is past it", () => {
    expect(pastLimit(61, { value: 60 })).toBe(true)
    expect(pastLimit(60, { value: 60 })).toBe(false)
    expect(pastLimit(44, { value: 45, over: "below" })).toBe(true)
    expect(pastLimit(Number.NaN, { value: 45, over: "below" })).toBe(false)
  })

  it("names windows in words", () => {
    expect(defaultStreamingChartLabels.windowOption(30_000)).toBe("30 s")
    expect(defaultStreamingChartLabels.windowOption(120_000)).toBe("2 min")
    expect(defaultStreamingChartLabels.windowOption(600_000)).toBe("10 min")
  })
})

describe("StreamingChart", () => {
  it("waits for data, then shows each series' value now from push", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} />)
    expect(root().dataset.state).toBe("waiting")
    act(() => handle.current!.push({ left: 12.44, right: 9 }))
    run(300)
    expect(root().dataset.state).toBe("live")
    expect(legendValue("Left wheel")).toBe("12.4 A")
    expect(legendValue("Right wheel")).toBe("9.0 A")
  })

  it("does not render React for a reading", () => {
    const handle = React.createRef<StreamingChartHandle>()
    let renders = 0
    function Counted() {
      renders++
      return <Chart handle={handle} />
    }
    render(<Counted />)
    act(() => handle.current!.push({ left: 1 }))
    run(300)
    const before = renders
    for (let i = 0; i < 200; i++) act(() => handle.current!.push({ left: i, right: i / 2 }))
    run(1000)
    expect(renders).toBe(before)
    expect(legendValue("Left wheel")).toBe("199.0 A")
  })

  it("gives the same push to subscribe and the handle, connects once and disconnects on unmount", () => {
    const handle = React.createRef<StreamingChartHandle>()
    const stop = vi.fn()
    const pushes: StreamingChartPush[] = []
    const subscribe = (push: StreamingChartPush) => {
      pushes.push(push)
      push({ left: 3 })
      return stop
    }
    const { rerender, unmount } = render(<Chart handle={handle} subscribe={subscribe} />)
    rerender(<Chart handle={handle} subscribe={subscribe} className="w-full" />)
    expect(pushes).toHaveLength(1)
    expect(pushes[0]).toBe(handle.current!.push)
    run(300)
    expect(legendValue("Left wheel")).toBe("3.0 A")
    unmount()
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it("pauses the view while readings keep buffering, and resumes at the live edge", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} />)
    act(() => handle.current!.push({ left: 5, right: 5 }))
    run(300)
    fireEvent.click(pauseButton())
    expect(root().dataset.state).toBe("paused")
    expect(pauseButton().textContent).toBe("Resume")
    expect(screen.getByRole("status").textContent).toMatch(/^Paused \d\d:\d\d:\d\d$/)
    run(50)
    act(() => handle.current!.push({ left: 7, right: 7 }))
    run(600)
    // The frozen view shows the reading at its right edge, not the one that arrived after the pause.
    expect(legendValue("Left wheel")).toBe("5.0 A")
    fireEvent.click(pauseButton())
    run(300)
    expect(root().dataset.state).toBe("live")
    expect(legendValue("Left wheel")).toBe("7.0 A")
  })

  it("moves through time from the keyboard: arrows pause and step back, End jumps to live", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} />)
    for (let i = 0; i < 40; i++) {
      act(() => handle.current!.push({ left: i }))
      run(1000)
    }
    const plot = screen.getByRole("figure", { name: "Motor currents" })
    fireEvent.keyDown(plot, { key: "ArrowLeft" })
    expect(root().dataset.state).toBe("paused")
    expect(pauseButton().textContent).toBe("Jump to live")
    run(300)
    // A tenth of the 30 s window back from the edge (40 s): the reading taken at 37 s.
    expect(legendValue("Left wheel")).toBe("37.0 A")
    fireEvent.keyDown(plot, { key: "End" })
    run(300)
    expect(root().dataset.state).toBe("live")
    fireEvent.keyDown(plot, { key: " " })
    expect(root().dataset.state).toBe("paused")
    expect(pauseButton().textContent).toBe("Resume")
  })

  it("follows the readings' own clock, so stamps far from this browser's still draw at the edge", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} />)
    const robot = new Date(2020, 0, 1, 9, 30, 0).getTime()
    act(() => handle.current!.push({ left: 2 }, robot))
    run(300)
    act(() => handle.current!.pause())
    expect(screen.getByRole("status").textContent).toBe("Paused 09:30:00")
  })

  it("says No new data with the last reading's time when readings stop", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} staleAfterMs={1000} />)
    act(() => handle.current!.push({ left: 1 }, new Date(2026, 10, 21, 14, 2, 31).getTime()))
    run(500)
    expect(root().dataset.state).toBe("live")
    run(1000)
    expect(root().dataset.state).toBe("stale")
    expect(screen.getByRole("status").textContent).toBe("No new data · last reading 14:02:31")
    act(() => handle.current!.push({ left: 1 }))
    run(300)
    expect(root().dataset.state).toBe("live")
  })

  it("says a series past a limit in words, and tells screen readers once as it crosses", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} limits={[{ value: 16 }]} />)
    act(() => handle.current!.push({ left: 12, right: 10 }))
    run(300)
    const over = () => legendItem("Left wheel").querySelector("[data-slot=streaming-chart-over]")!
    expect(over().hasAttribute("data-over")).toBe(false)
    act(() => handle.current!.push({ left: 17.2, right: 10 }))
    run(300)
    expect(over().hasAttribute("data-over")).toBe(true)
    expect(over().textContent).toBe("Over limit")
    const live = document.querySelector("[aria-live=polite]")!
    expect(live.textContent).toBe("Left wheel 17.2 A, Over limit")
  })

  it("treats a floor as past when below it", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<StreamingChart ref={handle} config={{ pack: { label: "Pack", color: 1, unit: "V" } }} label="Battery" limits={[{ value: 45, over: "below" }]} />)
    act(() => handle.current!.push({ pack: 44.2 }))
    run(300)
    expect(screen.getByText("Under limit")).toBeTruthy()
  })

  it("reads the current values aloud only while focus is on the chart, every few seconds", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} announceEveryMs={2000} />)
    const live = document.querySelector("[aria-live=polite]")!
    act(() => handle.current!.push({ left: 4, right: 3 }))
    run(3000)
    expect(live.textContent).toBe("")
    act(() => screen.getByRole("figure").focus())
    run(2500)
    expect(live.textContent).toBe("Left wheel 4.0 A, Right wheel 3.0 A")
  })

  it("shows the window as a table, a row per tick", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} windows={[30_000]} />)
    for (let i = 0; i < 31; i++) {
      act(() => handle.current!.push({ left: i, right: 1 }))
      run(1000)
    }
    // One window: no window switch.
    expect(screen.queryByRole("group", { name: "Time window" })).toBeNull()
    fireEvent.click(screen.getByRole("radio", { name: "Table" }))
    run(10)
    const rows = screen.getAllByRole("row")
    // The header, then 30 s in 5 s steps: 7 rows, newest first.
    expect(rows).toHaveLength(8)
    expect(rows[1]!.textContent).toContain("30.0")
  })

  // Back from the table the chart gets a new canvas at the browser's 300 × 150: it must be sized to its box again, even
  // though the box did not change (it was drawn stretched and blurred, cut to its top left corner).
  it("sizes the new canvas when it comes back from the table", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(640)
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(256)
    render(<Chart />)
    const canvas = () => document.querySelector("canvas")!
    expect([canvas().width, canvas().height]).not.toEqual([300, 150])
    const sized = [canvas().width, canvas().height]
    fireEvent.click(screen.getByRole("radio", { name: "Table" }))
    run(10)
    fireEvent.click(screen.getByRole("radio", { name: "Chart" }))
    run(10)
    expect([canvas().width, canvas().height]).toEqual(sized)
    vi.restoreAllMocks()
  })

  it("takes every word from labels", () => {
    const handle = React.createRef<StreamingChartHandle>()
    render(<Chart handle={handle} labels={{ pause: "暫停", resume: "繼續", waiting: "等待資料", chart: "圖表", table: "表格" }} />)
    expect(screen.getByText("等待資料")).toBeTruthy()
    expect(pauseButton().textContent).toBe("暫停")
    fireEvent.click(pauseButton())
    expect(pauseButton().textContent).toBe("繼續")
    expect(screen.getByRole("radio", { name: "表格" })).toBeTruthy()
  })

  // Narrow (under 36 rem), the window and Chart / Table switches fold into a menu beside Pause, so the toolbar stays one
  // row. Which one shows is CSS (a container query); both are wired the same, and the menu is checked here.
  it("puts the window and the view in a menu (⋯) for narrow charts, beside Pause", () => {
    const onWindowChange = vi.fn()
    render(<Chart onWindowChange={onWindowChange} />)
    const more = screen.getByRole("button", { name: "View options" })
    expect(more.className).toContain("@xl:hidden")
    expect(document.querySelector("[aria-label=\"Time window\"]")!.className).toContain("@xl:inline-flex")
    fireEvent.keyDown(more, { key: "Enter" })
    expect(screen.getByRole("menuitemradio", { name: "30 s" }).getAttribute("aria-checked")).toBe("true")
    fireEvent.click(screen.getByRole("menuitemradio", { name: "10 min" }))
    expect(onWindowChange).toHaveBeenCalledWith(600_000)
    fireEvent.keyDown(screen.getByRole("button", { name: "View options" }), { key: "Enter" })
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Table" }))
    run(10)
    expect(screen.getAllByRole("row").length).toBeGreaterThan(0)
  })

  it("lets the parent drive the window and the pause", () => {
    const onPausedChange = vi.fn()
    const onWindowChange = vi.fn()
    const { rerender } = render(<Chart paused={false} onPausedChange={onPausedChange} window={30_000} onWindowChange={onWindowChange} />)
    fireEvent.click(pauseButton())
    expect(onPausedChange).toHaveBeenCalledWith(true)
    expect(root().dataset.state).toBe("waiting")
    rerender(<Chart paused onPausedChange={onPausedChange} window={30_000} onWindowChange={onWindowChange} />)
    expect(root().dataset.state).toBe("paused")
    fireEvent.click(screen.getByRole("radio", { name: "2 min" }))
    expect(onWindowChange).toHaveBeenCalledWith(120_000)
  })
})
