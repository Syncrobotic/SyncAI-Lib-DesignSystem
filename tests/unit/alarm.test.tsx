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
        alarms={[b("1", "high"), b("2", "low"), b("3", "low", { shelvedUntil: "15:30" }), b("4", "high", { suppressed: true }), b("5", "low", { outOfService: true })]}
        onAcknowledgeAll={all}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge all" }))
    expect(all).toHaveBeenCalledWith(["1", "2"])
    expect(screen.getByRole("status").textContent).toBe("2 alarms acknowledged")
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Alarms" }))
  })

  it("leaves the low alarms folded in a flood alone while their group is closed", () => {
    const all = vi.fn()
    const now = 1_000_000_000
    const lows = Array.from({ length: 11 }, (_, i) => b(`l${i}`, "low", { raisedAt: now }))
    render(<AlarmList feedback={false} now={now} alarms={[b("h", "high", { raisedAt: now }), b("h2", "high", { raisedAt: now }), ...lows]} onAcknowledgeAll={all} />)
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge 2 shown" }))
    expect(all.mock.calls[0][0].sort()).toEqual(["h", "h2"])
  })

  it("appears only when onAcknowledgeAll is passed, not from onAcknowledge alone", () => {
    render(<AlarmList feedback={false} alarms={[b("1", "high"), b("2", "low")]} onAcknowledge={() => {}} />)
    expect(screen.queryByRole("button", { name: /Acknowledge all|non-critical|shown/ })).toBeNull()
  })

  it("never takes a critical alarm: each is acknowledged on its own row, and the button says so", () => {
    const all = vi.fn()
    const { rerender } = render(<AlarmList feedback={false} alarms={[b("c", "critical"), b("1", "high")]} onAcknowledge={() => {}} onAcknowledgeAll={all} />)
    // One critical and one other: nothing for the button to take in bulk.
    expect(screen.queryByRole("button", { name: /Acknowledge (all|\d)/ })).toBeNull()
    rerender(<AlarmList feedback={false} alarms={[b("c", "critical"), b("1", "high"), b("2", "low")]} onAcknowledge={() => {}} onAcknowledgeAll={all} />)
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge 2 non-critical" }))
    expect(all).toHaveBeenCalledWith(["1", "2"])
    expect(screen.getByRole("button", { name: /^Acknowledge\W+Alarm c$/ })).toBeTruthy()
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

describe("AlarmList status (0.22.1)", () => {
  it("while loading shows placeholders and never says there are no alarms", () => {
    const { container } = render(<AlarmList alarms={[]} status="loading" feedback={false} />)
    expect(screen.queryByText("No active alarms")).toBeNull()
    expect(container.querySelector("section")!.getAttribute("aria-busy")).toBe("true")
    expect(screen.getByRole("status").textContent).toBe("Loading alarms")
  })
  it("with an error and nothing loaded, says alarms may be missing, as an alert, with a retry", () => {
    const retry = vi.fn()
    render(<AlarmList alarms={[]} status="error" onRetry={retry} updatedAt="13:42" feedback={false} />)
    expect(screen.queryByText("No active alarms")).toBeNull()
    const alert = screen.getByRole("alert")
    expect(alert.textContent).toContain("There may be alarms you cannot see")
    expect(alert.textContent).toContain("Last updated 13:42")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })
  it("with an error, keeps the alarms it already has and says they may be out of date", () => {
    render(<AlarmList alarms={[a("1", "high")]} status="error" feedback={false} />)
    expect(screen.getByText("Alarm 1")).toBeTruthy()
    expect(screen.getByRole("alert").textContent).toContain("may be out of date")
  })
  it("the first load is the starting point: it is not announced as new alarms", () => {
    const { rerender } = render(<AlarmList alarms={[]} status="loading" feedback={false} />)
    rerender(<AlarmList alarms={[a("1", "critical")]} status="ready" feedback={false} />)
    const assertive = document.querySelector('[aria-live="assertive"]')!
    expect(assertive.textContent).toBe("")
    rerender(<AlarmList alarms={[a("1", "critical"), a("2", "critical")]} status="ready" feedback={false} />)
    expect(assertive.textContent).toContain("Alarm 2")
  })
})
