import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { streamingTextLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { StreamingText, formatDuration, sentenceEnd, streamingTextTiming } from "@/registry/syncrobotic/ui/streaming-text"

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance", "Date"] })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const words = () => document.querySelector("[data-slot=streaming-text-words]")!
const announcer = () => document.querySelector("[data-slot=streaming-text-announcer]")?.textContent ?? null

describe("words", () => {
  it("formats durations in tenths, seconds and minutes, in a locale", () => {
    expect(formatDuration(2440)).toBe("2.4 s")
    expect(formatDuration(310)).toBe("0.3 s")
    expect(formatDuration(42_400)).toBe("42 s")
    expect(formatDuration(72_000)).toBe("1 min 12 s")
    expect(formatDuration(120_000)).toBe("2 min")
    expect(formatDuration(2440, "de-DE")).toBe("2,4 s")
    expect(streamingTextLabels.duration(72_000, "zh-TW")).toBe("1 分 12 秒")
  })

  it("takes durations over timestamps and drops what is unknown or negative", () => {
    expect(streamingTextTiming({ startedAt: 1000, firstTokenAt: 1300, finishedAt: 3400 })).toEqual({ durationMs: 2400, firstTokenMs: 300 })
    expect(streamingTextTiming({ startedAt: 1000, finishedAt: 3400, durationMs: 2000 })).toEqual({ durationMs: 2000, firstTokenMs: undefined })
    expect(streamingTextTiming({ firstTokenAt: 5 })).toEqual({ durationMs: undefined, firstTokenMs: undefined })
    expect(streamingTextTiming({ startedAt: 10, finishedAt: 5 })).toEqual({ durationMs: undefined, firstTokenMs: undefined })
  })

  it("ends a reading after the last whole sentence or line", () => {
    expect(sentenceEnd("One. Two is still")).toBe(4)
    expect(sentenceEnd("A line\nand more")).toBe(7)
    expect(sentenceEnd("充電座清楚可見。紙箱")).toBe(8)
    expect(sentenceEnd("no end yet")).toBe(0)
    expect(sentenceEnd("word ".repeat(100), 40)).toBe(500)
  })
})

describe("phases", () => {
  it("says the queue position and offers Cancel, then Stop while streaming", () => {
    const onStop = vi.fn()
    const { rerender } = render(<StreamingText text="" phase="queued" queuePosition={3} onStop={onStop} />)
    expect(words().textContent).toBe("Number 3 in the queue")
    expect(screen.getByRole("article", { name: "Answer" }).getAttribute("aria-busy")).toBe("true")
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onStop).toHaveBeenCalledTimes(1)
    rerender(<StreamingText text="" phase="queued" queuePosition={1} onStop={onStop} />)
    expect(words().textContent).toBe("Next in the queue")
    rerender(<StreamingText text="The dock" phase="streaming" onStop={onStop} />)
    expect(words().textContent).toBe("Generating")
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeTruthy()
  })

  it("says Thinking while only the reasoning streams, and keeps it apart and closed", () => {
    const { rerender } = render(<StreamingText text="" reasoning="The plate is grey." phase="streaming" />)
    expect(words().textContent).toBe("Thinking")
    const toggle = screen.getByRole("button", { name: "Reasoning" })
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(screen.queryByText("The plate is grey.")).toBeNull()
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)!.textContent).toBe("The plate is grey.")
    rerender(<StreamingText text="Mostly." reasoning="The plate is grey." phase="streaming" />)
    expect(words().textContent).toBe("Generating")
    expect(document.querySelector("[data-slot=streaming-text-body]")!.textContent).toBe("Mostly.")
  })

  it("ends with the timing in words, in place of the status", () => {
    render(<StreamingText text="Mostly clear." phase="done" startedAt={1000} firstTokenAt={1310} finishedAt={3440} />)
    expect(words().textContent).toBe("Done in 2.4 s · first token 0.3 s")
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.getByRole("article").hasAttribute("aria-busy")).toBe(false)
  })

  it("keeps a stopped answer and says it is incomplete, or that it was cancelled", () => {
    const { rerender } = render(<StreamingText text="Mostly" phase="stopped" durationMs={1150} />)
    expect(words().textContent).toBe("Stopped after 1.2 s · answer incomplete")
    expect(screen.getByText("Mostly")).toBeTruthy()
    rerender(<StreamingText text="" phase="stopped" />)
    expect(words().textContent).toBe("Cancelled before the answer started")
  })

  it("fails with the word in the danger colour, the message, the partial text and Try again", () => {
    const onRetry = vi.fn()
    render(<StreamingText text="Mostly" phase="error" error="Connection lost" onRetry={onRetry} />)
    expect(words().textContent).toBe("Failed · Connection lost · answer incomplete")
    expect(screen.getByText("Failed").className).toContain("text-danger")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("never offers Try again after Stop, so a second tap cannot start a new answer", () => {
    render(<StreamingText text="Mostly" phase="stopped" onStop={() => {}} onRetry={() => {}} />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("splits paragraphs at blank lines and keeps single line breaks", () => {
    render(<StreamingText text={"One\ntwo\n\nThree"} phase="done" />)
    const ps = document.querySelectorAll("[data-slot=streaming-text-body] p")
    expect([...ps].map((p) => p.textContent)).toEqual(["One\ntwo", "Three"])
  })

  it("takes zh-TW labels and a locale", () => {
    render(<StreamingText text="大致淨空。" phase="done" durationMs={2400} firstTokenMs={310} labels={streamingTextLabels} locale="zh-TW" />)
    expect(words().textContent).toBe("已完成，耗時 2.4 秒 · 首個 token 0.3 秒")
    expect(screen.getByRole("article", { name: "回答" })).toBeTruthy()
  })
})

describe("focus", () => {
  it("moves to the status words when Stop leaves with focus on it", () => {
    const { rerender } = render(<StreamingText text="Mostly" phase="streaming" onStop={() => {}} />)
    const stop = screen.getByRole("button", { name: "Stop generating" })
    act(() => stop.focus())
    rerender(<StreamingText text="Mostly" phase="stopped" onStop={() => {}} />)
    expect(document.activeElement).toBe(words())
  })

  it("leaves focus alone when Stop did not have it", () => {
    const { rerender } = render(
      <>
        <button>Elsewhere</button>
        <StreamingText text="Mostly" phase="streaming" onStop={() => {}} />
      </>,
    )
    const other = screen.getByRole("button", { name: "Elsewhere" })
    act(() => other.focus())
    rerender(
      <>
        <button>Elsewhere</button>
        <StreamingText text="Mostly" phase="done" onStop={() => {}} />
      </>,
    )
    expect(document.activeElement).toBe(other)
  })
})

describe("announcements", () => {
  it("reads whole sentences at most every 5 s, never token by token, and the rest at the end", () => {
    const { rerender } = render(<StreamingText text="" phase="streaming" />)
    rerender(<StreamingText text="The dock" phase="streaming" />)
    rerender(<StreamingText text="The dock is clear. A box" phase="streaming" />)
    expect(announcer()).toBe("")
    run(5000)
    expect(announcer()).toBe("The dock is clear.")
    rerender(<StreamingText text="The dock is clear. A box sits left" phase="streaming" />)
    run(5000)
    expect(announcer()).toBe("The dock is clear.")
    rerender(<StreamingText text="The dock is clear. A box sits left." phase="done" />)
    run(0)
    expect(announcer()).toBe("A box sits left.")
  })

  it("does not read an answer that mounts finished", () => {
    render(<StreamingText text="An old answer." phase="done" />)
    run(10_000)
    expect(announcer()).toBe("")
  })

  it("says only the phases with announce=status, and nothing with false", () => {
    const { rerender } = render(<StreamingText text="One. Two." phase="streaming" announce="status" />)
    expect(announcer()).toBeNull()
    expect(screen.getByRole("status").textContent).toBe("Generating")
    rerender(<StreamingText text="One. Two." phase="streaming" announce={false} />)
    expect(announcer()).toBeNull()
  })

  it("starts again when a new answer replaces the old one in place", () => {
    const { rerender } = render(<StreamingText text="First answer." phase="done" />)
    rerender(<StreamingText text="" phase="queued" />)
    rerender(<StreamingText text="New. " phase="streaming" />)
    run(5000)
    expect(announcer()).toBe("New.")
  })
})

describe('format="markdown"', () => {
  const answer = "## Dock\n\nThe **plate** is clear. A `box` sits left.\n\n- Contacts: uncovered.\n\n```bash\nros2 topic echo /dock\n```\n\nDone [1]."

  it("renders the answer with Markdown while it streams, and plain text by default", () => {
    const { container, rerender } = render(<StreamingText text={answer} phase="streaming" format="markdown" />)
    expect(container.querySelector("[data-slot=streaming-text-body] [data-slot=markdown] h3")?.textContent).toBe("Dock")
    expect(container.querySelector("strong")?.textContent).toBe("plate")
    expect(container.querySelector("[data-slot=code-block]")).toBeTruthy()
    rerender(<StreamingText text={answer} phase="done" />)
    expect(container.querySelector("[data-slot=markdown]")).toBeNull()
    expect(container.textContent).toContain("**plate**")
  })

  it("holds back what is still forming while streaming", () => {
    const { container } = render(<StreamingText text={"The **pla"} phase="streaming" format="markdown" />)
    expect(container.querySelector("[data-slot=streaming-text-body]")?.textContent).toBe("The pla")
  })

  it("reads the words in sentences, never the syntax", () => {
    const { rerender } = render(<StreamingText text="" phase="streaming" format="markdown" />)
    rerender(<StreamingText text={answer.slice(0, 50)} phase="streaming" format="markdown" />)
    run(5000)
    expect(announcer()).toBe("Dock\nThe plate is clear.")
    rerender(<StreamingText text={answer} phase="done" format="markdown" />)
    run(0)
    const said = announcer() ?? ""
    expect(said).toBe("A box sits left.\nContacts: uncovered.\nCode in bash.\nDone [1].")
    expect(said).not.toMatch(/\*\*|`|```|##/)
  })

  it("passes markdownProps to Markdown and leaves citations out of the reading", () => {
    const { rerender } = render(<StreamingText text="" phase="streaming" format="markdown" markdownProps={{ cite: (n) => <sup key={n}>{n}</sup>, headingLevel: 4 }} />)
    rerender(<StreamingText text={"# Title\n\nClear [1]. More"} phase="streaming" format="markdown" markdownProps={{ cite: (n) => <sup key={n}>{n}</sup>, headingLevel: 4 }} />)
    expect(document.querySelector("h4")?.textContent).toBe("Title")
    expect(document.querySelector("sup")?.textContent).toBe("1")
    run(5000)
    expect(announcer()).toBe("Title\nClear.")
  })
})
