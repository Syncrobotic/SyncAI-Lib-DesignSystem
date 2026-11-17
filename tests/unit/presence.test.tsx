import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

afterEach(cleanup)

const a = (id: string, title: string): AlarmData => ({ id, title, priority: "high", source: "7F3A", time: "14:02", active: true, acknowledged: false })

describe("exit animations", () => {
  it("keeps a cleared alarm, hidden from assistive tech, until its disappear animation ends", () => {
    const { rerender } = render(<AlarmList alarms={[a("1", "Battery low"), a("2", "Lidar fault")]} />)
    rerender(<AlarmList alarms={[a("2", "Lidar fault")]} />)
    const leaving = screen.getByText("Battery low").closest("li")!
    expect(leaving.getAttribute("aria-hidden")).toBe("true")
    expect(leaving.className).toContain("animate-disappear")
    act(() => {
      fireEvent.animationEnd(leaving)
    })
    expect(screen.queryByText("Battery low")).toBeNull()
    expect(screen.getByText("Lidar fault")).toBeTruthy()
  })
})
