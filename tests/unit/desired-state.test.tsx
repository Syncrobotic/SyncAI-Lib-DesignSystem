import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { desiredStateLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { DesiredState, desiredPhaseOf } from "@/registry/syncrobotic/ui/desired-state"

afterEach(cleanup)

const NOW = Date.UTC(2026, 10, 27, 6, 2, 0)
const min = 60_000
const thresholds = { laggingAfterMs: 2 * min, staleAfterMs: 10 * min }
const section = () => document.querySelector<HTMLElement>("[data-slot=desired-state]")!

describe("desiredPhaseOf", () => {
  it("in effect wins, then blocked, then a stale device, then overdue", () => {
    expect(desiredPhaseOf({ inEffect: true, blocked: true }, NOW)).toBe("in-effect")
    expect(desiredPhaseOf({ blocked: true, orderedAt: NOW - min, overdueAfterMs: 60 * min }, NOW)).toBe("blocked")
    expect(desiredPhaseOf({ orderedAt: NOW - min, lastCheckInAt: NOW - 30 * min, thresholds }, NOW)).toBe("blocked")
    expect(desiredPhaseOf({ orderedAt: NOW - min, lastCheckInAt: NOW - 30_000, thresholds, offline: true }, NOW)).toBe("blocked")
    expect(desiredPhaseOf({ orderedAt: NOW - 20 * min, overdueAfterMs: 15 * min, lastCheckInAt: NOW - 30_000, thresholds }, NOW)).toBe("overdue")
    expect(desiredPhaseOf({ orderedAt: NOW - min, overdueAfterMs: 15 * min, lastCheckInAt: NOW - 30_000, thresholds }, NOW)).toBe("pending")
  })

  it("a device that never reported, or one air-gapped, does not block it", () => {
    expect(desiredPhaseOf({ orderedAt: NOW - min, lastCheckInAt: null, thresholds }, NOW)).toBe("pending")
    expect(desiredPhaseOf({ orderedAt: NOW - min, lastCheckInAt: NOW - 30 * 24 * 60 * min, thresholds, airGapped: true }, NOW)).toBe("pending")
  })
})

describe("DesiredState", () => {
  it("pending: quiet, ordered beside believed, takes effect at the next check-in", () => {
    render(<DesiredState desired="Revoked" reported="Running 4 modules" orderedAt={NOW - 3 * min} lastCheckInAt={NOW - 30_000} thresholds={thresholds} now={NOW} timeZone="UTC" />)
    expect(section().dataset.phase).toBe("pending")
    expect(screen.getByRole("heading", { name: "Ordered, not yet in effect" }).className).not.toContain("text-warning")
    expect(screen.getByText(/takes effect at the device's next check-in/)).toBeTruthy()
    expect(screen.getByText("Believed on the device")).toBeTruthy()
    expect(screen.getByText("Running 4 modules")).toBeTruthy()
    expect(screen.getByText("3 minutes ago (Nov 27, 2026, 05:59)")).toBeTruthy()
    expect(document.querySelector("[data-slot=freshness-stamp]")!.getAttribute("data-freshness")).toBe("live")
  })

  it("overdue takes the warning colour", () => {
    render(<DesiredState desired="Removed" reported="Enrolled" orderedAt={NOW - 60 * min} overdueAfterMs={15 * min} now={NOW} />)
    expect(section().dataset.phase).toBe("overdue")
    expect(screen.getByRole("heading").className).toContain("text-warning")
  })

  it("blocked says the product's reason in place of the default", () => {
    render(<DesiredState desired="Revoked" reported="Running" blocked blockedReason="Check-ins are refused while it is suspended." now={NOW} />)
    expect(section().dataset.phase).toBe("blocked")
    expect(screen.getByText("Check-ins are refused while it is suspended.")).toBeTruthy()
  })

  it("air-gapped: applied by hand, no check-in shown", () => {
    render(<DesiredState desired="Renewed" reported="Old licence" airGapped thresholds={thresholds} now={NOW} />)
    expect(section().dataset.phase).toBe("pending")
    expect(screen.getByText(/once the signed file is applied on the device/)).toBeTruthy()
    expect(document.querySelector("[data-slot=freshness-stamp]")).toBeNull()
  })

  it("in effect: no believed side", () => {
    render(<DesiredState desired="Revoked" reported="Running" inEffect now={NOW} />)
    expect(screen.getByRole("heading", { name: "In effect" })).toBeTruthy()
    expect(screen.queryByText("Believed on the device")).toBeNull()
  })

  it("zh-TW", () => {
    render(<DesiredState desired="撤銷" reported="執行中" orderedAt={NOW - 3 * min} now={NOW} locale="zh-TW" timeZone="Asia/Taipei" labels={desiredStateLabels} />)
    expect(screen.getByRole("heading", { name: "已下達，尚未生效" })).toBeTruthy()
    expect(screen.getByText("3 分鐘前（2026年11月27日 13:59）")).toBeTruthy()
  })
})
