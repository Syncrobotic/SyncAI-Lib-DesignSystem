import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ConsoleOverview } from "@/registry/syncrobotic/blocks/console-overview"
import { EventLog } from "@/registry/syncrobotic/blocks/event-log"
import { ListDetail } from "@/registry/syncrobotic/blocks/list-detail"
import { MaintenanceDue } from "@/registry/syncrobotic/blocks/maintenance-due"
import { MissionSchedule } from "@/registry/syncrobotic/blocks/mission-schedule"
import { SettingsPage } from "@/registry/syncrobotic/blocks/settings-page"
import { SheetRobotDetail } from "@/registry/syncrobotic/blocks/sheet-robot-detail"
import { WizardImport } from "@/registry/syncrobotic/blocks/wizard-import"

afterEach(cleanup)

describe("event log", () => {
  it("opens an event from its whole row: the button stretches over the row, which draws its focus ring", () => {
    render(<EventLog />)
    const open = screen.getByRole("button", { name: "Connection lost" })
    const row = open.closest("tr")!
    // The overlay is the button's ::after, positioned on the row: the target is the row's 56 px, not one line of text.
    expect(open.className).toMatch(/after:absolute/)
    expect(open.className).toMatch(/after:inset-0/)
    expect(row.className).toMatch(/\brelative\b/)
    expect(row.className).toContain("has-[button:focus-visible]:outline-2")
    // No press on the button: a scale would make it the box its overlay fills, and shrink the target mid-tap.
    expect(open.className).not.toMatch(/\bpress\b/)
    // A chevron says the row leads somewhere.
    expect(row.querySelector("svg.lucide-chevron-right")).toBeTruthy()
    fireEvent.click(open)
    expect(screen.getByText("No heartbeat for 60 s. Last position Dock B.")).toBeTruthy()
  })

  it("tells the same battery story as the overview and the fleet table: 9C44 at 14 %", () => {
    render(<EventLog />)
    fireEvent.click(screen.getByRole("button", { name: "Battery below 15 %" }))
    expect(screen.getByText(/^14 % at 14:01/)).toBeTruthy()
  })
})

describe("the emergency stop is one tap away", () => {
  it("console overview: the site's stop, under the critical alarm, stopping every robot", async () => {
    render(<ConsoleOverview />)
    expect(screen.getByText("Emergency stop · Warehouse")).toBeTruthy()
    expect(screen.getByText("Battery 14 %, 12 min left")).toBeTruthy()
    const stop = screen.getByRole("button", { name: /Emergency stop.*All robots/ })
    fireEvent.pointerDown(stop)
    await act(async () => void (await new Promise((r) => setTimeout(r, 0))))
    expect(screen.getByRole("button", { name: /Sending…/ })).toBeTruthy()
  })

  it("list detail: the picked robot's stop, and slide to release for a stopped one", () => {
    render(<ListDetail />)
    fireEvent.click(screen.getByRole("button", { name: /Patrol dog 7F3A/ }))
    expect(screen.getByRole("button", { name: /Emergency stop.*7F3A/ })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /Patrol dog 4D21/ }))
    expect(screen.queryByRole("button", { name: /Emergency stop/ })).toBeNull()
    expect(screen.getByRole("slider", { name: /release/i })).toBeTruthy()
  })

  it("robot sheet: the stop comes with the sheet, since its scrim covers the app's own", () => {
    render(<SheetRobotDetail defaultOpen />)
    const sheet = screen.getByRole("dialog")
    expect(within(sheet).getByRole("button", { name: /^Stop.*9E37/ })).toBeTruthy()
  })
})

describe("settings page", () => {
  it("puts focus on the first field to fix when a save fails", () => {
    render(<SettingsPage />)
    const site = screen.getByLabelText("Site name")
    fireEvent.change(site, { target: { value: "N" } })
    const save = screen.getByRole("button", { name: "Save changes" })
    save.focus()
    fireEvent.click(save)
    expect(site.getAttribute("aria-invalid")).toBe("true")
    expect(document.activeElement).toBe(site)
  })

  it("marks the section being read, rather than links that look like tabs with none chosen", () => {
    render(<SettingsPage />)
    const nav = screen.getByRole("navigation", { name: "Settings sections" })
    const current = within(nav)
      .getAllByRole("link")
      .filter((a) => a.getAttribute("aria-current"))
    // One section is always the current one (which depends on the scroll; the test page has no layout).
    expect(current).toHaveLength(1)
    expect(current[0]!.getAttribute("aria-current")).toBe("location")

  })
})

describe("wizard import", () => {
  it("claims nothing about a file before there is one, and says why Next is disabled", () => {
    render(<WizardImport />)
    expect(screen.queryByText("4 columns found")).toBeNull()
    expect(screen.queryByText("4 rows")).toBeNull()
    const next = screen.getAllByRole("button", { name: "Next" })[0]!
    expect(next.hasAttribute("disabled")).toBe(true)
    expect(document.getElementById(next.getAttribute("aria-describedby")!)?.textContent).toBe("Choose a CSV file first")
    // The drop zone opens the browser's picker; the sample file stands in for one here.
    expect(screen.getByRole("button", { name: /Drop a CSV file here or choose one/ })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Use the sample file" }))
    expect(screen.getByText("4 columns found")).toBeTruthy()
    expect(next.hasAttribute("disabled")).toBe(false)
    expect(next.getAttribute("aria-describedby")).toBeNull()
    expect(screen.queryByText("Choose a CSV file first")).toBeNull()
  })
})

describe("mission schedule", () => {
  it("says each mission's state in a visible word on the timeline, never by its fill alone", () => {
    render(<MissionSchedule />)
    const lane = screen.getAllByRole("list", { name: "Patrol dog 1715 missions" }).at(-1)!
    const words = within(lane)
      .getAllByRole("listitem")
      .map((li) => li.textContent)
    // The one the now-line crosses (22:00–00:00) is running, not planned.
    expect(words).toEqual(["Car park, Done, 18:30–20:30", "Car park, Running, 22:00–00:00", "Car park, Planned, 03:00–05:00"])
    const key = screen.getByRole("list", { name: "Key" })
    expect(key.textContent).not.toMatch(/Amber|Blue|Muted|Outlined/)
  })
})

describe("maintenance due", () => {
  it("colours only the shape and the word Overdue or Due soon; when it is due stays grey", () => {
    render(<MaintenanceDue />)
    const overdue = screen.getAllByText("Overdue")[0]!
    expect(overdue.className).toContain("text-danger")
    expect(screen.getAllByText("12 h over")[0]!.className).toContain("text-muted-foreground")
    expect(screen.getAllByText("Due soon")[0]!.className).toContain("text-warning")
  })
})
