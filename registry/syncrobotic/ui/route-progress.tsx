// @syncrobotic/route-progress v0.51.0 · update: npx shadcn add @syncrobotic/route-progress --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type RouteProgressLabels = {
  /** The bar's name for screen readers. */
  loading: string
}

export const defaultRouteProgressLabels: RouteProgressLabels = { loading: "Loading page" }

/**
 * A thin blue bar along the top while the next page loads. It appears only after `delay`, creeps without reaching the end,
 * gives up after `giveUp`, and on arrival fills and fades from where it got to. Drive `active` from your router.
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
  // When the page is in, the bar grows from where it is to the full width, then fades: one movement, no jump.
  const bar = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const el = bar.current
    if (phase !== "done" || !el) return
    // Hold the place the creep reached (the animation stops here), then run to the end on the standard curve.
    const from = getComputedStyle(el).scale
    el.style.animation = "none"
    el.style.scale = from === "none" ? "1 1" : from
    void el.offsetWidth
    el.style.transition = "scale var(--motion-fast) var(--ease-standard)"
    el.style.scale = "1 1"
  }, [phase])
  if (phase === "hidden") return null
  const done = phase === "done"
  return (
    <div
      role={done ? undefined : "progressbar"}
      aria-label={done ? undefined : (label ?? l.loading)}
      aria-hidden={done || undefined}
      data-slot="route-progress"
      data-state={done ? "done" : "running"}
      onAnimationEnd={(e) => {
        if (done && e.target === e.currentTarget) setPhase("hidden")
      }}
      // Below the status bar and a notch when the page runs full screen (safe area).
      className={cn("pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-60 h-1", done && "animate-disappear [animation-delay:var(--motion-fast)]", className)}
    >
      {/* Creeps towards 90 % over 8 s and never claims to be done. Under reduced motion there is no creep to watch, so the
          bar is the whole width at once: it says "loading" without pretending to know how far. */}
      <div ref={bar} className="h-full origin-left bg-info motion-safe:scale-x-10 motion-safe:animate-route-progress" />
    </div>
  )
}
