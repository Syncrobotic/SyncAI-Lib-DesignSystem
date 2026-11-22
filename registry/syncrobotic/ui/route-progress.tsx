// @syncrobotic/route-progress v0.28.0 · update: npx shadcn add @syncrobotic/route-progress --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type RouteProgressLabels = {
  /** The bar's name for screen readers. */
  loading: string
}

export const defaultRouteProgressLabels: RouteProgressLabels = { loading: "Loading page" }

/**
 * A thin bar along the top while the next page loads: a process someone is waiting on, so it is blue. It appears only
 * after `delay` (a quick page never flashes it), creeps towards the end without reaching it, and gives up after
 * `giveUp` in case the navigation never reports back. When the page is in it fills the width and fades, so the wait
 * visibly ends instead of the bar vanishing mid-way. Drive `active` from your router: true when a navigation starts,
 * false when the new page is in.
 */
export function RouteProgress({
  active,
  delay = 300,
  giveUp = 10000,
  label,
  labels,
  className,
}: {
  active: boolean
  delay?: number
  giveUp?: number
  /** Same as `labels.loading`, and wins over it. */
  label?: string
  /** The words it says, to translate them. */
  labels?: Partial<RouteProgressLabels>
  className?: string
}) {
  const l = { ...defaultRouteProgressLabels, ...labels }
  // hidden, then running after the delay; when the page is in, done: the bar fills the width and fades, then goes.
  const [phase, setPhase] = React.useState<"hidden" | "running" | "done">("hidden")
  // The page is in: the bar finishes in the same render, not one effect later.
  if (!active && phase === "running") setPhase("done")
  React.useEffect(() => {
    if (!active) return
    const show = window.setTimeout(() => setPhase("running"), delay)
    const stop = window.setTimeout(() => setPhase("hidden"), giveUp)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(stop)
    }
  }, [active, delay, giveUp])
  // The fade's end removes it; this catches a fade that never runs (a hidden tab, no animations).
  React.useEffect(() => {
    if (phase !== "done") return
    const gone = window.setTimeout(() => setPhase("hidden"), 1000)
    return () => window.clearTimeout(gone)
  }, [phase])
  if (phase === "hidden") return null
  if (phase === "done")
    return (
      <div
        aria-hidden="true"
        data-slot="route-progress"
        data-state="done"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setPhase("hidden")
        }}
        className={cn("pointer-events-none fixed inset-x-0 top-0 z-60 h-1 animate-disappear", className)}
      >
        {/* Finished: the whole width, while it fades on the exit's pace. */}
        <div className="h-full bg-info" />
      </div>
    )
  return (
    <div role="progressbar" aria-label={label ?? l.loading} data-slot="route-progress" className={cn("pointer-events-none fixed inset-x-0 top-0 z-60 h-1", className)}>
      {/* Creeps to 90 % over 8 s on the standard curve; under reduced motion it sits at 60 %. */}
      <div className="h-full origin-left scale-x-60 bg-info motion-safe:animate-route-progress" />
    </div>
  )
}
