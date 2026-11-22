// @syncrobotic/slide-to-release v0.28.0 · update: npx shadcn add @syncrobotic/slide-to-release --overwrite
"use client"

import * as React from "react"
import { ChevronsRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSlideRelease } from "@/registry/syncrobotic/hooks/use-slide-release"

type Props = {
  onRelease: () => void
  label?: string
  /** Name tag, e.g. "7F3A", or "3 stopped" after stop-all. */
  tag?: string
  /** Viewers cannot release: the thumb shows a lock and the label says who can. */
  locked?: boolean
  /** Shown instead of the label while locked. */
  lockedLabel?: string
  /** Shown after release while waiting for the dog. */
  releasingLabel?: string
  /**
   * Show the released state (thumb at the end, `releasingLabel`) without a slide, e.g. when the screen is drawn again
   * while a release the operator already made is still waiting for the robot.
   */
  releasing?: boolean
  /**
   * The robot did not release (no reply, or it refused). The thumb goes back and the label says so, so the operator can
   * slide again. Set it when the release fails; clear it in your next `onRelease`.
   */
  failed?: boolean
  /** Shown while `failed`. */
  failedLabel?: string
  /** Read by a screen reader after the label: how to release without a pointer. */
  keyboardHint?: string
  className?: string
}

/**
 * Releases a stopped dog. A slide has direction and distance, so it is harder to trigger by accident
 * in a panic than a long press, and it reads like unlocking a phone.
 * Past 85% letting go releases; otherwise the thumb springs back in 200 ms.
 * Keyboard and switch control: hold Enter or Space for 2 s; the thumb travels while the key is held, and letting go,
 * moving focus away or the page being hidden cancels it. The slider role is there so a screen reader passes the held key
 * through to the track; the arrow keys do nothing (a release is never a step).
 */
export function SlideToRelease({
  onRelease,
  label = "Slide to release",
  lockedLabel = "Only operators can release",
  releasingLabel = "Releasing…",
  releasing = false,
  failed = false,
  failedLabel = "Not released, slide again",
  keyboardHint = "Hold Enter or Space for 2 seconds",
  tag,
  locked,
  className,
}: Props) {
  const slide = useSlideRelease({ onRelease, disabled: locked || releasing })
  const { trackRef, thumbRef, dragging, reset, thumbHandlers, trackHandlers } = slide
  const released = slide.released || (releasing && !locked)
  const position = released ? 1 : slide.position
  // A failed release puts the thumb back, so "Releasing…" never becomes a dead end.
  React.useEffect(() => {
    if (failed) reset()
  }, [failed, reset])
  const text = locked ? lockedLabel : released ? releasingLabel : failed ? failedLabel : label
  // The thumb is the stop's height less its 4 px inset, so it fills the track in every density.
  const hintId = React.useId()
  const thumbLeft = `calc(${position} * (100% - var(--h-thumb) - 0.5rem) + 0.25rem)`

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={locked ? -1 : 0}
      aria-label={text}
      aria-describedby={locked ? undefined : hintId}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position * 100)}
      aria-disabled={locked || undefined}
      {...trackHandlers}
      className={cn("relative flex h-(--h-stop) w-full select-none items-center justify-center overflow-hidden rounded-md bg-stop-deep text-white", className)}
    >
      {position > 0 && (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-stop" style={{ width: `calc(${thumbLeft} + var(--h-thumb))` }} />
      )}
      {!locked && (
        <span id={hintId} className="sr-only">
          {keyboardHint}
        </span>
      )}
      <span aria-hidden="true" className="w-(--h-thumb) shrink-0" />
      <span
        className="relative inline-flex items-center gap-2 text-lg font-bold"
        style={{ opacity: released ? 1 : Math.max(0, 1 - position * 1.6) }}
      >
        {text}
        {tag && !locked && <span className="inline-flex h-(--h-tag) items-center rounded-xs px-2 text-xs font-medium ring-1 ring-white ring-inset">{tag}</span>}
      </span>
      <div
        ref={thumbRef}
        {...thumbHandlers}
        className={cn(
          "absolute top-1 flex size-(--h-thumb) touch-none items-center justify-center rounded-sm",
          // Opaque in every theme (high contrast allows nothing translucent): locked is an outline, not a faded thumb.
          locked ? "text-white ring-1 ring-white ring-inset" : "bg-white text-stop-deep shadow-float",
          !dragging && "transition-[left] duration-(--motion-base) ease-(--ease-standard)",
        )}
        style={{ left: thumbLeft }}
      >
        {locked ? <Lock aria-hidden="true" className="size-6" /> : <ChevronsRight aria-hidden="true" className="size-6" strokeWidth={2} />}
      </div>
    </div>
  )
}
