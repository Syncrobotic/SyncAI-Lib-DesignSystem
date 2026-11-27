import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { TopBarShell } from "@/registry/syncrobotic/blocks/top-bar-shell"
import { AppShellMobileTabs } from "@/registry/syncrobotic/blocks/app-shell-mobile-tabs"
import { MissionSchedule } from "@/registry/syncrobotic/blocks/mission-schedule"
import { HeatmapZones } from "@/registry/syncrobotic/blocks/heatmap-zones"
import { SettingsWebhooks } from "@/registry/syncrobotic/blocks/settings-webhooks"
import { AgentRunGate } from "@/registry/syncrobotic/blocks/agent-run-gate"
import { IslandAlarm } from "@/registry/syncrobotic/shell/island"

afterEach(cleanup)

// A positioned sr-only text that opens with punctuation (", low", ": ") is read with a stray space before it ("14 % , low").
const strays = () => [...document.querySelectorAll(".sr-only")].map((n) => n.textContent ?? "").filter((t) => /^\s*[,:;.·]/.test(t))

describe("names and text read without a stray space before a separator", () => {
  it("TopBarShell names the account button by the person, the initials hidden", () => {
    render(
      <TopBarShell product="Fleet" links={[{ label: "Robots", href: "#robots" }]} user={{ name: "Ada Lovelace", email: "ada@example.com", initials: "AL" }}>
        <p>Content</p>
      </TopBarShell>,
    )
    const button = screen.getByRole("button", { name: "Ada Lovelace ada@example.com account menu" })
    expect(button.hasAttribute("aria-label")).toBe(false)
    expect(button.querySelector('[aria-hidden="true"]')?.textContent).toBe("AL")
  })

  it("AppShellMobileTabs reads a low battery as a word after a space", () => {
    render(<AppShellMobileTabs />)
    expect(screen.getAllByText("low").length).toBeGreaterThan(0)
    expect(strays()).toEqual([])
  })

  it("MissionSchedule reads each mission as one string, as its tooltip", () => {
    render(<MissionSchedule />)
    const said = [...document.querySelectorAll("li .sr-only")].map((n) => n.textContent)
    expect(said.length).toBeGreaterThan(0)
    for (const s of said) expect(s).toMatch(/^.+, (Done|Running|Planned|Cannot run), \d\d:\d\d–\d\d:\d\d$/)
    expect(strays()).toEqual([])
  })

  it("HeatmapZones names each hour column as a time", () => {
    render(<HeatmapZones />)
    expect(screen.getByRole("columnheader", { name: "06:00" })).toBeTruthy()
    expect(strays()).toEqual([])
  })

  it("SettingsWebhooks names a failed delivery with the word after a space", () => {
    render(<SettingsWebhooks />)
    expect(screen.getByRole("button", { name: /^502 failed robot\.estop/ })).toBeTruthy()
    expect(strays()).toEqual([])
  })

  it("AgentRunGate reads a low battery as a word after a space", () => {
    render(<AgentRunGate />)
    expect(screen.getAllByText("low").length).toBeGreaterThan(0)
    expect(strays()).toEqual([])
  })

  it("IslandAlarm says the priority and the title as one string", () => {
    render(<IslandAlarm feedback={false} alarms={[{ id: "a", priority: "high", title: "Lidar fault", active: true, acknowledged: false }]} />)
    expect([...document.querySelectorAll(".sr-only")].map((n) => n.textContent)).toContain("High: ")
    expect(strays()).toEqual([])
  })
})
