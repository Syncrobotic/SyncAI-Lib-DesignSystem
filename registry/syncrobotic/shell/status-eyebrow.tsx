// @syncrobotic/status-eyebrow v0.13.0 · update: npx shadcn add @syncrobotic/status-eyebrow --overwrite
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

/** Status inside a list row's trailing slot: same shape + word, smaller. */
export function InlineStatus({ status: given, tone, children }: { status?: Status; /** @deprecated Use `status`. */ tone?: Tone; children: React.ReactNode }) {
  warnTone("InlineStatus", tone)
  const status = given ?? toStatus(tone ?? "neutral")
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm", statusText[status])}>
      <StatusGlyph status={status} />
      {children}
    </span>
  )
}
