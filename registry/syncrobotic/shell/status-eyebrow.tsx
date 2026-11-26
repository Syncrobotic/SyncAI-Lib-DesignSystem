// @syncrobotic/status-eyebrow v0.40.0 · update: npx shadcn add @syncrobotic/status-eyebrow --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { StatusGlyph, statusText, toStatus, warnTone, type Status, type Tone } from "@/registry/syncrobotic/shell/status-glyph"

/** The state word above a headline: shape + word in the state colour, no pill background. */
export function StatusEyebrow({
  status: given,
  tone,
  children,
  className,
}: {
  status?: Status
  /** @deprecated Use `status`. */
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  warnTone("StatusEyebrow", tone)
  const status = given ?? toStatus(tone ?? "neutral")
  return (
    <span className={cn("inline-flex h-(--h-tag) items-center gap-2 text-sm font-medium", statusText[status], className)}>
      <StatusGlyph status={status} />
      {children}
    </span>
  )
}

/**
 * A state that changes (a robot's status, a job's state) where it is read: in a list row's trailing slot, a table cell, or
 * beside a page title (PageHeader's `status`). Its shape and its word, no box; colour only when it is abnormal.
 * `className` sets the size where the line around it is smaller (`text-xs` in a 12 px meta line).
 */
export function InlineStatus({
  status: given,
  tone,
  children,
  className,
}: {
  status?: Status
  /** @deprecated Use `status`. */
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  warnTone("InlineStatus", tone)
  const status = given ?? toStatus(tone ?? "neutral")
  return (
    <span data-slot="inline-status" className={cn("inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm", statusText[status], className)}>
      <StatusGlyph status={status} />
      {children}
    </span>
  )
}
