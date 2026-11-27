// @syncrobotic/status-glyph v0.56.0 · update: npx shadcn add @syncrobotic/status-glyph --overwrite
import { cn } from "@/lib/utils"

export type Tone = "info" | "success" | "warning" | "danger" | "neutral"

/**
 * A robot's state, by what it is: active (busy, on a mission), normal (fine, waiting), warning (needs attention),
 * danger (stopped or failed), offline. Each has its own shape, so it reads without colour.
 */
export type Status = "active" | "normal" | "warning" | "danger" | "offline"

/** What the glyph draws: a Status, or `none`, a correct absence (not applicable, not started), never a fault. */
export type GlyphStatus = Status | "none"

/** The word for an item's status: its own `statusLabel`, else `words[status]`; none for an item without a status. */
export function statusWord(item: { status: Status; statusLabel?: string }, words: Record<Status, string>): string
export function statusWord(item: { status?: Status; statusLabel?: string }, words: Record<Status, string>): string | undefined
export function statusWord(item: { status?: Status; statusLabel?: string }, words: Record<Status, string>) {
  return item.status ? (item.statusLabel ?? words[item.status]) : undefined
}

// Colour is for what is abnormal. Active and normal read from the shape alone, in the text colour,
// so a fleet that is fine looks calm and the one robot that is not stands out.
const color: Record<GlyphStatus, string> = {
  active: "text-foreground",
  normal: "text-foreground",
  warning: "text-warning",
  danger: "text-danger",
  offline: "text-muted-foreground",
  none: "text-muted-foreground",
}

/**
 * Status as a shape, coloured only when abnormal: filled circle busy, hollow circle normal, triangle attention, square
 * stopped, slashed circle offline and dashed circle not applicable (both grey). `none` is nothing to report, and correctly
 * so (an air-gapped device that never checks in, a step not started). It is hidden from screen readers: say the status in
 * words beside it.
 */
export function StatusGlyph({
  status = "offline",
  className,
}: {
  /** active (busy), normal, warning, danger, offline (the default) or none (not applicable, not started). */
  status?: GlyphStatus
  className?: string
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={cn("size-3 shrink-0", color[status], className)}>
      {status === "active" && <circle cx="6" cy="6" r="5" fill="currentColor" />}
      {status === "normal" && <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />}
      {/* Inset, then stroked with round joins: the triangle keeps its size and gets rounded corners, like the square. */}
      {status === "warning" && <path d="M6 2.2 10.2 9.6H1.8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />}
      {status === "danger" && <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="currentColor" />}
      {/* Six dashes: an outline with nothing inside, so it never reads as hollow (normal) or slashed (offline). */}
      {status === "none" && <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2.19 2" />}
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
export const statusText: Record<Status, string> = color

/** Text colour per glyph status, `none` included (grey). */
export const glyphText: Record<GlyphStatus, string> = color

/** Subtle tint per status, for backgrounds behind status text. Only warning and danger tint; calm states stay grey. */
export const statusSubtle: Record<Status, string> = {
  active: "bg-neutral-subtle",
  normal: "bg-neutral-subtle",
  warning: "bg-warning-subtle",
  danger: "bg-danger-subtle",
  offline: "bg-neutral-subtle",
}

/** Keyed by tone, for IslandNotice, whose tones describe a notice rather than a robot's status. */
export const toneText: Record<Tone, string> = { info: color.active, success: color.normal, warning: color.warning, danger: color.danger, neutral: color.offline }
export const toneSubtle: Record<Tone, string> = {
  info: statusSubtle.active,
  success: statusSubtle.normal,
  warning: statusSubtle.warning,
  danger: statusSubtle.danger,
  neutral: statusSubtle.offline,
}
