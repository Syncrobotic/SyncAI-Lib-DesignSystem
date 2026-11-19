import { act, cleanup, render, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { matchesCombo, parseCombo, useHotkeys } from "@/registry/syncrobotic/hooks/use-hotkeys"

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] }))
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = window) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init })
  act(() => void target.dispatchEvent(event))
  return event
}
const release = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true })))
const ev = (key: string, init: KeyboardEventInit = {}) => new KeyboardEvent("keydown", { key, ...init })

describe("parseCombo and matchesCombo", () => {
  it("reads modifiers, aliases and the plus key", () => {
    expect(parseCombo("Mod+Shift+Z")).toMatchObject({ key: "z", mod: true, shift: true, ctrl: false })
    expect(parseCombo("Esc").key).toBe("escape")
    expect(parseCombo("space").key).toBe(" ")
    expect(parseCombo("mod++")).toMatchObject({ key: "+", mod: true })
  })
  it("mod is Ctrl elsewhere and ⌘ on Mac", () => {
    expect(matchesCombo(ev("k", { ctrlKey: true }), "mod+k", false)).toBe(true)
    expect(matchesCombo(ev("k", { metaKey: true }), "mod+k", false)).toBe(false)
    expect(matchesCombo(ev("k", { metaKey: true }), "mod+k", true)).toBe(true)
    expect(matchesCombo(ev("k", { ctrlKey: true }), "mod+k", true)).toBe(false)
  })
  it("needs the exact modifiers for letters, so undo never fires on redo", () => {
    expect(matchesCombo(ev("z", { ctrlKey: true, shiftKey: true }), "mod+z", false)).toBe(false)
    expect(matchesCombo(ev("Z", { ctrlKey: true, shiftKey: true }), "mod+shift+z", false)).toBe(true)
    expect(matchesCombo(ev("k", { ctrlKey: true }), "k", false)).toBe(false)
  })
  it("matches a symbol whatever Shift it took", () => {
    expect(matchesCombo(ev("?", { shiftKey: true }), "?", false)).toBe(true)
  })
  it("falls back to the physical key when Option changes the character", () => {
    expect(matchesCombo(ev("˚", { altKey: true, code: "KeyK" }), "alt+k", true)).toBe(true)
  })
})

describe("useHotkeys", () => {
  it("calls the handler for its key and stops the browser's own action", () => {
    const yes = vi.fn()
    const no = vi.fn()
    renderHook(() => useHotkeys({ "1": yes, "2": no }))
    const e = press("1")
    expect(yes).toHaveBeenCalledTimes(1)
    expect(no).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(true)
  })
  it("supports modifiers", () => {
    const undo = vi.fn()
    renderHook(() => useHotkeys({ "mod+z": undo }))
    press("z")
    expect(undo).not.toHaveBeenCalled()
    press("z", { ctrlKey: true })
    expect(undo).toHaveBeenCalledTimes(1)
  })
  it("ignores keys typed in inputs, textareas and contenteditable, unless the key is allowed there", () => {
    const yes = vi.fn()
    const back = vi.fn()
    renderHook(() => useHotkeys({ "1": yes, Escape: { handler: back, allowInInput: true } }))
    const { container } = render(
      <div>
        <input aria-label="Note" />
        <textarea aria-label="Comment" />
        <div contentEditable suppressContentEditableWarning>
          text
        </div>
        <input type="checkbox" aria-label="Flag" />
      </div>,
    )
    const [input, textarea, editable, checkbox] = [
      container.querySelector("input")!,
      container.querySelector("textarea")!,
      container.querySelector("[contenteditable]")!,
      container.querySelector("input[type=checkbox]")!,
    ]
    // happy-dom does not compute isContentEditable from the attribute.
    Object.defineProperty(editable, "isContentEditable", { value: true })
    for (const el of [input, textarea, editable]) press("1", {}, el)
    expect(yes).not.toHaveBeenCalled()
    press("Escape", {}, input)
    expect(back).toHaveBeenCalledTimes(1)
    // A checkbox does not take text, so the shortcut works there.
    press("1", {}, checkbox)
    expect(yes).toHaveBeenCalledTimes(1)
  })
  it("does nothing while disabled, and again once enabled", () => {
    const yes = vi.fn()
    const { rerender } = renderHook(({ enabled }) => useHotkeys({ "1": yes }, { enabled }), { initialProps: { enabled: false } })
    press("1")
    expect(yes).not.toHaveBeenCalled()
    rerender({ enabled: true })
    press("1")
    expect(yes).toHaveBeenCalledTimes(1)
  })
  it("removes its listeners on unmount", () => {
    const yes = vi.fn()
    const { unmount } = renderHook(() => useHotkeys({ "1": yes }))
    unmount()
    press("1")
    expect(yes).not.toHaveBeenCalled()
  })
  it("does not repeat a held key unless asked", () => {
    const yes = vi.fn()
    const next = vi.fn()
    renderHook(() => useHotkeys({ "1": yes, ArrowRight: { handler: next, repeat: true } }))
    press("1")
    press("1", { repeat: true })
    press("ArrowRight")
    press("ArrowRight", { repeat: true })
    expect(yes).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledTimes(2)
  })
  it("leaves keys another handler already took", () => {
    const yes = vi.fn()
    renderHook(() => useHotkeys({ "1": yes }))
    const e = new KeyboardEvent("keydown", { key: "1", cancelable: true })
    e.preventDefault()
    act(() => void window.dispatchEvent(e))
    expect(yes).not.toHaveBeenCalled()
  })
  it("calls the latest handler without re-subscribing", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ fn }) => useHotkeys({ "1": fn }), { initialProps: { fn: first } })
    rerender({ fn: second })
    press("1")
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
  it("reports the pressed key, held at least long enough to be seen", () => {
    const { result } = renderHook(() => useHotkeys({ "1": () => {}, "?": () => {} }))
    expect(result.current.pressed).toBeNull()
    press("?", { shiftKey: true })
    expect(result.current.pressed).toBe("?")
    release("Shift")
    expect(result.current.pressed).toBe("?")
    act(() => void vi.advanceTimersByTime(150))
    expect(result.current.pressed).toBeNull()
  })
})
