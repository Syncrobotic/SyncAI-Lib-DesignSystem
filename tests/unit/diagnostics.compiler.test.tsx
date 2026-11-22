import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { diagnosticArrayToStatuses, mergeDiagnostics, type RosDiagnosticArray, type RosDiagnosticStatus } from "@/registry/syncrobotic/lib/ros"
import { Diagnostics, type DiagnosticStatus } from "@/registry/syncrobotic/ui/diagnostics?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file (a product's own component, which merges
// /diagnostics as it arrives) and diagnostics.tsx imported with ?react-compiler, so these check the panel keeps following
// its statuses, the clock, the filters and its open rows once compiled.

const NOW = 1_800_000_000_000
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

let publish: (message: RosDiagnosticArray) => void = () => {}

/** A product's page: each message is converted when it arrives and merged into the latest status of each name. */
function RobotHealth() {
  const [statuses, setStatuses] = React.useState<DiagnosticStatus[]>([])
  React.useEffect(() => {
    publish = (message) => setStatuses((previous) => mergeDiagnostics(previous, diagnosticArrayToStatuses(message)))
  }, [])
  return <Diagnostics label="AMR-07" statuses={statuses} staleAfterMs={5000} />
}

const msg = (...status: RosDiagnosticStatus[]): RosDiagnosticArray => ({ status })
const row = (name: string) => screen.getByText(name, { selector: "[data-slot=diagnostics-row] span" }).closest<HTMLElement>("[data-slot=diagnostics-row]")!
const summary = () => document.querySelector("[data-slot=diagnostics-summary]")!.textContent

describe("compiled", () => {
  it("follows each new message, a level change in place, and the clock", () => {
    render(<RobotHealth />)
    act(() => publish(msg({ level: 0, name: "Left wheel", message: "Running" }, { level: 0, name: "Lidar", message: "15 Hz" })))
    act(() => vi.advanceTimersByTime(10))
    expect(row("Left wheel").dataset.level).toBe("ok")
    expect(summary()).toContain("2 statuses, nothing needs attention")

    // Same names, same length: only a level inside changed.
    act(() => publish(msg({ level: 2, name: "Left wheel", message: "Overcurrent" })))
    expect(row("Left wheel").dataset.level).toBe("error")
    expect(summary()).toContain("1 of 2 needs attention")

    // The lidar stops; the wheel keeps publishing. Only the clock moves the lidar to Stale.
    for (let i = 0; i < 6; i++) {
      act(() => vi.advanceTimersByTime(1000))
      act(() => publish(msg({ level: 2, name: "Left wheel", message: "Overcurrent" })))
    }
    expect(row("Lidar").dataset.level).toBe("stale")
    expect(row("Lidar").closest("li")!.textContent).toContain("updated 6 s ago")
    expect(row("Left wheel").dataset.level).toBe("error")
  })

  it("announces a new error, filters, searches and opens rows", () => {
    render(<RobotHealth />)
    act(() => publish(msg({ level: 0, name: "/Motors/Left wheel", hardware_id: "can0:0x21", values: [{ key: "Current", value: "6.1 A" }] }, { level: 0, name: "/Power/Battery" })))
    act(() => vi.advanceTimersByTime(10))
    act(() => publish(msg({ level: 2, name: "/Motors/Left wheel", message: "Overcurrent", hardware_id: "can0:0x21", values: [{ key: "Current", value: "18.6 A" }] })))
    act(() => vi.advanceTimersByTime(10))
    expect(document.querySelector("[aria-live=polite]")!.textContent).toBe("Error: Left wheel, Overcurrent")

    // The group with the error opened by itself; the status opens to its values.
    fireEvent.click(screen.getByRole("button", { name: "Details of Left wheel" }))
    expect(document.querySelector("[data-slot=diagnostics-details] dd")!.textContent).toBe("18.6 A")

    fireEvent.click(screen.getByRole("radio", { name: /Problems/ }))
    expect(screen.queryByText("Power")).toBeNull()
    fireEvent.click(screen.getByRole("radio", { name: /All/ }))
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "batt" } })
    expect(screen.queryByText("Motors")).toBeNull()
    expect(row("Battery")).toBeTruthy()
  })
})
