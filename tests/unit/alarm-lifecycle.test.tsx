import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { configureFeedback } from "@/registry/syncrobotic/lib/feedback"
import { AlarmList, sortAlarms, topAlarm, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

configureFeedback({ sound: false })
afterEach(cleanup)

const a = (id: string, priority: AlarmData["priority"], more: Partial<AlarmData> = {}): AlarmData => ({ id, priority, title: `Alarm ${id}`, active: true, acknowledged: false, ...more })

describe("alarm lifecycle", () => {
  it("keeps shelved, suppressed and out-of-service alarms out of the live list and the island", () => {
    const list = [a("1", "high", { shelvedUntil: "15:30" }), a("2", "high", { suppressed: true }), a("3", "low", { outOfService: true }), a("4", "low")]
    expect(sortAlarms(list).map((x) => x.id)).toEqual(["4"])
    expect(topAlarm(list)?.id).toBe("4")
  })

  it("shows shelved alarms apart, with the way back, and counts the hidden ones", () => {
    const unshelve = vi.fn()
    render(
      <AlarmList
        alarms={[a("1", "high", { shelvedUntil: "15:30" }), a("2", "high", { suppressed: true }), a("3", "low", { outOfService: true })]}
        onUnshelve={unshelve}
      />,
    )
    expect(screen.getByText("No active alarms")).toBeTruthy()
    expect(screen.getByText("Shelved · 1")).toBeTruthy()
    expect(screen.getByText(/Shelved until 15:30/)).toBeTruthy()
    fireEvent.click(screen.getByText("Shelved · 1")) // open the group
    fireEvent.click(screen.getByRole("button", { name: /^Unshelve\W+Alarm 1$/ }))
    expect(unshelve).toHaveBeenCalledWith("1")
    expect(screen.getByText("1 suppressed by design · 1 out of service")).toBeTruthy()
  })

  it("never offers to shelve a critical alarm", () => {
    render(<AlarmList alarms={[a("1", "critical"), a("2", "high")]} onShelve={() => {}} />)
    expect(screen.queryByRole("button", { name: /^Shelve\W+Alarm 1$/ })).toBeNull()
    expect(screen.getByRole("button", { name: /^Shelve\W+Alarm 2$/ })).toBeTruthy()
  })

  it("in a flood, says so and folds low alarms into one row", () => {
    const now = 1_000_000_000
    const lows = Array.from({ length: 11 }, (_, i) => a(`l${i}`, "low", { raisedAt: now - i * 1000 }))
    render(<AlarmList alarms={[a("c", "critical", { raisedAt: now }), ...lows]} now={now} />)
    expect(screen.getByText(/Alarm flood: 12 alarms in 10 min/)).toBeTruthy()
    const live = screen.getAllByRole("list")[0]
    expect(within(live).getAllByRole("article")).toHaveLength(1)
    expect(screen.getByText("11 low alarms")).toBeTruthy()
  })

  it("is not a flood when the alarms are old", () => {
    const now = 1_000_000_000
    const old = Array.from({ length: 12 }, (_, i) => a(`o${i}`, "low", { raisedAt: now - 11 * 60_000 }))
    render(<AlarmList alarms={old} now={now} />)
    expect(screen.queryByText(/Alarm flood/)).toBeNull()
  })
})
