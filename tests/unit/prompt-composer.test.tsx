import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { promptComposerLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { PromptComposer, isComposingEnter } from "@/registry/syncrobotic/ui/prompt-composer"

afterEach(cleanup)

const box = () => screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement
const type = (text: string) => fireEvent.change(box(), { target: { value: text } })
const enter = (init: Record<string, unknown> = {}) => fireEvent.keyDown(box(), { key: "Enter", ...init })
const send = () => document.querySelector("[data-slot=prompt-composer-send]") as HTMLButtonElement
const hint = () => document.querySelector("[data-slot=prompt-composer-hint]")!.textContent
const describedBy = (el: Element) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent)
    .join(" | ")

describe("PromptComposer", () => {
  it("is a real form around a named text box that says how Enter works", () => {
    render(<PromptComposer onSubmit={() => {}} />)
    expect(box().closest("form")).toBeTruthy()
    expect(box().getAttribute("enterkeyhint")).toBe("send")
    expect(describedBy(box())).toContain("Enter sends, Shift+Enter starts a new line")
    expect(send().getAttribute("type")).toBe("submit")
  })

  it("sends the trimmed text on Enter and clears the box; Shift+Enter does not send", () => {
    const onSubmit = vi.fn()
    render(<PromptComposer onSubmit={onSubmit} />)
    type("  Which robots are free?  ")
    enter({ shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
    enter()
    expect(onSubmit).toHaveBeenCalledWith("Which robots are free?", [])
    expect(box().value).toBe("")
  })

  it("never sends on the Enter that ends an input method's composition", () => {
    const onSubmit = vi.fn()
    render(<PromptComposer onSubmit={onSubmit} />)
    type("今晚")
    // Chrome and Firefox: the Enter that picks the characters is still composing.
    enter({ isComposing: true })
    // Safari: compositionend comes first, then a keydown with keyCode 229.
    enter({ keyCode: 229 })
    // Between compositionstart and compositionend, whatever the event says.
    fireEvent.compositionStart(box())
    enter()
    fireEvent.compositionEnd(box())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(box().value).toBe("今晚")
    enter()
    expect(onSubmit).toHaveBeenCalledWith("今晚", [])
    expect(isComposingEnter({ isComposing: false, keyCode: 229 })).toBe(true)
    expect(isComposingEnter({ isComposing: false, keyCode: 13 })).toBe(false)
  })

  it("keeps the draft when onSubmit returns false", () => {
    render(<PromptComposer onSubmit={() => false} />)
    type("Keep me")
    enter()
    expect(box().value).toBe("Keep me")
  })

  it("says why Send waits when nothing is written, and keeps it focusable", () => {
    const onSubmit = vi.fn()
    render(<PromptComposer onSubmit={onSubmit} />)
    expect(send().getAttribute("aria-disabled")).toBe("true")
    expect(send().hasAttribute("disabled")).toBe(false)
    expect(describedBy(send())).toBe("Write a message or attach a file to send")
    send().focus()
    fireEvent.click(send())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(send())
    expect(hint()).toContain("Write a message or attach a file to send")
    expect(document.querySelector("[data-slot=prompt-composer-hint] [role=status]")).toBeTruthy()
    type("x")
    expect(hint()).not.toContain("Write a message")
  })

  it("turns Send into Stop in place while the answer streams: same button, focus kept, Enter does not send", () => {
    const onSubmit = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(<PromptComposer onSubmit={onSubmit} onStop={onStop} />)
    type("First")
    const button = send()
    button.focus()
    fireEvent.click(button)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    rerender(<PromptComposer onSubmit={onSubmit} onStop={onStop} streaming />)
    expect(send()).toBe(button)
    expect(document.activeElement).toBe(button)
    expect(button.getAttribute("aria-label")).toBe("Stop generating")
    expect(button.getAttribute("type")).toBe("button")
    expect(button.getAttribute("aria-disabled")).toBeNull()
    fireEvent.click(button)
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    type("Second")
    enter()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(hint()).toContain("Wait for the answer to finish, or stop it")
    rerender(<PromptComposer onSubmit={onSubmit} onStop={onStop} />)
    expect(send()).toBe(button)
    expect(document.activeElement).toBe(button)
    expect(button.getAttribute("aria-label")).toBe("Send")
    enter()
    expect(onSubmit).toHaveBeenLastCalledWith("Second", [])
  })

  it("counts toward maxLength and waits past it, in words, cutting nothing", () => {
    const onSubmit = vi.fn()
    render(<PromptComposer onSubmit={onSubmit} maxLength={10} />)
    type("12345")
    expect(hint()).toContain("5 / 10")
    type("123456789012")
    expect(box().value).toBe("123456789012")
    expect(box().getAttribute("aria-invalid")).toBe("true")
    expect(hint()).toContain("2 characters over the 10 limit")
    expect(describedBy(box())).toContain("2 characters over the 10 limit")
    enter()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(send().getAttribute("aria-disabled")).toBe("true")
  })

  it("says why it is disabled", () => {
    render(<PromptComposer onSubmit={() => {}} disabled disabledReason="The assistant is offline" />)
    expect(box().disabled).toBe(true)
    expect(hint()).toContain("The assistant is offline")
    expect(describedBy(box())).toContain("The assistant is offline")
  })

  it("takes files, names the ones it refuses, sends them with the text and empties the tray", () => {
    const onSubmit = vi.fn()
    const onReject = vi.fn()
    render(<PromptComposer onSubmit={onSubmit} onReject={onReject} allowFiles accept="image/*" maxSize={1000} />)
    const picker = document.querySelector("[data-slot=prompt-composer-picker]") as HTMLInputElement
    const frame = new File(["x"], "frame.jpg", { type: "image/jpeg" })
    const log = new File(["x"], "robot.log", { type: "text/plain" })
    const big = new File([new Uint8Array(2000)], "big.png", { type: "image/png" })
    fireEvent.change(picker, { target: { files: [frame, log, big] } })
    expect(onReject).toHaveBeenCalledWith([
      { file: log, reason: "type" },
      { file: big, reason: "size" },
    ])
    expect(hint()).toContain("robot.log: not a type this accepts")
    expect(hint()).toContain("big.png: too large")
    expect(screen.getByRole("list", { name: "Attached files" }).textContent).toContain("frame")
    // A file alone can be sent.
    expect(send().getAttribute("aria-disabled")).toBeNull()
    const pasted = new File(["y"], "paste.png", { type: "image/png" })
    fireEvent.paste(box(), { clipboardData: { files: [pasted] } })
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    enter()
    expect(onSubmit).toHaveBeenCalledWith("", [frame, pasted])
    expect(screen.queryByRole("list", { name: "Attached files" })).toBeNull()
  })

  it("sends focus back to the text when a file is removed", () => {
    render(<PromptComposer onSubmit={() => {}} allowFiles defaultFiles={[new File(["x"], "frame.jpg", { type: "image/jpeg" })]} />)
    const remove = screen.getByRole("button", { name: "Remove frame.jpg" })
    remove.focus()
    fireEvent.click(remove)
    expect(screen.queryByRole("button", { name: "Remove frame.jpg" })).toBeNull()
    expect(document.activeElement).toBe(box())
  })

  it("translates every word, the chips' too", () => {
    render(<PromptComposer onSubmit={() => {}} allowFiles maxLength={4000} labels={promptComposerLabels} locale="zh-TW" defaultFiles={[new File(["x"], "a.jpg")]} />)
    expect(screen.getByRole("textbox", { name: "訊息" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "送出" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "附加檔案" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "移除 a.jpg" })).toBeTruthy()
    expect(hint()).toContain("0 / 4,000")
  })
})
