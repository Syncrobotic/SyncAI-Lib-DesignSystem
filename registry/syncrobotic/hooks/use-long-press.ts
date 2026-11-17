// @syncrobotic/use-long-press v0.5.0 · update: npx shadcn add @syncrobotic/use-long-press --overwrite
"use client"

import * as React from "react"

type Options = {
  /** Fires on pointer down, before anything else. The e-stop uses this: one touch stops. */
  onPress?: () => void
  /** Fires once the press has been held for `duration` ms. */
  onLongPress: () => void
  /** Hold time in ms. Default 2000 (stop all). */
  duration?: number
  /** Progress is reported only after this delay, so a normal tap never flashes a fill. Default 500. */
  showAfter?: number
}

/**
 * Press-and-hold with progress, for pointer, keyboard and assistive tech alike:
 * - pointer down, or Enter / Space down, fires `onPress` at once; holding for `duration` fires `onLongPress`
 * - releasing, leaving the target or losing focus cancels the hold
 * - a click with no pointer and no key before it (screen readers, switch control) fires `onPress`
 * Progress runs from 0 to 1 and is meant for a left-to-right fill.
 */
export function useLongPress({ onPress, onLongPress, duration = 2000, showAfter = 500 }: Options) {
  const [progress, setProgress] = React.useState(0)
  const frame = React.useRef<number | null>(null)
  const start = React.useRef(0)
  const fired = React.useRef(false)
  // Set while a key press is in flight, so the click the browser synthesises afterwards is not a second press.
  const byKey = React.useRef(false)

  const stop = React.useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    setProgress(0)
  }, [])

  const tick = React.useCallback(() => {
    const elapsed = performance.now() - start.current
    if (elapsed >= duration) {
      if (!fired.current) {
        fired.current = true
        onLongPress()
      }
      stop()
      return
    }
    setProgress(elapsed < showAfter ? 0 : (elapsed - showAfter) / (duration - showAfter))
    frame.current = requestAnimationFrame(tick)
  }, [duration, showAfter, onLongPress, stop])

  React.useEffect(() => stop, [stop])

  const begin = () => {
    fired.current = false
    start.current = performance.now()
    onPress?.()
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    begin()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    if (e.repeat) return
    byKey.current = true
    begin()
  }

  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return
    stop()
    // Space clicks on key up, after this handler; clear the flag once that click has passed.
    window.setTimeout(() => (byKey.current = false), 0)
  }

  const onClick = (e: React.MouseEvent) => {
    // detail 0 = not from a pointer. Pointer and key presses already fired onPress.
    if (e.detail !== 0 || byKey.current) return
    onPress?.()
  }

  return {
    progress,
    holding: progress > 0,
    handlers: {
      onPointerDown,
      onPointerUp: stop,
      onPointerCancel: stop,
      onPointerLeave: stop,
      onKeyDown,
      onKeyUp,
      onBlur: stop,
      onClick,
    },
  }
}
