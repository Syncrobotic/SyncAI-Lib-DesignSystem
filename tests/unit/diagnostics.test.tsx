import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Diagnostics,
  buildDiagnosticsTree,
  countedDiagnostics,
  defaultDiagnosticsLabels,
  diagnosticLevelOf,
  diagnosticsId,
  filterDiagnosticsTree,
  type DiagnosticStatus,
  type DiagnosticsNode,
} from "@/registry/syncrobotic/ui/diagnostics"
import { diagnosticsLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const NOW = 1_800_000_000_000
const at = (secondsAgo: number) => NOW - secondsAgo * 1000

const amr: DiagnosticStatus[] = [
  { name: "/Power/Battery", level: "ok", message: "64 %", hardwareId: "bms-7f21", receivedAt: at(1), values: [{ key: "Voltage", value: "51.2 V" }] },
  { name: "/Motors/Left wheel", level: "error", message: "Overcurrent", hardwareId: "can0:0x21", receivedAt: at(1), values: [{ key: "Current", value: "18.6 A" }] },
  { name: "/Motors/Right wheel", level: "ok", message: "Running", hardwareId: "can0:0x22", receivedAt: at(1) },
  { name: "/Sensors/Front lidar", level: "ok", receivedAt: at(1) },
  { name: "/Sensors/Rear lidar", level: "ok", receivedAt: at(12) },
  { name: "/Sensors/Camera", level: "warn", message: "9.8 Hz", receivedAt: at(1) },
]

const find = (nodes: DiagnosticsNode[], id: string): DiagnosticsNode | undefined => {
  for (const n of nodes) {
    if (n.id === id) return n
    const below = find(n.children, id)
    if (below) return below
  }
  return undefined
}
const ids = (nodes: DiagnosticsNode[]): string[] => nodes.flatMap((n) => [n.id, ...ids(n.children)])
const rowOf = (name: string) => screen.getByText(name, { selector: "[data-slot=diagnostics-row] span" }).closest<HTMLElement>("[data-slot=diagnostics-row]")!

describe("the tree and its roll-up", () => {
  it("builds the hierarchy from the names' / paths, in arrival order", () => {
    const tree = buildDiagnosticsTree(amr, { now: NOW })
    expect(tree.map((n) => n.name)).toEqual(["Power", "Motors", "Sensors"])
    expect(find(tree, "/Motors")!.children.map((n) => n.name)).toEqual(["Left wheel", "Right wheel"])
    expect(find(tree, "/Motors")!.status).toBeUndefined()
  })

  it("rolls the worst level up to every parent: error over stale over warning over OK", () => {
    const tree = buildDiagnosticsTree(amr, { now: NOW })
    expect(find(tree, "/Power")!.level).toBe("ok")
    expect(find(tree, "/Motors")!.level).toBe("error")
    // A stale lidar outranks the camera's warning: no news could be hiding anything.
    expect(find(tree, "/Sensors")!.level).toBe("stale")
    const deep = buildDiagnosticsTree([
      { name: "/A/B/C/D", level: "warn" },
      { name: "/A/B/E", level: "ok" },
    ])
    expect(find(deep, "/A")!.level).toBe("warn")
    expect(find(deep, "/A/B/C")!.level).toBe("warn")
  })

  it("keeps a group's own status, and rolls it up with its children", () => {
    const tree = buildDiagnosticsTree([
      { name: "/Motors", level: "error", message: "Missing item: Lift" },
      { name: "/Motors/Left wheel", level: "ok" },
    ])
    const motors = find(tree, "/Motors")!
    expect(motors.ownLevel).toBe("error")
    expect(motors.level).toBe("error")
    expect(motors.children).toHaveLength(1)
  })

  it("puts a name without / at the top level, and keeps the last of a name sent twice", () => {
    const tree = buildDiagnosticsTree([
      { name: "motor_driver: Left wheel", level: "ok" },
      { name: "motor_driver: Left wheel", level: "warn", message: "Hot" },
      { name: "", level: "error" },
    ])
    expect(tree.map((n) => n.name)).toEqual(["motor_driver: Left wheel", ""])
    expect(tree[0]!.ownLevel).toBe("warn")
    expect(diagnosticsId("/Motors//Left wheel/")).toBe("/Motors/Left wheel")
  })

  it("counts each device once: leaves, and a group only when its own level is worse than everything under it", () => {
    const tree = buildDiagnosticsTree([
      { name: "/Motors", level: "warn", message: "Warning" },
      { name: "/Motors/Left", level: "warn" },
      { name: "/Motors/Right", level: "ok" },
      { name: "/Sensors", level: "error", message: "Missing item" },
      { name: "/Sensors/Lidar", level: "ok" },
    ])
    expect(countedDiagnostics(tree).map((n) => n.id)).toEqual(["/Motors/Left", "/Motors/Right", "/Sensors", "/Sensors/Lidar"])
  })
})

describe("stale by time", () => {
  it("reads Stale once no update arrived within staleAfterMs of now", () => {
    const s: DiagnosticStatus = { name: "x", level: "error", receivedAt: at(6) }
    expect(diagnosticLevelOf(s, NOW, 5000)).toBe("stale")
    expect(diagnosticLevelOf(s, NOW, 10_000)).toBe("error")
    expect(diagnosticLevelOf(s, undefined, 5000)).toBe("error")
    expect(diagnosticLevelOf(s, NOW, Infinity)).toBe("error")
    expect(diagnosticLevelOf({ name: "y", level: "stale" }, NOW, 5000)).toBe("stale")
    expect(diagnosticLevelOf({ name: "z", level: "ok" }, NOW, 5000)).toBe("ok")
  })

  it("says Stale with how long ago, on the row and in the summary", () => {
    render(<Diagnostics statuses={amr} now={NOW} />)
    const rear = rowOf("Rear lidar").closest("li")!
    expect(rear.textContent).toContain("Stale")
    expect(rear.textContent).toContain("updated 12 s ago")
    expect(rowOf("Front lidar").dataset.level).toBe("ok")
    const summary = document.querySelector("[data-slot=diagnostics-summary]")!
    expect(summary.querySelector("[data-level=stale]")!.textContent).toBe("1Stale")
  })

  it("times out on the browser's clock when no now is given, and comes back when a new status arrives", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
    vi.setSystemTime(NOW)
    const fresh: DiagnosticStatus[] = [{ name: "Lidar", level: "ok", receivedAt: Date.now() }]
    const { rerender } = render(<Diagnostics statuses={fresh} staleAfterMs={3000} />)
    act(() => vi.advanceTimersByTime(1000))
    expect(rowOf("Lidar").dataset.level).toBe("ok")
    act(() => vi.advanceTimersByTime(3000))
    expect(rowOf("Lidar").dataset.level).toBe("stale")
    expect(rowOf("Lidar").closest("li")!.textContent).toContain("updated 4 s ago")
    rerender(<Diagnostics statuses={[{ ...fresh[0]!, receivedAt: Date.now() }]} staleAfterMs={3000} />)
    expect(rowOf("Lidar").dataset.level).toBe("ok")
  })
})

describe("summary", () => {
  it("leads with the worst level and counts by level, worst first", () => {
    const { container } = render(<Diagnostics statuses={amr} now={NOW} />)
    expect(container.querySelector("[data-slot=diagnostics]")!.getAttribute("data-level")).toBe("error")
    const summary = container.querySelector("[data-slot=diagnostics-summary]")!
    expect(summary.textContent).toContain("Error")
    expect(summary.textContent).toContain("3 of 6 need attention")
    expect([...summary.querySelectorAll("li")].map((li) => li.dataset.level)).toEqual(["error", "stale", "warn", "ok"])
  })

  it("says nothing needs attention when all is OK", () => {
    render(<Diagnostics statuses={[{ name: "/A", level: "ok" }, { name: "/B", level: "ok" }]} />)
    expect(document.querySelector("[data-slot=diagnostics-summary]")!.textContent).toContain("2 statuses, nothing needs attention")
  })

  it("never tints a row: colour is on the glyph and the word only", () => {
    const { container } = render(<Diagnostics statuses={amr} now={NOW} />)
    const left = rowOf("Left wheel").closest("li")!
    expect(left.querySelector("[data-slot=diagnostics-level]")!.className).toContain("text-danger")
    expect(container.querySelectorAll("[class*=bg-danger], [class*=bg-warning]")).toHaveLength(0)
  })
})

describe("filtering", () => {
  it("Problems keeps what is not OK and the groups above it", () => {
    const tree = filterDiagnosticsTree(buildDiagnosticsTree(amr, { now: NOW }), { problems: true })
    expect(ids(tree)).toEqual(["/Motors", "/Motors/Left wheel", "/Sensors", "/Sensors/Rear lidar", "/Sensors/Camera"])
  })

  it("search matches the full name or the hardware ID in any case, and keeps what is under a matching group", () => {
    const tree = buildDiagnosticsTree(amr, { now: NOW })
    expect(ids(filterDiagnosticsTree(tree, { query: "LIDAR" }))).toEqual(["/Sensors", "/Sensors/Front lidar", "/Sensors/Rear lidar"])
    expect(ids(filterDiagnosticsTree(tree, { query: "0x22" }))).toEqual(["/Motors", "/Motors/Right wheel"])
    expect(ids(filterDiagnosticsTree(tree, { query: "motors" }))).toEqual(["/Motors", "/Motors/Left wheel", "/Motors/Right wheel"])
    expect(ids(filterDiagnosticsTree(tree, { query: "motors", problems: true }))).toEqual(["/Motors", "/Motors/Left wheel"])
  })

  it("narrows the tree as you type and choose Problems, and opens what it keeps", () => {
    const onFilterChange = vi.fn()
    render(<Diagnostics statuses={amr} now={NOW} onFilterChange={onFilterChange} />)
    // At first, the groups that hold a problem are open and the calm one is closed.
    expect(screen.getByRole("button", { name: "Items under Motors" }).getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("button", { name: "Items under Power" }).getAttribute("aria-expanded")).toBe("false")

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "battery" } })
    expect(screen.getByRole("button", { name: "Items under Power" }).getAttribute("aria-expanded")).toBe("true")
    expect(screen.queryByText("Left wheel")).toBeNull()

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("radio", { name: /Problems/ }))
    expect(onFilterChange).toHaveBeenCalledWith("problems")
    expect(screen.queryByText("Battery")).toBeNull()
    expect(screen.getByText("Left wheel")).toBeTruthy()
  })

  it("says so when nothing matches, or nothing needs attention", () => {
    render(<Diagnostics statuses={amr} now={NOW} defaultQuery="gripper" />)
    expect(screen.getByText("Nothing matches “gripper”")).toBeTruthy()
    cleanup()
    render(<Diagnostics statuses={[{ name: "/A", level: "ok" }]} filter="problems" />)
    expect(screen.getByText(defaultDiagnosticsLabels.noProblems)).toBeTruthy()
  })

  it("opens a status to its hardware ID and values", () => {
    render(<Diagnostics statuses={amr} now={NOW} />)
    const toggle = screen.getByRole("button", { name: "Details of Left wheel" })
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    const details = document.querySelector("[data-slot=diagnostics-details]")!
    expect(details.textContent).toContain("can0:0x21")
    expect(details.querySelector("dt")!.textContent).toBe("Current")
    expect(details.querySelector("dd")!.textContent).toBe("18.6 A")
  })

  it("keeps a group closed by hand closed when its level changes", () => {
    const { rerender } = render(<Diagnostics statuses={amr} now={NOW} />)
    fireEvent.click(screen.getByRole("button", { name: "Items under Motors" }))
    rerender(<Diagnostics statuses={amr.map((s) => (s.name === "/Motors/Right wheel" ? { ...s, level: "warn" as const } : s))} now={NOW} />)
    expect(screen.getByRole("button", { name: "Items under Motors" }).getAttribute("aria-expanded")).toBe("false")
    // A group that turns bad opens by itself.
    rerender(<Diagnostics statuses={amr.map((s) => (s.name === "/Power/Battery" ? { ...s, level: "warn" as const } : s))} now={NOW} />)
    expect(screen.getByRole("button", { name: "Items under Power" }).getAttribute("aria-expanded")).toBe("true")
  })
})

describe("announcements", () => {
  const live = () => document.querySelector("[aria-live=polite]")!.textContent

  it("reads out a status that turns ERROR, not the errors already there, and throttles the rest", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
    vi.setSystemTime(NOW)
    const base: DiagnosticStatus[] = [
      { name: "/Motors/Left wheel", level: "error", message: "Overcurrent" },
      { name: "/Motors/Right wheel", level: "ok" },
      { name: "/Sensors/Lidar", level: "ok" },
    ]
    const { rerender } = render(<Diagnostics statuses={base} />)
    act(() => vi.advanceTimersByTime(10))
    expect(live()).toBe("")

    const right = base.map((s) => (s.name === "/Motors/Right wheel" ? { ...s, level: "error" as const, message: "Encoder lost" } : s))
    rerender(<Diagnostics statuses={right} />)
    act(() => vi.advanceTimersByTime(10))
    expect(live()).toBe("Error: Right wheel, Encoder lost")

    // Within 5 s of the last announcement: held, then read together.
    const lidar = right.map((s) => (s.name === "/Sensors/Lidar" ? { ...s, level: "error" as const } : s))
    rerender(<Diagnostics statuses={lidar} />)
    act(() => vi.advanceTimersByTime(1000))
    expect(live()).toBe("Error: Right wheel, Encoder lost")
    act(() => vi.advanceTimersByTime(4000))
    expect(live()).toBe("Error: Lidar")
  })

  it("counts more than three at once", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
    vi.setSystemTime(NOW)
    const names = ["/A", "/B", "/C", "/D", "/E"]
    const { rerender } = render(<Diagnostics statuses={names.map((name) => ({ name, level: "ok" as const }))} />)
    act(() => vi.advanceTimersByTime(10))
    rerender(<Diagnostics statuses={names.map((name) => ({ name, level: "error" as const }))} />)
    act(() => vi.advanceTimersByTime(10))
    expect(live()).toBe("5 new errors")
  })
})

describe("labels", () => {
  it("writes every word through labels, with numbers in the locale", () => {
    render(<Diagnostics statuses={amr} now={NOW} labels={diagnosticsLabels} locale="zh-TW" label="AMR-07" />)
    const summary = document.querySelector("[data-slot=diagnostics-summary]")!
    expect(summary.textContent).toContain("錯誤")
    expect(summary.textContent).toContain("6 項中有 3 項需要注意")
    expect(rowOf("Rear lidar").closest("li")!.textContent).toContain("12 秒前更新")
    expect(screen.getByRole("button", { name: "Left wheel 的詳細資料" })).toBeTruthy()
    expect(screen.getByRole("search", { name: "搜尋診斷項目" })).toBeTruthy()
    expect(screen.getByRole("region", { name: "AMR-07" })).toBeTruthy()
  })

  it("formats ages in seconds, minutes and hours", () => {
    const ago = defaultDiagnosticsLabels.updatedAgo
    expect(ago(12_400, "en")).toBe("updated 12 s ago")
    expect(ago(125_000, "en")).toBe("updated 2 min ago")
    expect(ago(7_300_000, "en")).toBe("updated 2 h ago")
    expect(ago(-50, "en")).toBe("updated 0 s ago")
  })

  it("shows loading and empty states", () => {
    const { rerender } = render(<Diagnostics statuses={[]} loading />)
    expect(screen.getByText(defaultDiagnosticsLabels.loading)).toBeTruthy()
    rerender(<Diagnostics statuses={[]} />)
    expect(screen.getByText(defaultDiagnosticsLabels.empty)).toBeTruthy()
  })
})
