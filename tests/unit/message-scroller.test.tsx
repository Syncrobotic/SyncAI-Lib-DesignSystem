import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { messageScrollerLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Message } from "@/registry/syncrobotic/ui/message"
import { MessageScroller } from "@/registry/syncrobotic/ui/message-scroller"
import { StreamingText } from "@/registry/syncrobotic/ui/streaming-text"

// The test DOM has no layout, so the viewport gets one: every turn is 100 px tall, stacked, in a 300 px window.
const ROW = 100
const VIEW = 300
const tops = new WeakMap<Element, number>()
const isViewport = (el: Element) => el.getAttribute("data-slot") === "message-scroller-viewport"
const contentOf = (el: Element) => el.querySelector("[data-slot=message-scroller-content]")
const fullHeight = (el: Element) => (contentOf(el)?.children.length ?? 0) * ROW
const saved: [string, PropertyDescriptor | undefined][] = []
const stub = (name: string, d: PropertyDescriptor) => {
  saved.push([name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)])
  Object.defineProperty(HTMLElement.prototype, name, { configurable: true, ...d })
}
beforeAll(() => {
  stub("scrollHeight", { get(this: HTMLElement) { return isViewport(this) ? Math.max(fullHeight(this), VIEW) : 0 } })
  stub("clientHeight", { get(this: HTMLElement) { return isViewport(this) ? VIEW : 0 } })
  stub("scrollTop", {
    get(this: HTMLElement) { return tops.get(this) ?? 0 },
    set(this: HTMLElement, v: number) { tops.set(this, isViewport(this) ? Math.max(0, Math.min(v, Math.max(fullHeight(this), VIEW) - VIEW)) : v) },
  })
  stub("offsetTop", {
    get(this: HTMLElement) {
      const p = this.parentElement
      return p?.getAttribute("data-slot") === "message-scroller-content" ? Array.from(p.children).indexOf(this) * ROW : 0
    },
  })
  stub("offsetHeight", { get(this: HTMLElement) { return this.parentElement?.getAttribute("data-slot") === "message-scroller-content" ? ROW : 0 } })
})
afterAll(() => {
  for (const [name, d] of saved.reverse()) {
    if (d) Object.defineProperty(HTMLElement.prototype, name, d)
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name]
  }
})

let reduce = false
beforeEach(() => {
  reduce = false
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

type T = { id: string; role: "user" | "assistant" | "tool"; text: string; busy?: boolean; stream?: boolean }
const turn = (t: T) => (
  <Message key={t.id} role={t.role} time="14:05" status={t.busy ? "streaming" : undefined}>
    {t.stream ? <StreamingText text={t.text} phase={t.busy ? "streaming" : "done"} /> : <p>{t.text}</p>}
  </Message>
)
const start: T[] = [
  { id: "1", role: "user", text: "Which robots are free?" },
  { id: "2", role: "assistant", text: "Two." },
  { id: "3", role: "user", text: "Which one first?" },
  { id: "4", role: "assistant", text: "1715." },
]
function Chat({ turns, ...props }: { turns: T[] } & Omit<React.ComponentProps<typeof MessageScroller>, "children">) {
  return <MessageScroller {...props}>{turns.map(turn)}</MessageScroller>
}

const log = () => screen.getByRole("log")
const flush = () => act(async () => {})
const said = () => document.querySelector("[data-slot=message-scroller-announcer]")!.textContent
const scrollTo = (top: number) => {
  log().scrollTop = top
  fireEvent.scroll(log())
}
const jump = () => screen.queryByRole("button", { name: /^Jump to latest/ })

describe("MessageScroller", () => {
  it("is a named log that scrolls from the keyboard and does not speak for itself", () => {
    render(<Chat turns={start} />)
    expect(log().getAttribute("aria-label")).toBe("Conversation")
    expect(log().getAttribute("aria-live")).toBe("off")
    expect(log().tabIndex).toBe(0)
    expect(screen.getAllByRole("article")).toHaveLength(4)
  })

  it("starts at the newest turn and follows the turns that arrive", async () => {
    const { rerender } = render(<Chat turns={start} />)
    expect(log().scrollTop).toBe(4 * ROW - VIEW)
    rerender(<Chat turns={[...start, { id: "5", role: "assistant", text: "Two more.", busy: true }]} />)
    await flush()
    expect(log().scrollTop).toBe(5 * ROW - VIEW)
    expect(jump()).toBeNull()
  })

  it("lets go when the reader scrolls up, keeps the view still, and counts the turns that arrive", async () => {
    const { rerender } = render(<Chat turns={start} />)
    scrollTo(0)
    expect(jump()).toBeTruthy()
    rerender(<Chat turns={[...start, { id: "5", role: "tool", text: "14 robots" }]} />)
    await flush()
    expect(log().scrollTop).toBe(0)
    expect(jump()!.getAttribute("aria-label")).toBe("Jump to latest, 1 new message")
    expect(jump()!.textContent).toContain("1 new")
    rerender(<Chat turns={[...start, { id: "5", role: "tool", text: "14 robots" }, { id: "6", role: "assistant", text: "Done." }]} />)
    await flush()
    expect(jump()!.getAttribute("aria-label")).toBe("Jump to latest, 2 new messages")
  })

  it("follows again from the bottom, or with Jump to latest, which glides and leaves focus on the log", () => {
    render(<Chat turns={start} />)
    scrollTo(0)
    scrollTo(log().scrollHeight)
    expect(jump()).toBeNull()
    scrollTo(0)
    const scrollToSpy = vi.fn()
    log().scrollTo = scrollToSpy as unknown as HTMLElement["scrollTo"]
    jump()!.focus()
    fireEvent.click(jump()!)
    expect(scrollToSpy).toHaveBeenCalledWith({ top: log().scrollHeight, behavior: "smooth" })
    expect(document.activeElement).toBe(log())
  })

  it("jumps without gliding under reduced motion", () => {
    reduce = true
    render(<Chat turns={start} />)
    scrollTo(0)
    const scrollToSpy = vi.fn()
    log().scrollTo = scrollToSpy as unknown as HTMLElement["scrollTo"]
    fireEvent.click(jump()!)
    expect(scrollToSpy).toHaveBeenCalledWith({ top: log().scrollHeight, behavior: "auto" })
  })

  it("goes back to the bottom when the reader sends a turn", async () => {
    const { rerender } = render(<Chat turns={start} />)
    scrollTo(0)
    rerender(<Chat turns={[...start, { id: "5", role: "user", text: "And tomorrow?" }]} />)
    await flush()
    expect(log().scrollTop).toBe(5 * ROW - VIEW)
  })

  it("keeps the turn in view still when older turns are put in front, and neither counts nor reads them", async () => {
    const onLoadEarlier = vi.fn()
    const { rerender } = render(<Chat turns={start} hasEarlier onLoadEarlier={onLoadEarlier} />)
    fireEvent.click(screen.getByRole("button", { name: "Load earlier messages" }))
    expect(onLoadEarlier).toHaveBeenCalledTimes(1)
    scrollTo(50)
    const older: T[] = [
      { id: "a", role: "user", text: "Yesterday?" },
      { id: "b", role: "assistant", text: "All rounds finished." },
    ]
    rerender(<Chat turns={[...older, ...start]} />)
    await flush()
    // The first turn in view moved down by two rows; so did the view.
    expect(log().scrollTop).toBe(50 + 2 * ROW)
    expect(jump()!.getAttribute("aria-label")).toBe("Jump to latest")
    expect(said()).toBe("")
  })

  it("reads a turn that arrives complete once, by name and text; never history or the reader's own", async () => {
    const { rerender } = render(<Chat turns={start} />)
    expect(said()).toBe("")
    rerender(<Chat turns={[...start, { id: "5", role: "user", text: "And tomorrow?" }]} />)
    await flush()
    expect(said()).toBe("")
    rerender(<Chat turns={[...start, { id: "5", role: "user", text: "And tomorrow?" }, { id: "6", role: "tool", text: "14 robots listed" }]} />)
    await flush()
    expect(said()).toBe("Tool, 14:05: 14 robots listed")
  })

  it("reads a streamed turn when it ends only if nothing inside it read it already", async () => {
    const busy: T = { id: "5", role: "assistant", text: "Two more robots.", busy: true }
    const { rerender } = render(<Chat turns={start} />)
    rerender(<Chat turns={[...start, busy]} />)
    await flush()
    expect(said()).toBe("")
    rerender(<Chat turns={[...start, { ...busy, busy: false }]} />)
    await flush()
    expect(said()).toBe("Assistant, 14:05: Two more robots.")
    // With StreamingText inside, the answer was read in sentences as it streamed: not again.
    const streamed: T = { id: "6", role: "assistant", text: "Done.", busy: true, stream: true }
    rerender(<Chat turns={[...start, { ...busy, busy: false }, streamed]} />)
    await flush()
    rerender(<Chat turns={[...start, { ...busy, busy: false }, { ...streamed, busy: false }]} />)
    await flush()
    expect(said()).toBe("Assistant, 14:05: Two more robots.")
  })

  it("shows the empty state with no turns, and translates every word", async () => {
    const { rerender } = render(<MessageScroller empty={<p>Ask about your fleet</p>} />)
    expect(screen.getByText("Ask about your fleet")).toBeTruthy()
    expect(jump()).toBeNull()
    rerender(<Chat turns={start} labels={messageScrollerLabels} locale="zh-TW" hasEarlier onLoadEarlier={() => {}} />)
    expect(log().getAttribute("aria-label")).toBe("對話")
    expect(screen.getByRole("button", { name: "載入較早的訊息" })).toBeTruthy()
    scrollTo(0)
    rerender(<Chat turns={[...start, { id: "5", role: "tool", text: "x" }]} labels={messageScrollerLabels} locale="zh-TW" />)
    await flush()
    expect(screen.getByRole("button", { name: "跳到最新，1 則新訊息" })).toBeTruthy()
  })
})
