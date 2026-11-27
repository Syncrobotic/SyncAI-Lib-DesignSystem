// @syncrobotic/slide-to-release v0.53.0 · update: npx shadcn add @syncrobotic/slide-to-release --overwrite
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
  /** Said at once (an alert) when it takes over from a StopButton that had focus. */
  stoppedLabel?: string
  className?: string
}

/**
 * Releases a stopped robot with a deliberate slide: past 85% it releases, short of that it springs back in 200 ms;
 * locked for viewers; hold 2 s on the keyboard instead. A slide has direction and distance, so it is harder to trigger
 * in a panic than a long press. The slider role makes a screen reader pass the held key through; arrow keys do nothing.
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
  stoppedLabel = "Stopped",
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
  const [handedOver, setHandedOver] = React.useState(false)
  useFocusHandoff(trackRef, "release", "stop", () => setHandedOver(true))
  const thumbLeft = `calc(${position} * (100% - var(--h-thumb) - 0.5rem) + 0.25rem)`

  return (
    <>
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
      {/* Beside the slider, not in it: a slider's content is presentational, so an alert inside it would not be heard. */}
      {handedOver && (
        <span role="alert" data-slot="slide-to-release-alert" className="sr-only">
          {stoppedLabel}
        </span>
      )}
    </>
  )
}

/**
 * The stop and SlideToRelease take turns in one slot, so the one leaving hands focus on: if it has focus as it unmounts,
 * it marks the slot (`data-stop-focus`), and the one mounting in a marked slot takes focus unless focus went elsewhere.
 * StopButton keeps its own copy of this, so neither item imports the other.
 */
function useFocusHandoff(ref: React.RefObject<HTMLElement | null>, self: string, next: string, onTaken?: () => void) {
  const taken = React.useEffectEvent(() => onTaken?.())
  React.useLayoutEffect(() => {
    const el = ref.current
    const slot = el?.parentElement
    if (el && slot?.getAttribute("data-stop-focus") === self) {
      slot.removeAttribute("data-stop-focus")
      if (!document.activeElement || document.activeElement === document.body) {
        el.focus({ preventScroll: true })
        taken()
      }
    }
    return () => {
      if (el && slot && document.activeElement === el) slot.setAttribute("data-stop-focus", next)
    }
  }, [ref, self, next])
}
