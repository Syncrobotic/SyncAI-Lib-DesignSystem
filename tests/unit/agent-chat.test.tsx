import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AgentChat, AgentChatContent, AgentChatSheet, sampleAgentChatSuggestions, sampleAgentChatTurns } from "@/registry/syncrobotic/blocks/agent-chat"

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const box = () => screen.getByRole("textbox", { name: "Message the assistant" }) as HTMLTextAreaElement
const ask = (text: string) => {
  fireEvent.change(box(), { target: { value: text } })
  fireEvent.keyDown(box(), { key: "Enter" })
}
const turns = (role: string) => Array.from(document.querySelectorAll(`[data-slot=message][data-role=${role}]`))
const lastAnswer = () => turns("assistant").at(-1)!
const words = () => lastAnswer().querySelector("[data-slot=streaming-text-words]")!.textContent
const run = (ms: number) => act(async () => void vi.advanceTimersByTime(ms))

describe("AgentChat", () => {
  it("starts from the sample conversation: a tool turn, cited answers and a proposal a person approves", () => {
    render(<AgentChat />)
    expect(turns("user")).toHaveLength(sampleAgentChatTurns.filter((t) => t.role === "user").length)
    expect(turns("tool")).toHaveLength(1)
    expect(screen.getAllByRole("heading", { name: "Sources", level: 2 }).length).toBeGreaterThan(0)
    // The assistant never moves a robot itself: it points to the proposal.
    expect(screen.getByRole("link", { name: "Review proposal" }).getAttribute("href")).toContain("#agents/approvals")
    expect(screen.getByText("Needs approval")).toBeTruthy()
  })

  it("sending a prompt adds the person's turn and an answer that streams, then settles with its facts and actions", async () => {
    render(<AgentChat />)
    const before = turns("user").length
    ask("Which robots need a battery check?")
    expect(turns("user")).toHaveLength(before + 1)
    expect(turns("user").at(-1)!.textContent).toContain("Which robots need a battery check?")
    expect(lastAnswer().getAttribute("aria-busy")).toBe("true")
    // While it streams, Send is Stop.
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeTruthy()
    await run(10_000)
    expect(lastAnswer().getAttribute("aria-busy")).toBeNull()
    expect(words()).toMatch(/^Done in/)
    expect(lastAnswer().textContent).toContain("Patrol dog 9E37")
    expect(within(lastAnswer() as HTMLElement).getByRole("group", { name: "Answer actions" })).toBeTruthy()
    expect(lastAnswer().querySelector("[data-slot=message-meta]")!.textContent).toContain("tokens")
    expect(screen.getByRole("button", { name: "Send" })).toBeTruthy()
  })

  it("Stop aborts the stream: the answer ends Stopped with the words so far, and no timer is left", async () => {
    render(<AgentChat />)
    ask("Who can cover the loading bay tonight?")
    await run(600)
    const partial = lastAnswer().querySelector("[data-slot=streaming-text-body]")!.textContent!
    expect(partial.length).toBeGreaterThan(0)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Stop generating" })))
    expect(lastAnswer().getAttribute("data-status")).toBeNull()
    expect(words()).toMatch(/^Stopped after/)
    await run(10_000)
    expect(lastAnswer().querySelector("[data-slot=streaming-text-body]")!.textContent).toBe(partial)
    expect(screen.getByRole("button", { name: "Send" })).toBeTruthy()
  })

  it("a suggested prompt chip sends it and leaves focus in the composer", async () => {
    render(<AgentChat defaultTurns={[]} />)
    expect(turns("user")).toHaveLength(0)
    const chips = within(screen.getByRole("list", { name: "Suggested questions" })).getAllByRole("button")
    expect(chips.map((c) => c.textContent)).toEqual(sampleAgentChatSuggestions)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Summarise tonight's alarms" })))
    expect(turns("user")).toHaveLength(1)
    expect(turns("user")[0].textContent).toContain("Summarise tonight's alarms")
    expect(document.activeElement).toBe(box())
    await run(10_000)
    expect(words()).toMatch(/^Done in/)
  })

  it("New conversation clears the turns to the suggested prompts", async () => {
    render(<AgentChat />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "New conversation" })))
    expect(turns("user")).toHaveLength(0)
    expect(screen.getByRole("list", { name: "Suggested questions" })).toBeTruthy()
  })

  it("leaves no timer running after unmount", async () => {
    const { unmount } = render(<AgentChatContent defaultTurns={[]} />)
    ask("Summarise tonight's alarms")
    await run(500)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("AgentChatSheet", () => {
  it("opens from the page's top bar and puts the cursor in the composer", async () => {
    render(<AgentChatSheet />)
    expect(screen.queryByRole("dialog")).toBeNull()
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Ask the assistant" })))
    const dialog = screen.getByRole("dialog", { name: "Fleet assistant" })
    expect(document.activeElement).toBe(within(dialog).getByRole("textbox", { name: "Message the assistant" }))
    // In the sheet, the sources sit under its h2 title.
    expect(within(dialog).getAllByRole("heading", { name: "Sources", level: 3 }).length).toBeGreaterThan(0)
  })
})
