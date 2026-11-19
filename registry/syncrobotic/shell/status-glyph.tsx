// @syncrobotic/status-glyph v0.13.0 · update: npx shadcn add @syncrobotic/status-glyph --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"

export type Tone = "info" | "success" | "warning" | "danger" | "neutral"

/**
 * A robot's state, by what it is: active (busy, on a mission), normal (fine, waiting), warning (needs attention),
 * danger (stopped or failed), offline. Each has its own shape, so it reads without colour.
 */
export type Status = "active" | "normal" | "warning" | "danger" | "offline"

/** The old colour-style names (0.12 and before), still accepted until 1.0: info → active, success → normal, neutral → offline. */
const fromTone: Record<Tone, Status> = { info: "active", success: "normal", warning: "warning", danger: "danger", neutral: "offline" }

/** A status from either vocabulary. */
export const toStatus = (s: Status | Tone): Status => (s in fromTone ? fromTone[s as Tone] : (s as Status))

const warned = new Set<string>()
/** Says once per component that `tone` is now `status`. Development only. */
export function warnTone(component: string, tone: Tone | undefined) {
  if (tone === undefined || process.env.NODE_ENV === "production" || warned.has(component)) return
  warned.add(component)
  console.warn(`${component}: \`tone\` is now \`status\` (${tone} → ${fromTone[tone]}). \`tone\` stops working in 1.0.`)
}

// Colour is for what is abnormal. Active and normal read from the shape alone, in the text colour,
// so a fleet that is fine looks calm and the one robot that is not stands out.
const color: Record<Status, string> = {
  active: "text-foreground",
  normal: "text-foreground",
  warning: "text-warning",
  danger: "text-danger",
  offline: "text-muted-foreground",
}

/**
 * Status is always shape + colour, never colour alone:
 * filled circle = active (busy), hollow circle = normal, triangle = attention,
 * square = stopped, slashed circle = offline.
 */
export function StatusGlyph({ status: given, tone, className }: { status?: Status; /** @deprecated Use `status`. */ tone?: Tone; className?: string }) {
  warnTone("StatusGlyph", tone)
  const status = given ?? toStatus(tone ?? "neutral")
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={cn("size-3 shrink-0", color[status], className)}>
      {status === "active" && <circle cx="6" cy="6" r="5" fill="currentColor" />}
      {status === "normal" && <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />}
      {status === "warning" && <path d="M6 1 11 10.5H1Z" fill="currentColor" />}
      {status === "danger" && <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="currentColor" />}
      {status === "offline" && (
        <>
          <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M2.5 9.5 9.5 2.5" stroke="currentColor" strokeWidth="2" />
        </>
      )}
    </svg>
  )
}

/** Text colour per status. Shared by every status display so a status always means the same colour. */
export const statusText = color

/** Subtle tint per status, for backgrounds behind status text. Only warning and danger tint; calm states stay grey. */
export const statusSubtle: Record<Status, string> = {
  active: "bg-neutral-subtle",
  normal: "bg-neutral-subtle",
  warning: "bg-warning-subtle",
  danger: "bg-danger-subtle",
  offline: "bg-neutral-subtle",
}

/** By the old names, for notices and anything still keyed by tone. */
export const toneText: Record<Tone, string> = { info: color.active, success: color.normal, warning: color.warning, danger: color.danger, neutral: color.offline }
export const toneSubtle: Record<Tone, string> = {
  info: statusSubtle.active,
  success: statusSubtle.normal,
  warning: statusSubtle.warning,
  danger: statusSubtle.danger,
  neutral: statusSubtle.offline,
}
