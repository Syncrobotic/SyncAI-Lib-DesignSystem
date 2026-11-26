import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  AgentRunOutcome,
  AgentRunOutcomeContent,
  sampleAgentRunOutcome,
  type AgentRunRobotOutcome,
} from "@/registry/syncrobotic/blocks/agent-run-outcome"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// Before its first measure ResponsiveTable has both the table and the phone list in the page: read the table's rows.
const rows = () => Array.from(document.querySelectorAll<HTMLTableRowElement>("tr[data-slot=responsive-table-row]"))
const row = (robot: string) => rows().find((r) => r.cells[0]!.textContent === robot)!
const result = (robot: string) => row(robot).cells[1]!.textContent
const card = (label: string) =>
  Array.from(document.querySelectorAll<HTMLElement>("[data-slot=metric-card]")).find((c) => c.textContent!.startsWith(label))!

describe("agent-run-outcome", () => {
  it("counts each result and lists the robots that need someone first; not verified is never a success", () => {
    render(<AgentRunOutcome />)
    expect(card("Succeeded").textContent).toContain("6/ 11")
    expect(card("Failed").textContent).toContain("2")
    expect(card("Failed").getAttribute("data-tone")).toBe("danger")
    expect(card("Not verified").textContent).toContain("1")
    expect(card("Not verified").getAttribute("data-tone")).toBe("warning")
    expect(card("Skipped").textContent).toContain("2")
    expect(rows().map((r) => r.cells[1]!.textContent)).toEqual([
      "Failed",
      "Failed",
      "Not verified",
      ...Array(6).fill("Succeeded"),
      "Skipped",
      "Skipped",
    ])
    expect(row("AMR 07").textContent).toContain("Path to Dock 4 blocked: a pallet in aisle 6")
    expect(row("AMR 12").textContent).toContain("no reply in 5 min")
    expect(screen.getByText("Ended, 2 failed")).toBeTruthy()
  })

  it("links back to the run's steps", () => {
    render(<AgentRunOutcomeContent traceHref="/agents/runs/run_8c3e" />)
    expect(screen.getByRole("link", { name: "Open the run's steps" }).getAttribute("href")).toBe("/agents/runs/run_8c3e")
    expect(screen.getByRole("heading", { name: sampleAgentRunOutcome.goal, level: 2 })).toBeTruthy()
  })

  it("Retry failed says how many and retries the failed robots only, never one that is not verified", async () => {
    let finish: () => void = () => {}
    const gate = new Promise<void>((r) => (finish = r))
    const retry = vi.fn(async (r: AgentRunRobotOutcome): Promise<AgentRunRobotOutcome> => {
      await gate
      return r.robot === "AMR 07" ? { ...r, result: "succeeded", detail: "Docked at Dock 4 on retry" } : { ...r, detail: "Refused again" }
    })
    render(<AgentRunOutcome retry={retry} />)
    const button = screen.getByRole("button", { name: "Retry 2 failed" })
    expect(screen.getByText(/Retry sends the command again to the 2 failed only/)).toBeTruthy()
    // It moves robots, so it asks first and names them; nothing is sent until the person confirms.
    await act(async () => void fireEvent.click(button))
    const dialog = screen.getByRole("alertdialog", { name: "Send the command again to 2 robots?" })
    expect(within(dialog).getByText("AMR 07")).toBeTruthy()
    expect(within(dialog).getByText("Patrol dog 9E37")).toBeTruthy()
    expect(within(dialog).queryByText("AMR 12")).toBeNull()
    expect(retry).not.toHaveBeenCalled()
    await act(async () => void fireEvent.click(within(dialog).getByRole("button", { name: "Send again" })))
    expect(retry.mock.calls.map(([r]) => r.robot).sort()).toEqual(["AMR 07", "Patrol dog 9E37"])
    expect(result("AMR 07")).toBe("Retrying")
    expect(result("AMR 12")).toBe("Not verified")
    expect(screen.getByRole("status").textContent).toBe("Retrying 2 failed robots.")
    // No second retry while one runs.
    expect((screen.getByRole("button", { name: /Retry/ }) as HTMLButtonElement).disabled).toBe(true)
    await act(async () => {
      finish()
      await gate
    })
    expect(result("AMR 07")).toBe("Succeeded")
    expect(result("Patrol dog 9E37")).toBe("Failed")
    expect(result("AMR 12")).toBe("Not verified")
    expect(screen.getByRole("status").textContent).toBe("Retry finished: 1 succeeded, 1 failed again.")
    expect(screen.getByRole("button", { name: "Retry 1 failed" })).toBeTruthy()
    expect(card("Succeeded").textContent).toContain("7/ 11")
  })

  it("the sample's script settles on its timer: AMR 07 docks, 9E37 fails again", async () => {
    vi.useFakeTimers()
    render(<AgentRunOutcome />)
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "Retry 2 failed" })))
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "Send again" })))
    await act(async () => void (await vi.advanceTimersByTimeAsync(1500)))
    expect(result("AMR 07")).toBe("Succeeded")
    expect(result("Patrol dog 9E37")).toBe("Failed")
  })

  it("keyboard: Retry failed is a native button in the tab order, and disabled with nothing to retry", () => {
    const run = { ...sampleAgentRunOutcome, robots: sampleAgentRunOutcome.robots.filter((r) => r.result !== "failed") }
    render(<AgentRunOutcomeContent run={run} />)
    const button = screen.getByRole("button", { name: "Retry failed" }) as HTMLButtonElement
    expect(button.tagName).toBe("BUTTON")
    expect(button.disabled).toBe(true)
    expect(screen.getByText("Nothing failed, so there is nothing to retry.")).toBeTruthy()
    expect(screen.getByText("Ended, 1 not verified")).toBeTruthy()
  })

  it("a run with no robots shows its empty state", () => {
    render(<AgentRunOutcomeContent run={{ ...sampleAgentRunOutcome, robots: [] }} />)
    expect(screen.getAllByText("No robots in this run").length).toBeGreaterThan(0)
  })
})
