import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Alarm, AlarmList, sortAlarms, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

afterEach(cleanup)

const a = (id: string, priority: AlarmData["priority"], acknowledged = false, active = true): AlarmData => ({ id, priority, title: `Alarm ${id}`, active, acknowledged })

describe("sortAlarms", () => {
  it("puts unacknowledged first, then priority, then newest", () => {
    const list = [a("1", "low"), a("2", "critical", true), a("3", "high"), a("4", "critical"), a("5", "high")]
    expect(sortAlarms(list).map((x) => x.id)).toEqual(["4", "5", "3", "1", "2"])
  })

  it("drops alarms that are cleared and acknowledged, keeps cleared ones awaiting acknowledgement", () => {
    expect(sortAlarms([a("1", "high", true, false), a("2", "high", false, false)]).map((x) => x.id)).toEqual(["2"])
  })
})

describe("Alarm", () => {
  it("names the priority in words, not only colour", () => {
    render(<Alarm priority="critical" title="Collision risk" active acknowledged={false} />)
    expect(screen.getByRole("article", { name: /Critical.*Collision risk/ })).toBeTruthy()
  })

  it("offers acknowledge only while unacknowledged", () => {
    const onAck = vi.fn()
    const { rerender } = render(<Alarm priority="high" title="Battery low" active acknowledged={false} onAcknowledge={onAck} />)
    fireEvent.click(screen.getByRole("button", { name: /Acknowledge/ }))
    expect(onAck).toHaveBeenCalledOnce()
    rerender(<Alarm priority="high" title="Battery low" active acknowledged onAcknowledge={onAck} />)
    expect(screen.queryByRole("button", { name: /Acknowledge/ })).toBeNull()
  })
})

describe("AlarmList", () => {
  it("announces new critical alarms assertively and others politely, not the initial ones", () => {
    const { container, rerender } = render(<AlarmList alarms={[a("1", "low")]} />)
    const assertive = container.querySelector('[aria-live="assertive"]')!
    const polite = container.querySelector('[aria-live="polite"]')!
    expect(polite.textContent).toBe("")
    act(() => rerender(<AlarmList alarms={[a("1", "low"), a("2", "critical"), a("3", "high")]} />))
    expect(assertive.textContent).toBe("Critical: Alarm 2")
    expect(polite.textContent).toBe("High: Alarm 3")
  })
})

import { IslandAlarm } from "@/registry/syncrobotic/shell/island"
import { alarmEdge, topAlarm } from "@/registry/syncrobotic/ui/alarm"

describe("IslandAlarm", () => {
  it("shows the most urgent unacknowledged alarm and counts the rest", () => {
    const list = [a("1", "high"), a("2", "critical"), a("3", "low", true)]
    render(<IslandAlarm alarms={list} onShowAll={() => {}} />)
    expect(screen.getByRole("group", { name: "Critical: Alarm 2" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "+1 more unacknowledged" })).toBeTruthy()
    expect(alarmEdge(topAlarm(list))).toBe("danger")
  })

  it("shows nothing once everything is acknowledged, but keeps its live regions for the next alarm", () => {
    const { container } = render(<IslandAlarm alarms={[a("1", "critical", true)]} />)
    expect(container.querySelector('[role="group"]')).toBeNull()
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(2)
  })

  it("is never tinted, critical included, and shows the time first", () => {
    render(<IslandAlarm alarms={[{ ...a("1", "critical"), time: "14:02:31", source: "Patrol dog 7F3A" }]} />)
    const group = screen.getByRole("group")
    expect(group.className).not.toMatch(/subtle/)
    expect(group.textContent).toMatch(/14:02:31 · Patrol dog 7F3A/)
  })
})

describe("Alarm states (0.22.0)", () => {
  it("says when it was acknowledged, and drops the bold and the bar", () => {
    render(<Alarm priority="low" title="Lidar cleaning due" time="13:40:12" active acknowledged acknowledgedAt="13:42" />)
    const row = screen.getByRole("article")
    expect(row.getAttribute("data-state")).toBe("acknowledged")
    expect(screen.getByText("Acknowledged 13:42")).toBeTruthy()
    expect(row.querySelector(".font-bold")).toBeNull()
  })

  it("keeps a cleared, unacknowledged alarm distinct: its own state, words and a dashed bar", () => {
    render(<Alarm priority="high" title="Localisation degraded" active={false} acknowledged={false} clearedAt="14:07" onAcknowledge={() => {}} />)
    const row = screen.getByRole("article")
    expect(row.getAttribute("data-state")).toBe("cleared")
    expect(screen.getByText("Cleared 14:07, not acknowledged")).toBeTruthy()
    expect(row.querySelector(".border-dashed")).toBeTruthy()
    expect(screen.getByRole("button", { name: /Acknowledge/ })).toBeTruthy()
  })

  it("never tints a row, critical included", () => {
    render(<Alarm priority="critical" title="Collision risk" active acknowledged={false} />)
    expect(screen.getByRole("article").className).not.toMatch(/subtle/)
  })
})

describe("Acknowledge all", () => {
  const b = (id: string, priority: AlarmData["priority"], more: Partial<AlarmData> = {}): AlarmData => ({ ...a(id, priority), ...more })

  it("shows only with two or more unacknowledged alarms in view", () => {
    const { rerender } = render(<AlarmList feedback={false} alarms={[b("1", "high"), b("2", "low", { acknowledged: true })]} onAcknowledgeAll={() => {}} />)
    expect(screen.queryByRole("button", { name: "Acknowledge all" })).toBeNull()
    rerender(<AlarmList feedback={false} alarms={[b("1", "high"), b("2", "low")]} onAcknowledgeAll={() => {}} />)
    expect(screen.getByRole("button", { name: "Acknowledge all" })).toBeTruthy()
  })

  it("acknowledges what is in view, never shelved, suppressed or out-of-service alarms, and says so", () => {
    const all = vi.fn()
    render(
      <AlarmList
        feedback={false}
        alarms={[b("1", "high"), b("2", "critical"), b("3", "low", { shelvedUntil: "15:30" }), b("4", "high", { suppressed: true }), b("5", "low", { outOfService: true })]}
        onAcknowledgeAll={all}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge all" }))
    expect(all).toHaveBeenCalledWith(["2", "1"])
    expect(screen.getByRole("status").textContent).toBe("2 alarms acknowledged")
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Alarms" }))
  })

  it("leaves the low alarms folded in a flood alone while their group is closed", () => {
    const all = vi.fn()
    const now = 1_000_000_000
    const lows = Array.from({ length: 11 }, (_, i) => b(`l${i}`, "low", { raisedAt: now }))
    render(<AlarmList feedback={false} now={now} alarms={[b("c", "critical", { raisedAt: now }), b("h", "high", { raisedAt: now }), ...lows]} onAcknowledgeAll={all} />)
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge 2 shown" }))
    expect(all).toHaveBeenCalledWith(["c", "h"])
  })

  it("falls back to onAcknowledge for each alarm", () => {
    const one = vi.fn()
    render(<AlarmList feedback={false} alarms={[b("1", "high"), b("2", "low")]} onAcknowledge={one} />)
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge all" }))
    expect(one.mock.calls.map((c) => c[0])).toEqual(["1", "2"])
  })

  it("moves focus to the next Acknowledge after one is used, not to the top of the page", () => {
    const { rerender } = render(<AlarmList feedback={false} alarms={[b("1", "high"), b("2", "low")]} onAcknowledge={() => {}} />)
    const first = screen.getByRole("button", { name: /^Acknowledge\W+Alarm 1$/ })
    first.focus()
    fireEvent.click(first)
    act(() => rerender(<AlarmList feedback={false} alarms={[b("1", "high", { acknowledged: true }), b("2", "low")]} onAcknowledge={() => {}} />))
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Acknowledge\W+Alarm 2$/ }))
  })
})
