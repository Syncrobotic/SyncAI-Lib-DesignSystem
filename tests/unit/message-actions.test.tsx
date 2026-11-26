import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { messageActionsLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { MessageActions } from "@/registry/syncrobotic/ui/message-actions"

afterEach(cleanup)

const reasons = [
  { value: "facts", label: "Wrong facts" },
  { value: "other", label: "Something else" },
]
const buttons = () => document.querySelector("[data-slot=message-actions-buttons]")!

describe("MessageActions", () => {
  it("shows each action only with what it needs, every icon button named", () => {
    const { rerender } = render(<MessageActions copyText="Two can." />)
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Copy"])
    rerender(<MessageActions copyText="Two can." onRegenerate={() => {}} onFeedbackChange={() => {}} />)
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Copy", "Regenerate", "Good answer", "Bad answer"])
    expect(screen.getByRole("group", { name: "Answer actions" })).toBeTruthy()
  })

  it("makes Good and Bad toggle buttons: pressed, inverted, pressed again to clear", () => {
    const onFeedbackChange = vi.fn()
    render(<MessageActions onFeedbackChange={onFeedbackChange} />)
    const good = screen.getByRole("button", { name: "Good answer" })
    const bad = screen.getByRole("button", { name: "Bad answer" })
    expect(good.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(good)
    expect(good.getAttribute("aria-pressed")).toBe("true")
    expect(bad.getAttribute("aria-pressed")).toBe("false")
    expect(good.className).toContain("aria-pressed:bg-primary")
    fireEvent.click(bad)
    expect(good.getAttribute("aria-pressed")).toBe("false")
    expect(bad.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(bad)
    expect(bad.getAttribute("aria-pressed")).toBe("false")
    expect(onFeedbackChange.mock.calls).toEqual([["good"], ["bad"], [null]])
  })

  it("asks what was wrong after Bad, and forgets the reason when Bad is released", () => {
    const onReasonChange = vi.fn()
    render(<MessageActions onFeedbackChange={() => {}} reasons={reasons} onReasonChange={onReasonChange} />)
    expect(screen.queryByRole("radiogroup", { name: "What was wrong?" })).toBeNull()
    const bad = screen.getByRole("button", { name: "Bad answer" })
    fireEvent.click(bad)
    expect(screen.getByRole("radiogroup", { name: "What was wrong?" })).toBeTruthy()
    expect(bad.getAttribute("aria-controls")).toBe(document.querySelector("[data-slot=message-actions-reasons]")!.id)
    fireEvent.click(screen.getByRole("radio", { name: "Wrong facts" }))
    expect(onReasonChange).toHaveBeenLastCalledWith("facts")
    fireEvent.click(screen.getByRole("button", { name: "Good answer" }))
    expect(onReasonChange).toHaveBeenLastCalledWith(undefined)
    expect(screen.queryByRole("radiogroup", { name: "What was wrong?" })).toBeNull()
  })

  it("switches versions; the ends stay focusable and do nothing, and the position is said", () => {
    const onVersionChange = vi.fn()
    const { rerender } = render(<MessageActions version={1} versions={3} onVersionChange={onVersionChange} />)
    const previous = screen.getByRole("button", { name: "Previous version" })
    const next = screen.getByRole("button", { name: "Next version" })
    expect(screen.getByRole("group", { name: "Versions" }).textContent).toContain("1 / 3")
    expect(document.querySelector("[aria-live=polite]")!.textContent).toBe("Version 1 of 3")
    expect(previous.getAttribute("aria-disabled")).toBe("true")
    expect(previous.hasAttribute("disabled")).toBe(false)
    previous.focus()
    fireEvent.click(previous)
    expect(onVersionChange).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(previous)
    fireEvent.click(next)
    expect(onVersionChange).toHaveBeenCalledWith(2)
    rerender(<MessageActions version={3} versions={3} onVersionChange={onVersionChange} />)
    expect(next.getAttribute("aria-disabled")).toBe("true")
    expect(previous.getAttribute("aria-disabled")).toBeNull()
    // One version: no switcher.
    rerender(<MessageActions version={1} versions={1} onVersionChange={onVersionChange} />)
    expect(screen.queryByRole("group", { name: "Versions" })).toBeNull()
  })

  it("is quiet only with a fine pointer and no touch, never once feedback is given, and never out of the Tab order", () => {
    const { rerender } = render(<MessageActions copyText="x" onFeedbackChange={() => {}} />)
    expect(buttons().className).toContain("[@media(pointer:fine)_and_(not_(any-pointer:coarse))]:")
    expect(buttons().className).toContain("not-group-focus-within/message:not-hover:not-focus-within:opacity-0")
    for (const b of screen.getAllByRole("button")) expect(b.getAttribute("tabindex")).toBeNull()
    rerender(<MessageActions copyText="x" feedback="good" onFeedbackChange={() => {}} />)
    expect(buttons().className).not.toContain("opacity-0")
    rerender(<MessageActions copyText="x" onFeedbackChange={() => {}} quiet={false} />)
    expect(buttons().className).not.toContain("opacity-0")
  })

  it("translates every word", () => {
    render(<MessageActions copyText="x" onRegenerate={() => {}} onFeedbackChange={() => {}} version={2} versions={3} labels={messageActionsLabels} locale="zh-TW" />)
    expect(screen.getByRole("button", { name: "重新生成" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "回答不佳" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "複製" })).toBeTruthy()
    expect(document.querySelector("[aria-live=polite]")!.textContent).toBe("第 2 個版本，共 3 個")
  })
})
