// @syncrobotic/message-actions v0.51.0 · update: npx shadcn add @syncrobotic/message-actions --overwrite
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, RotateCw, ThumbsDown, ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { Button } from "@/registry/syncrobotic/ui/button"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"

/*
  What someone can do with a model's answer: copy, regenerate, rate, say what was wrong, switch versions (‹ 2 / 3 ›).
  With a mouse and no touch screen the buttons show only on hover or focus, so a long conversation is not a wall of icons;
  on touch they always show. Given feedback and the version switcher never hide: they are state. Good and Bad are toggles
  (aria-pressed), inverted when pressed, never green or red.
*/

export type MessageFeedback = "good" | "bad"

export type MessageActionsLabels = {
  /** The group's name: "Answer actions". */
  group: string
  copy: string
  /** Said after a copy. */
  copied: string
  /** Said when the browser refused the copy. */
  copyFailed: string
  regenerate: string
  good: string
  bad: string
  /** Over the reasons that follow Bad. */
  reasons: string
  /** The version switcher's name. */
  versions: string
  previous: string
  next: string
  /** What screen readers hear for the switcher: "Version 2 of 3". */
  version: (n: number, count: number, locale: string | undefined) => string
  /** What it shows: "2 / 3". */
  versionShort: (n: number, count: number, locale: string | undefined) => string
}

export const defaultMessageActionsLabels: MessageActionsLabels = {
  group: "Answer actions",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Could not copy: select the text and copy it",
  regenerate: "Regenerate",
  good: "Good answer",
  bad: "Bad answer",
  reasons: "What was wrong?",
  versions: "Versions",
  previous: "Previous version",
  next: "Next version",
  version: (n, count, locale) => `Version ${formatCount(n, { locale })} of ${formatCount(count, { locale })}`,
  versionShort: (n, count, locale) => `${formatCount(n, { locale })} / ${formatCount(count, { locale })}`,
}

export type MessageFeedbackReason = { value: string; label: string }

// Out of sight only with a mouse and no touch screen at all, and only while nothing in the turn (or the bar) is hovered
// or focused. Opacity, not display: the buttons keep their place and stay in the Tab order, so focus shows them.
const quietClass = cn(
  "transition-opacity duration-(--motion-fast) ease-(--ease-standard)",
  "[@media(pointer:fine)_and_(not_(any-pointer:coarse))]:not-group-hover/message:not-group-focus-within/message:not-hover:not-focus-within:opacity-0",
)

const pressed = "aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
// The ends of the switcher stay focusable (aria-disabled), so focus never falls to the page when the last version shows.
const ended = "aria-disabled:cursor-default aria-disabled:text-disabled aria-disabled:hover:bg-transparent"

/**
 * The actions under a model's answer: Copy, Regenerate, Good and Bad (with an optional reason), and a version switcher.
 * Each part shows only when you give what it needs. Put it in Message's `actions`.
 */
export function MessageActions({
  copyText,
  onRegenerate,
  feedback: feedbackProp,
  defaultFeedback = null,
  onFeedbackChange,
  reasons,
  reason: reasonProp,
  onReasonChange,
  version,
  versions,
  onVersionChange,
  quiet = true,
  locale,
  labels,
  className,
}: {
  /** The answer as text: shows Copy. */
  copyText?: string
  /** Shows Regenerate. The new answer becomes the last version. */
  onRegenerate?: () => void
  /** The feedback given (controlled): "good", "bad" or null. */
  feedback?: MessageFeedback | null
  defaultFeedback?: MessageFeedback | null
  /** Shows Good and Bad. Called with the new value; pressing the pressed one again clears it (null). */
  onFeedbackChange?: (feedback: MessageFeedback | null) => void
  /** After Bad: a row of reasons to pick one from ("Wrong facts", "Did not follow the request"). */
  reasons?: MessageFeedbackReason[]
  /** The picked reason (controlled). */
  reason?: string
  onReasonChange?: (reason: string | undefined) => void
  /** The version shown, from 1. With `versions` above 1, shows ‹ 2 / 3 ›. */
  version?: number
  /** How many versions regeneration has made. */
  versions?: number
  onVersionChange?: (version: number) => void
  /** Out of sight until the turn is hovered or focused, with a mouse only. Set false on the latest answer to keep it shown. */
  quiet?: boolean
  /** Formats the version numbers. */
  locale?: string
  labels?: Partial<MessageActionsLabels>
  className?: string
}) {
  const l = { ...defaultMessageActionsLabels, ...labels }
  const [ownFeedback, setOwnFeedback] = React.useState<MessageFeedback | null>(defaultFeedback)
  const feedback = feedbackProp !== undefined ? feedbackProp : ownFeedback
  const [ownReason, setOwnReason] = React.useState<string | undefined>(undefined)
  const reason = reasonProp !== undefined ? reasonProp : ownReason
  const id = React.useId()

  const give = (value: MessageFeedback) => {
    const next = feedback === value ? null : value
    setOwnFeedback(next)
    onFeedbackChange?.(next)
    if (next !== "bad" && reason !== undefined) {
      setOwnReason(undefined)
      onReasonChange?.(undefined)
    }
  }

  const count = versions ?? 0
  const shown = Math.min(Math.max(version ?? count, 1), Math.max(count, 1))
  const go = (to: number) => {
    if (to < 1 || to > count || to === shown) return
    onVersionChange?.(to)
  }

  const withFeedback = feedbackProp !== undefined || onFeedbackChange !== undefined
  const showReasons = feedback === "bad" && !!reasons?.length
  const hush = quiet && feedback === null

  return (
    <div data-slot="message-actions" className={cn("flex min-w-0 flex-col gap-2", showReasons && "basis-full", className)}>
      <div role="group" aria-label={l.group} className="flex flex-wrap items-center gap-1">
        {count > 1 && (
          <div role="group" aria-label={l.versions} data-slot="message-actions-versions" className="flex items-center">
            <Button
              data-slot="message-actions-previous"
              variant="ghost"
              size="icon-sm"
              aria-label={l.previous}
              aria-disabled={shown <= 1 || undefined}
              onClick={() => go(shown - 1)}
              className={ended}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span aria-hidden="true" className="min-w-10 text-center text-xs text-muted-foreground tabular-nums">
              {l.versionShort(shown, count, locale)}
            </span>
            <span aria-live="polite" className="sr-only">
              {l.version(shown, count, locale)}
            </span>
            <Button
              data-slot="message-actions-next"
              variant="ghost"
              size="icon-sm"
              aria-label={l.next}
              aria-disabled={shown >= count || undefined}
              onClick={() => go(shown + 1)}
              className={ended}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        )}
        <div data-slot="message-actions-buttons" className={cn("flex items-center gap-1", hush && quietClass)}>
          {copyText !== undefined && (
            <CopyButton value={copyText} labels={{ copy: l.copy, copied: l.copied, failed: l.copyFailed }} className="text-muted-foreground hover:text-foreground" />
          )}
          {onRegenerate && (
            <Button data-slot="message-actions-regenerate" variant="ghost" size="icon-sm" aria-label={l.regenerate} onClick={onRegenerate} className="text-muted-foreground hover:text-foreground">
              <RotateCw aria-hidden="true" />
            </Button>
          )}
          {withFeedback && (
            <>
              <Button
                data-slot="message-actions-good"
                variant="ghost"
                size="icon-sm"
                aria-label={l.good}
                aria-pressed={feedback === "good"}
                onClick={() => give("good")}
                className={cn("text-muted-foreground hover:text-foreground", pressed)}
              >
                <ThumbsUp aria-hidden="true" />
              </Button>
              <Button
                data-slot="message-actions-bad"
                variant="ghost"
                size="icon-sm"
                aria-label={l.bad}
                aria-pressed={feedback === "bad"}
                aria-controls={showReasons ? `${id}-reasons` : undefined}
                onClick={() => give("bad")}
                className={cn("text-muted-foreground hover:text-foreground", pressed)}
              >
                <ThumbsDown aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      </div>
      {showReasons && (
        <div id={`${id}-reasons`} data-slot="message-actions-reasons" className="flex animate-appear flex-col gap-2">
          <p id={`${id}-reasons-title`} className="text-sm text-muted-foreground">
            {l.reasons}
          </p>
          <ChipGroup
            label={l.reasons}
            items={reasons!.map((r) => ({ value: r.value, label: r.label }))}
            value={reason}
            onValueChange={(v) => {
              setOwnReason(v)
              onReasonChange?.(v)
            }}
          />
        </div>
      )}
    </div>
  )
}
