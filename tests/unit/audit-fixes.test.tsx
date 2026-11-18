import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { configureFeedback, haptics } from "@/registry/syncrobotic/lib/feedback"
import { IslandAlarm } from "@/registry/syncrobotic/shell/island"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"
import { AlarmList, CRITICAL_REPEAT_MS, sortAlarms, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

const vibrate = vi.fn()
beforeEach(() => {
  vibrate.mockReset()
  Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true })
  configureFeedback({ haptics: true, sound: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const a = (id: string, priority: AlarmData["priority"], more: Partial<AlarmData> = {}): AlarmData => ({ id, priority, title: `Alarm ${id}`, active: true, acknowledged: false, ...more })

describe("alarm signals", () => {
  it("stay silent for shelved, suppressed and out-of-service alarms", () => {
    const { rerender } = render(<AlarmList alarms={[]} />)
    rerender(<AlarmList alarms={[a("1", "high", { shelvedUntil: "15:30" }), a("2", "critical", { suppressed: true }), a("3", "high", { outOfService: true })]} />)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it("sound again when a shelved alarm comes back", () => {
    const { rerender } = render(<AlarmList alarms={[a("1", "high", { shelvedUntil: "15:30" })]} />)
    rerender(<AlarmList alarms={[a("1", "high")]} />)
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.alarmHigh])
  })

  it("repeat a critical alarm until it is acknowledged", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] })
    const { rerender } = render(<AlarmList alarms={[]} />)
    rerender(<AlarmList alarms={[a("1", "critical")]} />)
    expect(vibrate).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(CRITICAL_REPEAT_MS * 2))
    expect(vibrate).toHaveBeenCalledTimes(3)
    rerender(<AlarmList alarms={[a("1", "critical", { acknowledged: true })]} />)
    act(() => vi.advanceTimersByTime(CRITICAL_REPEAT_MS * 2))
    expect(vibrate).toHaveBeenCalledTimes(3)
  })

  it("come from the island too, which is the alarm surface on a phone", () => {
    const { rerender } = render(<IslandAlarm alarms={[]} />)
    rerender(<IslandAlarm alarms={[a("1", "critical")]} />)
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.alarmCritical])
  })

  it("never let a critical alarm be shelved", () => {
    expect(sortAlarms([a("1", "critical", { shelvedUntil: "15:30" })]).map((x) => x.id)).toEqual(["1"])
  })

  it("count only live alarms as more on the island", () => {
    render(<IslandAlarm alarms={[a("1", "critical"), a("2", "high", { shelvedUntil: "15:30" }), a("3", "low", { suppressed: true })]} onShowAll={() => {}} />)
    expect(screen.queryByText("+2")).toBeNull()
  })
})

describe("flood", () => {
  it("ends once its alarms age out, as the clock moves on", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] })
    const t0 = Date.now()
    const lots = Array.from({ length: 12 }, (_, i) => a(`l${i}`, "low", { raisedAt: t0 }))
    render(<AlarmList alarms={lots} feedback={false} />)
    expect(screen.queryByText(/Alarm flood/)).toBeTruthy()
    act(() => vi.advanceTimersByTime(11 * 60_000))
    expect(screen.queryByText(/Alarm flood/)).toBeNull()
  })
})

describe("slide to release", () => {
  it("goes back and says so when the release fails", () => {
    const { rerender } = render(<SlideToRelease onRelease={() => {}} />)
    rerender(<SlideToRelease onRelease={() => {}} failed />)
    expect(screen.getByRole("slider").getAttribute("aria-label")).toBe("Not released, slide again")
    expect(screen.getByRole("slider").getAttribute("aria-valuenow")).toBe("0")
  })
})
