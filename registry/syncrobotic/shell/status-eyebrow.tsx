// @syncrobotic/status-eyebrow v0.5.0 · update: npx shadcn add @syncrobotic/status-eyebrow --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { StatusGlyph, toneText, type Tone } from "@/registry/syncrobotic/shell/status-glyph"

/** The state word above a headline: shape + word in the state colour, no pill background. */
export function StatusEyebrow({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-(--h-tag) items-center gap-1 text-sm font-medium", toneText[tone], className)}>
      <StatusGlyph tone={tone} />
      {children}
    </span>
  )
}

/** Status inside a list row's trailing slot: same shape + word, smaller. */
export function InlineStatus({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm", toneText[tone])}>
      <StatusGlyph tone={tone} />
      {children}
    </span>
  )
}
