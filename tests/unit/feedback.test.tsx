import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { configureFeedback, haptics } from "@/registry/syncrobotic/lib/feedback"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

const vibrate = vi.fn()
beforeEach(() => {
  vibrate.mockReset()
  Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true })
  configureFeedback({ haptics: true, sound: false })
})
afterEach(() => {
  cleanup()
  configureFeedback({ haptics: true, sound: true })
})

describe("stop button feedback", () => {
  it("pulses at the touch, then for the robot's answer", () => {
    const { rerender } = render(<StopButton onStop={() => {}} />)
    fireEvent.pointerDown(screen.getByRole("button"))
    fireEvent.pointerUp(screen.getByRole("button"))
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.stopSent])
    rerender(<StopButton state="sending" onStop={() => {}} />)
    rerender(<StopButton state="idle" onStop={() => {}} />)
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.stopConfirmed])
    rerender(<StopButton state="sending" onStop={() => {}} />)
    rerender(<StopButton state="unconfirmed" onStop={() => {}} />)
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.stopUnconfirmed])
  })
  it("stays still when touch is turned off", () => {
    configureFeedback({ haptics: false })
    render(<StopButton onStop={() => {}} />)
    fireEvent.pointerDown(screen.getByRole("button"))
    expect(vibrate).not.toHaveBeenCalled()
  })
})

describe("alarm list feedback", () => {
  const a = (id: string, priority: AlarmData["priority"]): AlarmData => ({ id, priority, title: id, active: true, acknowledged: false })
  it("buzzes for a new critical alarm, not for the ones already there", () => {
    const { rerender } = render(<AlarmList alarms={[a("1", "critical")]} />)
    expect(vibrate).not.toHaveBeenCalled()
    rerender(<AlarmList alarms={[a("1", "critical"), a("2", "low")]} />)
    expect(vibrate).not.toHaveBeenCalled()
    rerender(<AlarmList alarms={[a("1", "critical"), a("2", "low"), a("3", "critical")]} />)
    expect(vibrate).toHaveBeenLastCalledWith([...haptics.alarmCritical])
  })
  it("is quiet as a record view", () => {
    const { rerender } = render(<AlarmList feedback={false} alarms={[]} />)
    rerender(<AlarmList feedback={false} alarms={[a("1", "high")]} />)
    expect(vibrate).not.toHaveBeenCalled()
  })
})
