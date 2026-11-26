// @syncrobotic/status-glyph v0.40.0 · update: npx shadcn add @syncrobotic/status-glyph --overwrite
import { cn } from "@/lib/utils"

export type Tone = "info" | "success" | "warning" | "danger" | "neutral"

/**
 * A robot's state, by what it is: active (busy, on a mission), normal (fine, waiting), warning (needs attention),
 * danger (stopped or failed), offline. Each has its own shape, so it reads without colour.
 */
export type Status = "active" | "normal" | "warning" | "danger" | "offline"

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
 * Status is a shape, and a colour only when it is abnormal: filled circle = active (busy), hollow circle = normal,
 * triangle = attention (warning colour), square = stopped (danger colour), slashed circle = offline (grey). It is hidden
 * from screen readers: say the status in words beside it.
 */
export function StatusGlyph({
  status = "offline",
  className,
}: {
  /** active (busy), normal, warning, danger or offline (the default). */
  status?: Status
  className?: string
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={cn("size-3 shrink-0", color[status], className)}>
      {status === "active" && <circle cx="6" cy="6" r="5" fill="currentColor" />}
      {status === "normal" && <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />}
      {/* Inset, then stroked with round joins: the triangle keeps its size and gets rounded corners, like the square. */}
      {status === "warning" && <path d="M6 2.2 10.2 9.6H1.8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />}
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

/** Keyed by tone, for IslandNotice, whose tones describe a notice rather than a robot's status. */
export const toneText: Record<Tone, string> = { info: color.active, success: color.normal, warning: color.warning, danger: color.danger, neutral: color.offline }
export const toneSubtle: Record<Tone, string> = {
  info: statusSubtle.active,
  success: statusSubtle.normal,
  warning: statusSubtle.warning,
  danger: statusSubtle.danger,
  neutral: statusSubtle.offline,
}
