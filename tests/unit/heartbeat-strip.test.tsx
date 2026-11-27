import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { heartbeatStripLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { HeartbeatStrip, heartbeatCell, heartbeatGaps, type HeartbeatBucket } from "@/registry/syncrobotic/ui/heartbeat-strip"

afterEach(cleanup)

const T0 = Date.UTC(2026, 10, 27, 0, 0, 0)
const min = 60_000
const B = 10 * min
// Ten-minute stretches: full, full, silent, silent, partial, a warning, full.
const buckets: HeartbeatBucket[] = [
  { at: T0, beats: 10, expected: 10 },
  { at: T0 + B, beats: 11, expected: 10 },
  { at: T0 + 2 * B, beats: 0, expected: 10 },
  { at: T0 + 3 * B, beats: 0, expected: 10, level: "danger" },
  { at: T0 + 4 * B, beats: 4, expected: 10 },
  { at: T0 + 5 * B, beats: 10, expected: 10, level: "warning", note: "Disk 91 % full" },
  { at: T0 + 6 * B, beats: 9, expected: 10 },
]

describe("heartbeatCell and heartbeatGaps", () => {
  it("silence first, then the problem, then how full", () => {
    expect(buckets.map(heartbeatCell)).toEqual(["full", "full", "silent", "silent", "partial", "warning", "full"])
    expect(heartbeatCell({ beats: 1, expected: 0 })).toBe("full")
  })

  it("joins neighbouring silent stretches into one gap", () => {
    expect(heartbeatGaps(buckets, B)).toEqual([{ from: T0 + 2 * B, to: T0 + 4 * B }])
    expect(heartbeatGaps([buckets[2]!, buckets[4]!, { at: T0 + 5 * B, beats: 0, expected: 10 }], B)).toHaveLength(2)
  })
})

describe("HeartbeatStrip", () => {
  it("says the window in words: check-ins, gaps and silent time", () => {
    render(<HeartbeatStrip buckets={buckets} bucketMs={B} timeZone="UTC" />)
    expect(document.querySelector("[data-slot=heartbeat-strip-summary]")!.textContent).toBe("44 of 70 check-ins, 1 gap (20 min silent)")
  })

  it("one cell per stretch, named with its time, count and state; colour only on the problem", () => {
    render(<HeartbeatStrip buckets={buckets} bucketMs={B} timeZone="UTC" />)
    const cells = within(screen.getByRole("group", { name: "Check-ins, one cell per stretch" })).getAllByRole("img")
    expect(cells).toHaveLength(7)
    expect(cells[2]!.getAttribute("aria-label")).toBe("Nov 27, 2026, 00:20 · 0 of 10 check-ins · No check-ins")
    expect(cells[1]!.getAttribute("aria-label")).toBe("Nov 27, 2026, 00:10 · 11 check-ins · Checked in")
    expect(cells[5]!.getAttribute("aria-label")).toContain("Degraded · Disk 91 % full")
    expect(cells[5]!.querySelector("span")!.className).toContain("bg-warning")
    expect(cells[0]!.querySelector("span")!.className).toContain("bg-input")
    expect(cells[2]!.querySelector("span")!.className).toContain("border-dashed")
  })

  it("is one Tab stop at the latest stretch; arrows, Home and End move along it", () => {
    render(<HeartbeatStrip buckets={buckets} bucketMs={B} />)
    const cells = screen.getAllByRole("img")
    expect(cells.filter((c) => c.tabIndex === 0)).toEqual([cells[6]])
    cells[6]!.focus()
    fireEvent.keyDown(cells[6]!, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(cells[5])
    fireEvent.keyDown(cells[5]!, { key: "Home" })
    expect(document.activeElement).toBe(cells[0])
    fireEvent.keyDown(cells[0]!, { key: "End" })
    expect(document.activeElement).toBe(cells[6])
  })

  it("events are numbered on the axis and listed in time order; outside the window they are left out", () => {
    render(
      <HeartbeatStrip
        buckets={buckets}
        bucketMs={B}
        timeZone="UTC"
        events={[
          { at: T0 + 2 * B + min, label: "Updated to 2.4.1" },
          { at: T0 + 2 * B - min, label: "Restarted" },
          { at: T0 - 60 * min, label: "Long ago" },
        ]}
      />,
    )
    const list = screen.getByRole("list", { name: "Events" })
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["1Nov 27, 2026, 00:19Restarted", "2Nov 27, 2026, 00:21Updated to 2.4.1"])
    expect(screen.getAllByRole("img")[2]!.getAttribute("aria-label")).toContain("2. Updated to 2.4.1")
    // Two minutes apart in a 70-minute window: one mark, both numbers.
    expect(screen.getByText("1, 2")).toBeTruthy()
  })

  it("a window that got every check-in expected (or more) says the count alone", () => {
    render(<HeartbeatStrip buckets={[buckets[0]!, buckets[1]!]} bucketMs={B} />)
    expect(document.querySelector("[data-slot=heartbeat-strip-summary]")!.textContent).toBe("21 check-ins, no gaps")
  })

  it("the legend shows the problems only when there are some", () => {
    render(<HeartbeatStrip buckets={buckets.slice(0, 3)} bucketMs={B} />)
    const legend = screen.getByText("Checked in").closest("ul")!
    expect(within(legend).queryByText("Degraded")).toBeNull()
    expect(within(legend).getByText("No check-ins")).toBeTruthy()
  })

  it("the table view lists every stretch with its words", () => {
    const onViewChange = vi.fn()
    render(<HeartbeatStrip buckets={buckets} bucketMs={B} timeZone="UTC" onViewChange={onViewChange} />)
    fireEvent.click(screen.getByRole("radio", { name: "Table" }))
    expect(onViewChange).toHaveBeenCalledWith("table")
    const rows = within(screen.getByRole("table")).getAllByRole("row")
    expect(rows).toHaveLength(8)
    expect(within(rows[6]!).getAllByRole("cell")[2]!.textContent).toBe("Degraded: Disk 91 % full")
  })

  it("offers the windows and reports the one chosen", () => {
    const onWindowChange = vi.fn()
    render(
      <HeartbeatStrip
        buckets={buckets}
        bucketMs={B}
        windows={[
          { value: "1h", label: "1 h" },
          { value: "24h", label: "24 h" },
        ]}
        window="1h"
        onWindowChange={onWindowChange}
      />,
    )
    fireEvent.click(within(screen.getByRole("radiogroup", { name: "Time window" })).getByRole("radio", { name: "24 h" }))
    expect(onWindowChange).toHaveBeenCalledWith("24h")
  })

  it("zh-TW", () => {
    render(<HeartbeatStrip buckets={buckets} bucketMs={B} locale="zh-TW" labels={heartbeatStripLabels} />)
    expect(document.querySelector("[data-slot=heartbeat-strip-summary]")!.textContent).toBe("70 次中收到 44 次心跳，1 段中斷（共 20 分鐘沒有心跳）")
  })
})
