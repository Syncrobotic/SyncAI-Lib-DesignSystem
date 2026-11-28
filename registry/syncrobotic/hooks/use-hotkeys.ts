// @syncrobotic/use-hotkeys v0.58.0 · update: npx shadcn add @syncrobotic/use-hotkeys --overwrite
"use client"

import * as React from "react"

export type HotkeyHandler = (event: KeyboardEvent) => void

/** A handler, or a handler with options for that key. */
export type HotkeyBinding =
  | HotkeyHandler
  | {
      handler: HotkeyHandler
      /** Also while focus is in a text field (Escape to leave it, mod+s to save). Off by default. */
      allowInInput?: boolean
      /** Fire again while the key is held. Off by default, so holding 1 answers once. */
      repeat?: boolean
      /** Stop the browser's own action (mod+z undoing text, Backspace, ? typing). On by default. */
      preventDefault?: boolean
    }

/**
 * Keys to handlers: { "1": yes, "2": no, "Escape": back, "?": help, "mod+z": undo }. A key is a KeyboardEvent.key
 * ("a", "1", "?", "Escape", "ArrowLeft", "Space"), optionally after modifiers joined by "+": mod (⌘ on Mac, Ctrl
 * elsewhere), ctrl, meta (cmd), alt (option), shift. Case does not matter.
 */
export type HotkeyMap = Record<string, HotkeyBinding>

export type UseHotkeysOptions = {
  /** Off while a dialog is open, a step is busy, or the view is hidden. On by default. */
  enabled?: boolean
  /** How long `pressed` stays set after a quick tap, so the key cap is seen to go down. Default 150 ms. */
  pressedFor?: number
}

type Combo = { key: string; mod: boolean; ctrl: boolean; meta: boolean; alt: boolean; shift: boolean }

const ALIASES: Record<string, string> = { esc: "escape", space: " ", spacebar: " ", return: "enter", del: "delete", up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright", plus: "+" }

/** "mod+shift+z" → its parts. A trailing "+" is the plus key ("mod++"). */
export function parseCombo(combo: string): Combo {
  const parts = combo.toLowerCase().split("+")
  // "mod++" splits into ["mod", "", ""]; "+" alone into ["", ""].
  let key = parts.pop() ?? ""
  if (key === "" && parts[parts.length - 1] === "") {
    parts.pop()
    key = "+"
  }
  const has = (...names: string[]) => parts.some((p) => names.includes(p))
  return {
    key: ALIASES[key] ?? key,
    mod: has("mod"),
    ctrl: has("ctrl", "control"),
    meta: has("meta", "cmd", "command"),
    alt: has("alt", "option"),
    shift: has("shift"),
  }
}

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

/** Whether a key event is this combo. */
export function matchesCombo(event: KeyboardEvent, combo: string | Combo, mac = isMac()) {
  const c = typeof combo === "string" ? parseCombo(combo) : combo
  const wantCtrl = c.ctrl || (c.mod && !mac)
  const wantMeta = c.meta || (c.mod && mac)
  if (event.ctrlKey !== wantCtrl || event.metaKey !== wantMeta || event.altKey !== c.alt) return false

  const key = event.key.toLowerCase()
  // A symbol (?, !, +) is whatever Shift it took to type it on this layout, so Shift is not checked for it.
  // Letters, digits and named keys need Shift to match exactly: mod+z must not fire on mod+shift+z.
  const symbol = c.key.length === 1 && !/[a-z0-9 ]/.test(c.key)
  if (!symbol && event.shiftKey !== c.shift) return false
  if (symbol && c.shift && !event.shiftKey) return false
  if (key === c.key) return true
  // With Alt (Option on Mac) or another layout, the key's character changes; its physical code does not.
  if (/^[a-z]$/.test(c.key)) return event.code === `Key${c.key.toUpperCase()}`
  if (/^[0-9]$/.test(c.key)) return event.code === `Digit${c.key}` || event.code === `Numpad${c.key}`
  return false
}

/** True while focus is somewhere a key types text: a text input, a textarea, a select or anything contenteditable. */
export function isTyping(event: KeyboardEvent) {
  const el = (event.composedPath?.()[0] ?? event.target) as HTMLElement | null
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === "TEXTAREA" || tag === "SELECT") return true
  if (tag === "INPUT") return !/^(checkbox|radio|button|submit|reset|image|file|color|range)$/.test((el as HTMLInputElement).type)
  const role = el.getAttribute("role")
  return role === "textbox" || role === "combobox" || role === "searchbox"
}

/**
 * Keyboard shortcuts as a map of keys to handlers ({ "1": yes, "mod+z": undo, "?": help }), quiet while someone types
 * in a field, with the key being pressed for Kbd. Active on the whole page while mounted and `enabled`; a binding can
 * allow typing in fields. Keys are also ignored while an input method is composing and when another handler already
 * took the key (defaultPrevented). Listeners are removed on unmount and when disabled.
 */
export function useHotkeys(map: HotkeyMap, { enabled = true, pressedFor = 150 }: UseHotkeysOptions = {}) {
  // Always the latest map, so handlers can close over fresh state without re-adding the listener.
  const latest = React.useRef(map)
  React.useLayoutEffect(() => {
    latest.current = map
  })
  const [pressed, setPressed] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled) return
    const mac = isMac()
    let downAt = 0
    let release: number | undefined
    let held: string | null = null

    const clear = () => {
      window.clearTimeout(release)
      held = null
      setPressed(null)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.key === "Process") return
      for (const [combo, binding] of Object.entries(latest.current)) {
        if (!matchesCombo(event, combo, mac)) continue
        const b = typeof binding === "function" ? { handler: binding } : binding
        if (isTyping(event) && !b.allowInInput) return
        if (event.repeat && !b.repeat) {
          if (b.preventDefault !== false) event.preventDefault()
          return
        }
        if (b.preventDefault !== false) event.preventDefault()
        window.clearTimeout(release)
        downAt = performance.now()
        held = combo
        setPressed(combo)
        b.handler(event)
        return
      }
    }

    // Any key coming up ends the press (Shift may come up before ?), but a quick tap stays down long enough to be seen.
    const onKeyUp = () => {
      if (held === null) return
      window.clearTimeout(release)
      release = window.setTimeout(clear, Math.max(0, pressedFor - (performance.now() - downAt)))
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", clear)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", clear)
      window.clearTimeout(release)
      setPressed(null)
    }
  }, [enabled, pressedFor])

  return { pressed }
}
