"use client"

import * as React from "react"
import { ChevronsRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSlideRelease } from "@/registry/syncrobotic/hooks/use-slide-release"

type Props = {
  onRelease: () => void
  label?: string
  /** Name tag, e.g. "7F3A", or "已停止 3 隻" after stop-all. */
  tag?: string
  /** Viewers cannot release: the thumb shows a lock and the label says who can. */
  locked?: boolean
  className?: string
}

/**
 * Releases a stopped dog. A slide has direction and distance, so it is harder to trigger by accident
 * in a panic than a long press, and it reads like unlocking a phone.
 * Past 85% letting go releases; otherwise the thumb springs back in 200 ms.
 * Keyboard and switch control: hold Enter or Space for 2 s.
 */
export function SlideToRelease({ onRelease, label = "滑動解除停止", tag, locked, className }: Props) {
  const { trackRef, thumbRef, position, dragging, released, thumbHandlers, trackHandlers } = useSlideRelease({
    onRelease,
    disabled: locked,
  })
  const text = locked ? "只有操作員以上能解除" : released ? "解除中…" : label
  const thumbLeft = `calc(${position} * (100% - var(--h-lg) - 0.5rem) + 0.25rem)`

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={locked ? -1 : 0}
      aria-label={text}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position * 100)}
      aria-disabled={locked || undefined}
      {...trackHandlers}
      className={cn("relative flex h-(--h-stop) w-full select-none items-center justify-center overflow-hidden rounded-md bg-stop-deep text-white", className)}
    >
      {position > 0 && (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-white/15" style={{ width: `calc(${thumbLeft} + var(--h-lg))` }} />
      )}
      <span aria-hidden="true" className="w-(--h-lg) shrink-0" />
      <span
        className="relative inline-flex items-center gap-2 text-lg font-bold"
        style={{ opacity: released ? 1 : Math.max(0, 1 - position * 1.6) }}
      >
        {text}
        {tag && !locked && <span className="inline-flex h-(--h-tag) items-center rounded-xs bg-white/20 px-2 text-xs font-medium">{tag}</span>}
      </span>
      <div
        ref={thumbRef}
        {...thumbHandlers}
        className={cn(
          "absolute top-1 flex size-(--h-lg) touch-none items-center justify-center rounded-sm shadow-float",
          locked ? "bg-white/30 text-white" : "bg-white text-stop-deep",
          !dragging && "transition-[left] duration-(--motion-base) ease-(--ease-standard)",
        )}
        style={{ left: thumbLeft }}
      >
        {locked ? <Lock aria-hidden="true" className="size-6" /> : <ChevronsRight aria-hidden="true" className="size-6" strokeWidth={2} />}
      </div>
    </div>
  )
}
