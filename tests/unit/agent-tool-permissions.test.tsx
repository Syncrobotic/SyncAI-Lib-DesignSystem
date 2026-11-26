import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AgentToolPermissions, AgentToolPermissionsContent, sampleToolCalls } from "@/registry/syncrobotic/blocks/agent-tool-permissions"

afterEach(cleanup)

const policy = (tool: string, agent: string) => screen.getByRole("radiogroup", { name: `${tool}, ${agent}` })
const segment = (tool: string, agent: string, word: string) => within(policy(tool, agent)).getByRole("radio", { name: word })
const pressed = (tool: string, agent: string) =>
  within(policy(tool, agent))
    .getAllByRole("radio")
    .find((r) => r.getAttribute("aria-checked") === "true")?.textContent
const status = () => screen.getAllByRole("status")[0]!.textContent

describe("AgentToolPermissions", () => {
  it("a tool that moves a robot cannot be set to Auto, and says why in words", async () => {
    render(<AgentToolPermissions />)
    const auto = segment("Send robot to a place", "Route planner", "Auto")
    expect(auto).toHaveProperty("disabled", true)
    await act(async () => fireEvent.click(auto))
    expect(pressed("Send robot to a place", "Route planner")).toBe("Ask")
    expect(status()).toBe("No unsaved changes")
    // The reason is read with the control.
    const describedBy = policy("Send robot to a place", "Route planner").getAttribute("aria-describedby")!
    expect(document.getElementById(describedBy)!.textContent).toMatch(/a person approves every call\. Auto is not available/)
  })

  it("a robot-moving tool saved as Auto is read as Ask", () => {
    render(<AgentToolPermissionsContent defaultPolicies={{ "route-planner": { "send-robot": "auto" } }} />)
    expect(pressed("Send robot to a place", "Route planner")).toBe("Ask")
  })

  it("counts unsaved changes, and Discard restores the saved policies", async () => {
    render(<AgentToolPermissions />)
    await act(async () => fireEvent.click(segment("Read schedule", "Route planner", "Blocked")))
    await act(async () => fireEvent.click(segment("Pause a robot", "Fleet assistant", "Ask")))
    expect(status()).toBe("2 unsaved changes")
    expect(screen.getAllByText(/not saved yet/)).toHaveLength(2)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Discard" })))
    expect(status()).toBe("No unsaved changes")
    expect(pressed("Read schedule", "Route planner")).toBe("Auto")
    expect(pressed("Pause a robot", "Fleet assistant")).toBe("Blocked")
    expect(screen.getByRole("button", { name: "Save changes" })).toHaveProperty("disabled", true)
  })

  it("tightening saves at once, without asking", async () => {
    const onSave = vi.fn()
    render(<AgentToolPermissionsContent onSave={onSave} />)
    await act(async () => fireEvent.click(segment("Read schedule", "Route planner", "Ask")))
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save changes" })))
    expect(screen.queryByRole("alertdialog")).toBeNull()
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0]![0]["route-planner"]["read-schedule"]).toBe("ask")
    expect(status()).toBe("Changes saved")
  })

  it("loosening a policy asks for the password before it saves", async () => {
    const onSave = vi.fn()
    render(<AgentToolPermissionsContent onSave={onSave} />)
    await act(async () => fireEvent.click(segment("Send robot to a place", "Fleet assistant", "Ask")))
    await act(async () => fireEvent.click(segment("Read camera frame", "Fleet assistant", "Auto")))
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save changes" })))
    const dialog = screen.getByRole("alertdialog", { name: "Loosen 2 policies?" })
    const list = within(dialog).getByRole("list", { name: "Policies that loosen" })
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Fleet assistant, Read camera frame: Ask →to Auto",
      "Fleet assistant, Send robot to a place: Blocked →to Ask",
    ])
    // No password, no save.
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: "Confirm and save" })))
    expect(onSave).not.toHaveBeenCalled()
    expect(within(dialog).getByText("Enter your password to loosen these policies.")).toBeTruthy()
    fireEvent.change(within(dialog).getByLabelText("Your password"), { target: { value: "correct horse" } })
    await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: "Confirm and save" })))
    expect(onSave).toHaveBeenCalledOnce()
    expect(onSave.mock.calls[0]![1]).toHaveLength(2)
    expect(screen.queryByRole("alertdialog")).toBeNull()
    expect(status()).toBe("Changes saved")
  })

  it("cancelling the confirmation keeps the changes unsaved", async () => {
    const onSave = vi.fn()
    render(<AgentToolPermissionsContent onSave={onSave} />)
    await act(async () => fireEvent.click(segment("Pause a robot", "Fleet assistant", "Ask")))
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save changes" })))
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Keep them as they are" })))
    expect(onSave).not.toHaveBeenCalled()
    expect(status()).toBe("1 unsaved change")
  })

  it("is operated from the keyboard: arrows move between policies and skip the unavailable Auto", async () => {
    const user = userEvent.setup()
    render(<AgentToolPermissionsContent />)
    // A free tool: from Auto, the arrow reaches Ask and Space chooses it.
    segment("Read schedule", "Route planner", "Auto").focus()
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(segment("Read schedule", "Route planner", "Ask"))
    await user.keyboard(" ")
    expect(pressed("Read schedule", "Route planner")).toBe("Ask")
    // A robot-moving tool: from Ask, the arrows go round Blocked and back to Ask, never onto Auto.
    segment("Send robot to a place", "Route planner", "Ask").focus()
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(segment("Send robot to a place", "Route planner", "Blocked"))
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(segment("Send robot to a place", "Route planner", "Ask"))
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(segment("Send robot to a place", "Route planner", "Blocked"))
  })
})

describe("the call audit", () => {
  const table = () => screen.getByRole("table", { name: "Recent tool calls" })
  const rows = () => within(table()).getAllByRole("row").slice(1)

  it("lists each call with its arguments and result in words", () => {
    render(<AgentToolPermissionsContent />)
    expect(rows()).toHaveLength(sampleToolCalls.length)
    const first = rows()[0]!
    expect(first.textContent).toContain("Send robot to a place")
    expect(first.querySelector("code")!.textContent).toBe("robot=9E37 to=dock-2")
    expect(first.textContent).toContain("Approved by Kai Chen")
    expect(screen.getAllByText("Blocked by policy").length).toBeGreaterThan(0)
  })

  it("narrows by agent, and says so when an agent has made no calls", async () => {
    const user = userEvent.setup()
    render(<AgentToolPermissionsContent />)
    await user.click(screen.getByRole("combobox", { name: "Agent" }))
    await user.click(screen.getByRole("option", { name: "Fleet assistant" }))
    expect(rows().every((r) => r.textContent!.includes("Fleet assistant"))).toBe(true)
    expect(rows()).toHaveLength(sampleToolCalls.filter((c) => c.agentId === "fleet-assistant").length)
    expect(screen.getByText(`5 of ${sampleToolCalls.length} calls`)).toBeTruthy()

    await user.click(screen.getByRole("combobox", { name: "Agent" }))
    await user.click(screen.getByRole("option", { name: "Incident writer" }))
    expect(screen.getAllByText("No calls from Incident writer").length).toBeGreaterThan(0)
  })
})
