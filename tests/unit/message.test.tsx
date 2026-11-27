import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { messageLabels, messageMetaLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Message, MessageMeta } from "@/registry/syncrobotic/ui/message"

afterEach(cleanup)

const status = (el: HTMLElement) => el.querySelector("[data-slot=message-status]")!

describe("Message", () => {
  it("is an article named by its role word, name and time", () => {
    render(
      <>
        <Message role="user" name="Kai Chen" time="14:02" dateTime="2026-11-26T14:02:00Z">
          <p>Which robots are free?</p>
        </Message>
        <Message role="assistant" time="14:02">
          <p>Two.</p>
        </Message>
        <Message role="tool" name="robots.list">
          <p>14 robots</p>
        </Message>
      </>,
    )
    expect(screen.getByRole("article", { name: "You, Kai Chen, 14:02" })).toBeTruthy()
    expect(screen.getByRole("article", { name: "Assistant, 14:02" })).toBeTruthy()
    expect(screen.getByRole("article", { name: "Tool, robots.list" })).toBeTruthy()
    // The role word is written in the header, not only in the name: never colour or alignment alone.
    expect(screen.getByText("Assistant").getAttribute("data-slot")).toBe("message-role")
    expect(document.querySelector("time")!.getAttribute("dateTime")).toBe("2026-11-26T14:02:00Z")
  })

  it("is aria-busy only while streaming", () => {
    const { rerender } = render(<Message role="assistant" status="streaming">…</Message>)
    const article = screen.getByRole("article")
    expect(article.getAttribute("aria-busy")).toBe("true")
    rerender(<Message role="assistant">Done.</Message>)
    expect(article.getAttribute("aria-busy")).toBeNull()
  })

  it("says Failed in words with the error, in a live region, and offers Try again to the keyboard", () => {
    const onRetry = vi.fn()
    const { rerender } = render(<Message role="user">Hello</Message>)
    const article = screen.getByRole("article")
    // The region is there before anything goes wrong, so the change is said once.
    expect(status(article).getAttribute("role")).toBe("status")
    expect(status(article).textContent).toBe("")
    rerender(
      <Message role="user" status="error" error="No connection" onRetry={onRetry}>
        Hello
      </Message>,
    )
    expect(status(article).textContent).toContain("Failed · No connection")
    const retry = screen.getByRole("button", { name: "Try again" })
    retry.focus()
    expect(document.activeElement).toBe(retry)
    fireEvent.click(retry)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("says Stopped with its glyph, in grey", () => {
    render(<Message role="tool" status="stopped">Re-indexing</Message>)
    const words = status(screen.getByRole("article"))
    expect(words.textContent).toBe("Stopped")
    expect(words.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true")
    expect(words.innerHTML).not.toContain("text-danger")
  })

  it("keeps the header for screen readers on a continued turn, and hides the avatar from them", () => {
    render(
      <Message role="assistant" time="14:03" continued avatar={<span>AI</span>}>
        More
      </Message>,
    )
    const header = document.querySelector("[data-slot=message-header]")!
    expect(header.className).toContain("sr-only")
    expect(header.textContent).toContain("Assistant")
    expect(screen.getByText("AI").parentElement!.getAttribute("aria-hidden")).toBe("true")
  })

  it("gives a person's turn a quiet surface and moves it to the end only on a wide container", () => {
    render(
      <Message role="user" align="end">
        Hi
      </Message>,
    )
    const article = screen.getByRole("article")
    expect(article.className).toContain("@2xl:self-end")
    expect(article.className).not.toMatch(/(^|\s)self-end/)
    expect(document.querySelector("[data-slot=message-body]")!.className).toContain("bg-muted")
  })

  it("translates every word", () => {
    render(
      <Message role="assistant" name="車隊助理" time="14:02" status="error" onRetry={() => {}} labels={messageLabels}>
        …
      </Message>,
    )
    expect(screen.getByRole("article", { name: "助理，車隊助理，14:02" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "重試" })).toBeTruthy()
  })
})

describe("MessageMeta", () => {
  it("writes the facts it has, numbers through format-number, in a locale", () => {
    const { rerender, container } = render(<MessageMeta model="Large" durationMs={2400} tokens={1204} />)
    expect(container.textContent).toBe("Large · 2.4 s · 1,204 tokens")
    rerender(<MessageMeta tokens={1} />)
    expect(container.textContent).toBe("1 token")
    rerender(<MessageMeta />)
    expect(container.textContent).toBe("")
    rerender(<MessageMeta model="Large" durationMs={72_000} tokens={12_040} locale="zh-TW" labels={messageMetaLabels} />)
    expect(container.textContent).toContain("1 分 12 秒")
    expect(container.textContent).toContain("12,040 個 token")
  })
})
