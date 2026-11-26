import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AgentRunGate, AgentRunGateContent, sampleAgentRun, type AgentRun } from "@/registry/syncrobotic/blocks/agent-run-gate"

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const step = (id: string) => {
  const title = sampleAgentRun.steps.find((s) => s.id === id)!.title
  return Array.from(document.querySelectorAll<HTMLElement>("[data-slot=trace-item]")).find((li) => li.textContent!.includes(title))!
}
const statusOf = (id: string) => step(id).getAttribute("data-status")
// Each timer is set by an effect after the render before it, so time moves in small steps, a render between each.
const run = async (ms: number) => {
  for (let t = 0; t < ms; t += 100) await act(async () => void vi.advanceTimersByTime(Math.min(100, ms - t)))
}
const press = (name: string | RegExp) => act(async () => void fireEvent.click(screen.getByRole("button", { name })))
const type = (text: string) => fireEvent.change(screen.getByRole("textbox"), { target: { value: text } })
const submit = () => act(async () => void fireEvent.submit(screen.getByRole("textbox").closest("form")!))
const eyebrow = () => document.querySelector("[data-slot=agent-run-gate] .inline-flex.h-\\(--h-tag\\)")!.textContent

describe("agent-run-gate", () => {
  it("waits at the gate before the step that moves robots: the change robot by robot, why, the facts and the expiry", () => {
    render(<AgentRunGate />)
    expect(eyebrow()).toBe("Waiting for your approval")
    expect(statusOf("plan")).toBe("done")
    expect(statusOf("dispatch")).toBe("pending")
    expect(step("dispatch").getAttribute("data-gate")).toBe("open")
    expect(step("dispatch").textContent).toContain("Needs your approval · expires 22:23, in 25 min")
    for (const r of ["Patrol dog 9E37", "Patrol dog 1715", "AMR 12"]) expect(screen.getAllByText(r).length).toBeGreaterThan(0)
    expect(screen.getByRole("heading", { name: /What changes/, level: 3 })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Why", level: 3 })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Facts it used", level: 3 })).toBeTruthy()
    expect(screen.getByText("Closed since 21:41")).toBeTruthy()
    // It says before the decision what Deny would hold back.
    expect(screen.getByText(/Deny skips this step and the 2 steps that depend on it/)).toBeTruthy()
    // Nothing runs on its own while it waits.
    act(() => void vi.advanceTimersByTime(60_000))
    expect(statusOf("dispatch")).toBe("pending")
    expect(statusOf("note")).toBe("pending")
  })

  it("Deny asks why, then skips the held step and every step that depends on it, with the reason; the rest still runs", async () => {
    const onDecide = vi.fn()
    render(<AgentRunGate onDecide={onDecide} />)
    await press("Deny")
    await submit()
    expect(screen.getByText("Say why, so the agent and the next person know.")).toBeTruthy()
    expect(statusOf("dispatch")).toBe("pending")
    type("Bay C has a delivery at 23:00.")
    await submit()
    expect(onDecide).toHaveBeenCalledWith({ stepId: "dispatch", decision: "deny", reason: "Bay C has a delivery at 23:00." })
    for (const id of ["dispatch", "confirm", "schedule"]) expect(statusOf(id)).toBe("skipped")
    expect(document.querySelector("[data-slot=trace-item][data-status=error]")).toBeNull()
    expect(step("dispatch").textContent).toContain("Skipped: you denied it. Bay C has a delivery at 23:00.")
    expect(step("confirm").textContent).toContain("Skipped: it depends on “Send the new routes to 3 robots”, which you denied")
    // "schedule" depends on "confirm": skipped too, however far down.
    expect(step("schedule").textContent).toContain("which you denied")
    expect(screen.getByRole("status").textContent).toContain("You denied it: Bay C has a delivery at 23:00. No robot moved.")
    // The step that does not depend on the denied one still runs.
    await run(5000)
    expect(statusOf("note")).toBe("done")
    expect(eyebrow()).toBe("Done, 3 skipped")
  })

  it("Approve continues the run: the held step runs, then each step after it, until the run is done", async () => {
    const onDecide = vi.fn()
    render(<AgentRunGate onDecide={onDecide} />)
    await press("Approve and send to robots")
    expect(onDecide).toHaveBeenCalledWith({ stepId: "dispatch", decision: "approve", reason: undefined })
    expect(statusOf("dispatch")).toBe("running")
    expect(eyebrow()).toBe("Running")
    expect(statusOf("confirm")).toBe("pending")
    await run(1200)
    expect(statusOf("dispatch")).toBe("done")
    expect(step("dispatch").textContent).toContain("3 robots accepted their new routes")
    await run(200)
    expect(statusOf("confirm")).toBe("running")
    await run(10_000)
    for (const s of sampleAgentRun.steps) expect(statusOf(s.id)).toBe("done")
    expect(eyebrow()).toBe("Done")
    expect(screen.queryByRole("button", { name: "Approve and send to robots" })).toBeNull()
  })

  it("under reduced motion the steps after Approve settle at once", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }))
    render(<AgentRunGate />)
    await press("Approve and send to robots")
    expect(statusOf("dispatch")).toBe("done")
    await run(200)
    for (const s of sampleAgentRun.steps) expect(statusOf(s.id)).toBe("done")
  })

  it("Revise needs a reason, sends it back and keeps waiting: nothing is skipped and the person can still decide", async () => {
    const onDecide = vi.fn()
    render(<AgentRunGate onDecide={onDecide} />)
    await press("Revise")
    await submit()
    expect(screen.getByText("Say what to change, so the agent can propose again.")).toBeTruthy()
    type("Keep 9E37 at the door until security arrives.")
    await submit()
    expect(onDecide).toHaveBeenCalledWith({ stepId: "dispatch", decision: "revise", reason: "Keep 9E37 at the door until security arrives." })
    expect(eyebrow()).toBe("Sent back to the agent")
    expect(statusOf("dispatch")).toBe("pending")
    expect(statusOf("confirm")).toBe("pending")
    expect(step("dispatch").textContent).toContain("Sent back for changes")
    expect(screen.getByRole("button", { name: "Approve and send to robots" })).toBeTruthy()
  })

  it("keyboard: the reason box takes focus, Esc puts focus back on the button that opened it, and a decision focuses its outcome", async () => {
    render(<AgentRunGate />)
    await press("Deny")
    const box = screen.getByRole("textbox", { name: "Why deny it?" })
    expect(document.activeElement).toBe(box)
    await act(async () => void fireEvent.keyDown(box, { key: "Escape" }))
    await run(50)
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Deny" }))
    await press("Deny")
    type("Not tonight.")
    await submit()
    expect(document.activeElement).toBe(screen.getByRole("status"))
    // Every step that opens is a button (the Trace's collapsible trigger).
    expect(step("dispatch").querySelector("button[aria-expanded]")).toBeTruthy()
  })

  it("a gate past its expiry has no buttons and says nothing changed", () => {
    const expired: AgentRun = {
      ...sampleAgentRun,
      steps: sampleAgentRun.steps.map((s) => (s.approval ? { ...s, approval: { ...s.approval, expiresInMin: 0 } } : s)),
    }
    render(<AgentRunGateContent run={expired} />)
    expect(eyebrow()).toBe("Approval expired")
    expect(screen.queryByRole("button", { name: "Approve and send to robots" })).toBeNull()
    expect(screen.getByText("Expired at 22:23. Nothing changed; the agent can propose again.")).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Reroute around door C3", level: 2 })).toBeTruthy()
  })
})
