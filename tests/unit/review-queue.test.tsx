import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ReviewQueue, sampleItems } from "@/registry/syncrobotic/blocks/review-queue"

afterEach(cleanup)

const key = (k: string, init: KeyboardEventInit = {}) => act(() => void window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init })))
const items = sampleItems.slice(0, 3)

describe("ReviewQueue", () => {
  it("answers by key, moves on, goes back with Esc and undoes with Backspace or mod+z", () => {
    const onAnswer = vi.fn()
    render(<ReviewQueue items={items} defaultAnswers={{}} onAnswer={onAnswer} />)
    expect(screen.getByText("1 of 3")).toBeTruthy()
    key("1")
    expect(onAnswer).toHaveBeenLastCalledWith("f1", "yes")
    expect(screen.getByText("2 of 3")).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe("Yes. 2 of 3.")
    key("2")
    expect(screen.getByText("3 of 3")).toBeTruthy()
    key("Escape")
    expect(screen.getByText("2 of 3")).toBeTruthy()
    expect(screen.getByText("Answered No. Press a key to change it.")).toBeTruthy()
    key("Backspace")
    expect(onAnswer).toHaveBeenLastCalledWith("f2", undefined)
    expect(screen.getByText("1 answered")).toBeTruthy()
    key("z", { ctrlKey: true })
    expect(onAnswer).toHaveBeenLastCalledWith("f1", undefined)
    expect(screen.getByText("1 of 3")).toBeTruthy()
    expect(screen.getByText("0 answered")).toBeTruthy()
  })
  it("answers by touch with 44 px buttons that name their key", () => {
    render(<ReviewQueue items={items} defaultAnswers={{}} />)
    const skip = screen.getByRole("button", { name: "3 Skip" })
    expect(skip.getAttribute("aria-keyshortcuts")).toBe("3")
    expect(skip.className).toContain("h-(--h-md)")
    fireEvent.click(skip)
    expect(screen.getByText("2 of 3")).toBeTruthy()
  })
  it("says when everything is reviewed", () => {
    render(<ReviewQueue items={items} defaultAnswers={{}} />)
    key("1")
    key("2")
    key("3")
    expect(screen.getByText("All 3 reviewed")).toBeTruthy()
    expect(screen.getByText("1 yes · 1 no · 1 skip")).toBeTruthy()
  })
  it("opens the shortcuts with ? and stops answering while it is open", () => {
    render(<ReviewQueue items={items} defaultAnswers={{}} />)
    key("?", { shiftKey: true })
    expect(screen.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeTruthy()
    key("1")
    expect(screen.getByText("1 of 3")).toBeTruthy()
  })
})
