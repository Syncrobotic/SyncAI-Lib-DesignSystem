// @syncrobotic/use-slide-release v0.28.0 · update: npx shadcn add @syncrobotic/use-slide-release --overwrite
"use client"

import * as React from "react"
import { feedback } from "@/registry/syncrobotic/lib/feedback"

type Options = {
  onRelease: () => void
  /** Fraction of the track the thumb must pass before letting go releases. Default 0.85. */
  threshold?: number
  /** Horizontal movement in px before the thumb moves, so a tap or a slip does nothing. Then it follows the finger 1:1. Default 8. */
  startAfter?: number
  /**
   * Keyboard / switch-control fallback: hold Enter or Space this long to release. Default 2000. The thumb travels while
   * the key is held; letting go, moving focus away or the page being hidden cancels the hold.
   */
  holdFallback?: number
  disabled?: boolean
}

/**
 * Slide-to-release for the e-stop. The thumb follows the finger; past `threshold` letting go
 * releases, otherwise the thumb springs back (the component animates `position` back to 0).
 */
export function useSlideRelease({
  onRelease,
  threshold = 0.85,
  startAfter = 8,
  holdFallback = 2000,
  disabled = false,
}: Options) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const thumbRef = React.useRef<HTMLDivElement>(null)
  const [position, setPositionState] = React.useState(0)
  // Read on pointer up. State from the last render can lag a fast flick, so the release decision uses the ref.
  const positionRef = React.useRef(0)
  const setPosition = (p: number) => {
    positionRef.current = p
    setPositionState(p)
  }
  const [dragging, setDragging] = React.useState(false)
  const [released, setReleased] = React.useState(false)
  const origin = React.useRef<number | null>(null)
  const armed = React.useRef(false)
  const keyTimer = React.useRef<number | null>(null)

  const travel = () => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return 1
    // The inset is the thumb's resting gap, which equals its top gap. Not offsetLeft: that grows as the thumb moves,
    // which shrank the travel mid-drag and made the thumb outrun the finger and finish on its own.
    const inset = thumb.offsetTop
    return Math.max(1, track.clientWidth - thumb.offsetWidth - inset * 2)
  }

  const finish = React.useCallback(() => {
    setReleased(true)
    positionRef.current = 1
    setPositionState(1)
    feedback("release")
    onRelease()
  }, [onRelease])

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || released) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    origin.current = e.clientX
    armed.current = false
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (origin.current === null) return
    const dx = e.clientX - origin.current
    if (!armed.current) {
      if (dx < startAfter) return
      armed.current = true
      setDragging(true)
    }
    // 1:1 with the finger: the thumb sits under the finger, not startAfter px behind it.
    setPosition(Math.min(1, Math.max(0, dx / travel())))
  }

  const end = () => {
    if (origin.current === null) return
    origin.current = null
    setDragging(false)
    if (armed.current && positionRef.current >= threshold) finish()
    else setPosition(0)
    armed.current = false
  }

  const keyFrame = React.useRef<number | null>(null)

  // Ends a keyboard hold without releasing: the key went up, focus left the track or the page was hidden. A hold whose
  // key up never arrives (Tab away, another window, the phone locked) must not release on its own 2 s later.
  const cancelHold = React.useCallback(() => {
    if (keyTimer.current === null) return
    window.clearTimeout(keyTimer.current)
    keyTimer.current = null
    if (keyFrame.current !== null) cancelAnimationFrame(keyFrame.current)
    keyFrame.current = null
    setDragging(false)
    positionRef.current = 0
    setPositionState(0)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || released || (e.key !== "Enter" && e.key !== " ")) return
    e.preventDefault()
    if (keyTimer.current !== null) return
    const start = performance.now()
    keyTimer.current = window.setTimeout(() => {
      keyTimer.current = null
      if (keyFrame.current !== null) cancelAnimationFrame(keyFrame.current)
      keyFrame.current = null
      setDragging(false)
      finish()
    }, holdFallback)
    // Drawn like a drag (no transition lagging behind each frame); cancelling springs it back.
    setDragging(true)
    // The thumb travels with the hold, so the keyboard shows its progress the way a drag does (and aria-valuenow with it).
    // The timer above decides the release; the frames only draw it.
    const tick = () => {
      const p = Math.min(0.99, (performance.now() - start) / holdFallback)
      positionRef.current = p
      setPositionState(p)
      keyFrame.current = requestAnimationFrame(tick)
    }
    keyFrame.current = requestAnimationFrame(tick)
  }

  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") cancelHold()
  }

  React.useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) cancelHold()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      cancelHold()
    }
  }, [cancelHold])

  // Back to the start, e.g. when the release did not go through. Stable, so an effect can depend on it.
  const reset = React.useCallback(() => {
    setReleased(false)
    positionRef.current = 0
    setPositionState(0)
  }, [])

  return {
    trackRef,
    thumbRef,
    position,
    dragging,
    released,
    reset,
    thumbHandlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
    trackHandlers: { onKeyDown, onKeyUp, onBlur: cancelHold },
  }
}
