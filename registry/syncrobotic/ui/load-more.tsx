// @syncrobotic/load-more v0.12.0 · update: npx shadcn add @syncrobotic/load-more --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"

type Labels = {
  /** "Showing 40 of 125" */
  showing?: (shown: number, total: number) => string
  /** "Show 20 more (85 left)" */
  more?: (next: number, left: number) => string
}

const defaults: Required<Labels> = {
  showing: (shown, total) => `Showing ${shown.toLocaleString()} of ${total.toLocaleString()}`,
  more: (next, left) => `Show ${next.toLocaleString()} more (${left.toLocaleString()} left)`,
}

/**
 * The end of a long list on a phone or in a gallery: how much is shown, and one button for the next batch that says how
 * many it adds and how many remain. Gone once everything is shown. Pages (Pagination) suit a desktop table; this suits
 * scrolling. Focus stays on the button, so the next press is where the thumb already is.
 *
 * The rows a press adds should arrive, not pop in: give the items past the first batch `animate-appear`
 * (`i >= firstBatch && "animate-appear"`). It runs once, when a row mounts, so rows already shown stay still.
 */
export function LoadMore({
  shown,
  total,
  step,
  onMore,
  loading = false,
  labels,
  className,
}: {
  shown: number
  total: number
  /** How many one press adds. */
  step: number
  onMore: () => void
  /** While the next batch is on its way (when it is fetched, not just revealed). */
  loading?: boolean
  labels?: Labels
  className?: string
}) {
  const l = { ...defaults, ...labels }
  const left = Math.max(0, total - shown)
  return (
    <div data-slot="load-more" className={cn("flex flex-col items-center gap-3", className)}>
      <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
        {l.showing(Math.min(shown, total), total)}
      </p>
      {left > 0 && (
        <Button variant="secondary" className="w-full sm:w-auto" loading={loading} onClick={onMore}>
          {l.more(Math.min(step, left), left)}
        </Button>
      )}
    </div>
  )
}
