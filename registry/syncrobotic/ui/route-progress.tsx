// @syncrobotic/route-progress v0.23.0 · update: npx shadcn add @syncrobotic/route-progress --overwrite
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
 * `giveUp` in case the navigation never reports back. Drive `active` from your router: true when a navigation starts,
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
  const [shown, setShown] = React.useState(false)
  React.useEffect(() => {
    if (!active) {
      setShown(false)
      return
    }
    const show = window.setTimeout(() => setShown(true), delay)
    const stop = window.setTimeout(() => setShown(false), giveUp)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(stop)
    }
  }, [active, delay, giveUp])
  if (!shown) return null
  return (
    <div role="progressbar" aria-label={label ?? l.loading} data-slot="route-progress" className={cn("pointer-events-none fixed inset-x-0 top-0 z-60 h-1", className)}>
      {/* Creeps to 90 % over 8 s on the standard curve; under reduced motion it sits at 60 %. */}
      <div className="h-full origin-left scale-x-60 bg-info motion-safe:animate-route-progress" />
    </div>
  )
}
