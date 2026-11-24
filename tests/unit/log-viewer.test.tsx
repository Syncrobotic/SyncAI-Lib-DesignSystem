import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as zh from "@/registry/syncrobotic/lib/labels-zh-tw"
import {
  createLogBuffer,
  filterLog,
  formatLogLine,
  logQuery,
  LogViewer,
  matchLog,
  stepMatch,
  type LogLevel,
  type LogLine,
  type LogViewerHandle,
} from "@/registry/syncrobotic/ui/log-viewer"
import { layOut } from "./log-viewer-layout"

// The ring buffer, the pure filter and search, and the viewer on a laid-out page: levels and sources, search with next and
// previous, following the newest line and pausing, opening and copying a line, the keyboard, and the labels.

const t0 = Date.UTC(2026, 10, 21, 14, 2, 0)
const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"]
const make = (n: number, from = 0): LogLine[] =>
  Array.from({ length: n }, (_, k) => {
    const i = from + k
    return { id: i, time: t0 + i * 100, level: levels[i % 5]!, source: i % 2 ? "/planner" : "/amcl", message: `line ${i}`, file: "node.cpp", line: 10 + i }
  })

let restore: () => void
beforeEach(() => {
  restore = layOut()
})
afterEach(() => {
  cleanup()
  restore()
  vi.useRealTimers()
})

const grid = () => screen.getByRole("treegrid")
const shownLines = () => within(grid()).queryAllByRole("row").filter((r) => r.hasAttribute("data-seq"))
const footer = () => screen.getByText(/^(Following new lines|Paused)$/).parentElement!

describe("createLogBuffer", () => {
  it("keeps the newest maxLines and numbers every line", () => {
    const b = createLogBuffer({ maxLines: 3, flushMs: 0 })
    b.append(make(5))
    const s = b.getSnapshot()
    expect([s.size, s.first, s.next, s.dropped, s.maxLines]).toEqual([3, 2, 5, 2, 3])
    expect(b.get(1)).toBeUndefined()
    expect([b.get(2)?.message, b.get(4)?.message]).toEqual(["line 2", "line 4"])
    // Held lines per level, and every line ever added for the announcements.
    expect(s.counts).toEqual({ debug: 0, info: 0, warn: 1, error: 1, fatal: 1 })
    expect(b.totals()).toEqual({ debug: 1, info: 1, warn: 1, error: 1, fatal: 1 })
  })

  it("commits a burst of appends once, after flushMs", () => {
    vi.useFakeTimers()
    const b = createLogBuffer({ flushMs: 100 })
    const told = vi.fn()
    b.subscribe(told)
    for (let i = 0; i < 50; i++) b.append(make(2, i * 2))
    expect(told).not.toHaveBeenCalled()
    expect(b.getSnapshot().size).toBe(0)
    vi.advanceTimersByTime(100)
    expect(told).toHaveBeenCalledTimes(1)
    expect(b.getSnapshot().size).toBe(100)
  })

  it("shrinks to a new maxLines from the oldest end, and clears", () => {
    const b = createLogBuffer({ maxLines: 10, flushMs: 0, lines: make(8) })
    b.setMaxLines(3)
    expect(b.getSnapshot()).toMatchObject({ size: 3, first: 5, dropped: 5 })
    expect(b.get(5)?.message).toBe("line 5")
    b.clear()
    expect(b.getSnapshot()).toMatchObject({ size: 0, first: 8, next: 8 })
  })

  it("reads an unknown level as info rather than dropping the line", () => {
    const b = createLogBuffer({ flushMs: 0 })
    b.append({ time: t0, level: "trace" as LogLevel, message: "x" })
    expect(b.get(0)?.level).toBe("info")
  })
})

describe("filter and search", () => {
  const b = createLogBuffer({ flushMs: 0, lines: make(10) })
  const all = filterLog(b, b.getSnapshot(), { levels })

  it("filters by level and by source; no sources means all", () => {
    expect(filterLog(b, b.getSnapshot(), { levels: ["error", "fatal"] })).toEqual([3, 4, 8, 9])
    expect(filterLog(b, b.getSnapshot(), { levels: ["error", "fatal"], sources: ["/planner"] })).toEqual([3, 9])
    expect(all).toHaveLength(10)
  })

  it("searches messages and sources as written, ignoring case", () => {
    expect(matchLog(b, all, logQuery("LINE 1"))).toEqual([1])
    expect(matchLog(b, all, logQuery("planner"))).toEqual([1, 3, 5, 7, 9])
    // Regex characters are matched as themselves.
    expect(logQuery("a.b")!.test("axb")).toBe(false)
    expect(logQuery("  ")).toBeNull()
  })

  it("steps through matches and wraps round", () => {
    const m = [2, 5, 9]
    expect(stepMatch(m, 5, 1)).toBe(9)
    expect(stepMatch(m, 9, 1)).toBe(2)
    expect(stepMatch(m, 2, -1)).toBe(9)
    expect(stepMatch(m, Infinity, -1)).toBe(9)
    expect(stepMatch(m, Infinity, 1)).toBe(2)
    expect(stepMatch([], 0, 1)).toBeUndefined()
  })

  it("copies a line as ISO time, level, source, message and where it was written", () => {
    expect(formatLogLine({ time: t0 + 482, level: "error", source: "/planner", message: "No plan", file: "planner.cpp", line: 212, function: "plan" })).toBe(
      "[2026-11-21T14:02:00.482Z] [ERROR] [/planner] No plan (planner.cpp:212 in plan)",
    )
  })
})

// Radix menus and the virtual rows are slow in happy-dom when the whole suite runs in parallel: a longer timeout.
describe("LogViewer", { timeout: 20_000 }, () => {
  it("draws only the lines in view, with each level as a word", () => {
    render(<LogViewer lines={make(5000)} maxLines={5000} timeZone="UTC" />)
    const rows = shownLines()
    expect(rows.length).toBeGreaterThan(5)
    expect(rows.length).toBeLessThan(60)
    expect(grid().getAttribute("aria-rowcount")).toBe("5001")
    // Following: the newest line is drawn, with its row index among all 5,000.
    const last = rows.at(-1)!
    expect(last.textContent).toContain("line 4999")
    expect(last.getAttribute("aria-rowindex")).toBe("5001")
    expect(within(last).getByText("Fatal")).toBeTruthy()
    expect(last.textContent).toContain("14:10:19.900")
  })

  it("caps what it holds at maxLines and says so", () => {
    render(<LogViewer lines={make(50)} maxLines={20} />)
    expect(grid().getAttribute("aria-rowcount")).toBe("21")
    expect(screen.getByText(/20 lines · keeps the last 20/)).toBeTruthy()
  })

  it("filters by level from the levels menu", async () => {
    render(<LogViewer lines={make(20)} />)
    const button = screen.getByRole("button", { name: "Levels: All levels" })
    fireEvent.pointerDown(button, { button: 0, pointerType: "mouse" })
    const debug = await screen.findByRole("menuitemcheckbox", { name: /Debug/ })
    fireEvent.click(debug)
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /Info/ }))
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: /Warn/ }))
    // The menu is modal: the rest of the page is hidden from the accessibility tree until it closes.
    expect(screen.getByRole("button", { name: "Levels: Error, Fatal", hidden: true })).toBeTruthy()
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" })
    expect(grid().getAttribute("aria-rowcount")).toBe("9")
    expect(screen.getByText("8 of 20 lines")).toBeTruthy()
  })

  it("starts from defaultLevels and defaultSources, and offers to show all when nothing matches", () => {
    render(<LogViewer lines={make(20)} defaultLevels={["fatal"]} defaultSources={["/nowhere"]} />)
    expect(screen.getByText("No lines match the filters")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Show all lines" }))
    expect(grid().getAttribute("aria-rowcount")).toBe("21")
  })

  it("marks matches and goes to the next and previous one", () => {
    render(<LogViewer lines={make(30)} />)
    const box = screen.getByRole("searchbox", { name: "Search the log" })
    fireEvent.change(box, { target: { value: "line 2" } })
    // line 2 and line 20 to 29.
    expect(screen.getByText("11 matches")).toBeTruthy()
    expect(document.querySelectorAll("mark").length).toBeGreaterThan(0)
    // While following, next starts from the top and previous from the newest.
    fireEvent.keyDown(box, { key: "Enter" })
    expect(screen.getByText("1 of 11")).toBeTruthy()
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true })
    expect(screen.getByText("11 of 11")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Previous match" }))
    expect(screen.getByText("10 of 11")).toBeTruthy()
    // Going to a match stops following, and the match is the line in focus.
    expect(footer().textContent).toContain("Paused")
    const active = document.querySelector("[data-active]")
    expect(active?.textContent).toContain("line 28")
    expect(active?.querySelector("mark")?.className).toContain("bg-foreground")
  })

  it("follows new lines until the reader scrolls up, then counts them and jumps back", () => {
    vi.useFakeTimers()
    const viewer = React.createRef<LogViewerHandle>()
    render(<LogViewer ref={viewer} lines={make(100)} />)
    expect(footer().textContent).toContain("Following new lines")
    act(() => {
      viewer.current!.append(make(5, 100))
      vi.advanceTimersByTime(100)
    })
    expect(shownLines().at(-1)!.textContent).toContain("line 104")
    // The reader scrolls up: following stops, and new lines are counted instead of scrolled to.
    act(() => {
      grid().scrollTop = 200
      fireEvent.scroll(grid())
    })
    expect(footer().textContent).toContain("Paused")
    act(() => {
      viewer.current!.append(make(12, 105))
      vi.advanceTimersByTime(100)
    })
    const jump = screen.getByRole("button", { name: /12 new · Jump to latest/ })
    // Docked in the footer beside Paused, never floating over the lines.
    expect(footer().contains(jump)).toBe(true)
    expect(grid().contains(jump)).toBe(false)
    act(() => void fireEvent.click(jump))
    expect(footer().textContent).toContain("Following new lines")
  })

  it("appends a lines array that only grew, and replaces one that did not", () => {
    const first = make(10)
    const { rerender } = render(<LogViewer lines={first} />)
    rerender(<LogViewer lines={[...first, ...make(5, 10)]} />)
    expect(grid().getAttribute("aria-rowcount")).toBe("16")
    rerender(<LogViewer lines={make(3, 50)} />)
    expect(grid().getAttribute("aria-rowcount")).toBe("4")
    expect(shownLines()[0]!.textContent).toContain("line 50")
  })

  it("opens a line with the keyboard and selects several to copy", () => {
    render(<LogViewer lines={make(30)} />)
    const g = grid()
    act(() => g.focus())
    // Focus lands on the newest line while following.
    expect(g.getAttribute("aria-activedescendant")).toMatch(/line-29$/)
    fireEvent.keyDown(g, { key: "ArrowUp" })
    expect(g.getAttribute("aria-activedescendant")).toMatch(/line-28$/)
    fireEvent.keyDown(g, { key: "Enter" })
    const open = document.querySelector("[aria-expanded=true]")!
    expect(open.textContent).toContain("node.cpp:38")
    // One Copy line, on the open line's detail band; the footer copies only a selection of several lines.
    expect(within(open as HTMLElement).getByRole("button", { name: "Copy line" })).toBeTruthy()
    expect(screen.getAllByRole("button", { name: "Copy line" })).toHaveLength(1)
    // A band of the row, not a ringed card nested in it.
    expect(open.querySelector("[data-log-detail]")).toBeTruthy()
    expect(open.querySelector("[data-log-detail].ring-1, [data-log-detail] .ring-1")).toBeNull()
    fireEvent.keyDown(g, { key: "Escape" })
    expect(document.querySelector("[aria-expanded=true]")).toBeNull()
    fireEvent.keyDown(g, { key: "ArrowUp", shiftKey: true })
    fireEvent.keyDown(g, { key: "ArrowUp", shiftKey: true })
    expect(document.querySelectorAll("[aria-selected=true]")).toHaveLength(3)
    expect(screen.getByRole("button", { name: "Copy 3 lines" })).toBeTruthy()
    // End goes back to the newest line and follows again.
    fireEvent.keyDown(g, { key: "End" })
    expect(footer().textContent).toContain("Following new lines")
  })

  it("opens a line on click, and opens defaultExpanded lines at first", () => {
    render(<LogViewer lines={make(10)} defaultExpanded={[3]} />)
    expect(document.querySelector("[aria-expanded=true]")?.textContent).toContain("line 3")
    // Opened lines are scrolled to, so it does not follow at first.
    expect(footer().textContent).toContain("Paused")
    fireEvent.click(shownLines().find((r) => r.textContent?.includes("line 5"))!)
    expect(document.querySelectorAll("[aria-expanded=true]")).toHaveLength(2)
  })

  it("announces new errors at most every 5 s, and only when asked", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] })
    const viewer = React.createRef<LogViewerHandle>()
    render(<LogViewer ref={viewer} lines={make(5)} />)
    const status = () => screen.getByRole("status").textContent
    act(() => {
      viewer.current!.append([{ time: t0, level: "info", message: "fine" }])
      vi.advanceTimersByTime(5000)
    })
    // Errors only, by default: an info line says nothing.
    expect(status()).toBe("")
    act(() => {
      viewer.current!.append([
        { time: t0, level: "error", message: "bad" },
        { time: t0, level: "warn", message: "hm" },
      ])
      vi.advanceTimersByTime(4900)
    })
    expect(status()).toBe("")
    act(() => void vi.advanceTimersByTime(100))
    expect(status()).toBe("3 new lines, 1 error, 1 warning")
    cleanup()
    render(<LogViewer ref={viewer} lines={make(5)} announce={false} />)
    act(() => {
      viewer.current!.append([{ time: t0, level: "fatal", message: "x" }])
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByRole("status").textContent).toBe("")
  })

  it("shows time ago from `now`", () => {
    render(<LogViewer lines={make(3)} defaultTimeMode="relative" now={t0 + 4200} />)
    expect(shownLines()[0]!.textContent).toMatch(/4\.2 ?s(ec)?\.? ago/)
  })

  it("takes every word from labels, as the zh-TW pack gives them", () => {
    render(<LogViewer lines={make(5)} labels={zh.logViewerLabels} locale={zh.locale} />)
    expect(screen.getByRole("treegrid", { name: "日誌" })).toBeTruthy()
    expect(screen.getByRole("searchbox", { name: "搜尋日誌" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "層級: 所有層級" })).toBeTruthy()
    expect(within(grid()).getByText("嚴重")).toBeTruthy()
    expect(screen.getByText("共 5 行")).toBeTruthy()
  })
})
