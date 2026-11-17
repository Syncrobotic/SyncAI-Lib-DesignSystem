import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Alarm, AlarmList, sortAlarms, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

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

  it("renders nothing once everything is acknowledged", () => {
    const { container } = render(<IslandAlarm alarms={[a("1", "critical", true)]} />)
    expect(container.innerHTML).toBe("")
  })
})
