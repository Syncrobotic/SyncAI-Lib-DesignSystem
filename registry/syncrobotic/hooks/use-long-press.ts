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
 * Press-and-hold with progress. Releasing the pointer or moving off the target cancels.
 * Progress runs from 0 to 1 and is meant for a left-to-right fill.
 */
export function useLongPress({ onPress, onLongPress, duration = 2000, showAfter = 500 }: Options) {
  const [progress, setProgress] = React.useState(0)
  const frame = React.useRef<number | null>(null)
  const start = React.useRef(0)
  const fired = React.useRef(false)

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

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    fired.current = false
    start.current = performance.now()
    onPress?.()
    frame.current = requestAnimationFrame(tick)
  }

  return {
    progress,
    holding: progress > 0,
    handlers: {
      onPointerDown,
      onPointerUp: stop,
      onPointerCancel: stop,
      onPointerLeave: stop,
    },
  }
}
