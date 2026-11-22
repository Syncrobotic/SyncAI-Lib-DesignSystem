// @syncrobotic/load-more v0.28.0 · update: npx shadcn add @syncrobotic/load-more --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"

export type LoadMoreLabels = {
  /** "Showing 40 of 125". `locale` is LoadMore's, for formatting the numbers. */
  showing: (shown: number, total: number, locale?: string) => string
  /** "Show 20 more (85 left)" */
  more: (next: number, left: number, locale?: string) => string
}

export const defaultLoadMoreLabels: LoadMoreLabels = {
  showing: (shown, total, locale) => `Showing ${shown.toLocaleString(locale)} of ${total.toLocaleString(locale)}`,
  more: (next, left, locale) => `Show ${next.toLocaleString(locale)} more (${left.toLocaleString(locale)} left)`,
}

/**
 * The end of a long list on a phone or in a gallery: how much is shown, and one button for the next batch that says how
 * many it adds and how many remain. Gone once everything is shown. Pages (Pagination) suit a desktop table; this suits
 * scrolling. Focus stays on the button, so the next press is where the thumb already is; when the last press removes it,
 * focus moves to the count ("Showing 125 of 125"), which is read out, instead of falling to the top of the page.
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
  locale,
  className,
}: {
  shown: number
  total: number
  /** How many one press adds. */
  step: number
  onMore: () => void
  /** While the next batch is on its way (when it is fetched, not just revealed). */
  loading?: boolean
  /** The words it says, to translate them. */
  labels?: Partial<LoadMoreLabels>
  /** Formats the numbers (a BCP 47 tag such as "zh-TW"). Left out, the browser's language. */
  locale?: string
  className?: string
}) {
  const l = { ...defaultLoadMoreLabels, ...labels }
  const left = Math.max(0, total - shown)
  const status = React.useRef<HTMLParagraphElement>(null)
  const pressed = React.useRef(false)
  React.useEffect(() => {
    if (left > 0 || !pressed.current) return
    pressed.current = false
    // Only when focus went with the button: never take it from somewhere the user has moved on to.
    if (!document.activeElement || document.activeElement === document.body) status.current?.focus()
  }, [left])
  return (
    <div data-slot="load-more" className={cn("flex flex-col items-center gap-3", className)}>
      <p
        ref={status}
        tabIndex={-1}
        aria-live="polite"
        className="rounded-xs text-sm text-muted-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {l.showing(Math.min(shown, total), total, locale)}
      </p>
      {left > 0 && (
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          loading={loading}
          onClick={(e) => {
            pressed.current = document.activeElement === e.currentTarget
            onMore()
          }}
        >
          {l.more(Math.min(step, left), left, locale)}
        </Button>
      )}
    </div>
  )
}
