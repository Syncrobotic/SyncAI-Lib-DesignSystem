// @syncrobotic/marker v0.58.0 · update: npx shadcn add @syncrobotic/marker --overwrite
import * as React from "react"
import { type Status, StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { cn } from "@/lib/utils"

/**
 * A labelled line across a log or feed (a day, a takeover, an e-stop), and MarkerRow: one dense log line with a status
 * glyph, detail and time. It reads as text, not as a control. Neutral by default; a status only for the moments that
 * went wrong.
 */
export function Marker({
  icon,
  time,
  status,
  align = "center",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  time?: React.ReactNode
  /** warning or danger colour the label; leave it out for an ordinary line. */
  status?: "warning" | "danger"
  align?: "start" | "center"
}) {
  return (
    // As wide as its container: the lines either side of the label fill what is left, even where the parent shrinks to fit.
    <div data-slot="marker" className={cn("flex min-h-8 w-full items-center gap-3 text-xs", className)} {...props}>
      {align === "center" && <span aria-hidden="true" className="h-px flex-1 bg-border" />}
      <span
        className={cn(
          "flex shrink-0 items-center gap-2 font-medium text-muted-foreground [&_svg]:size-4",
          status === "warning" && "text-warning",
          status === "danger" && "text-danger",
        )}
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        <span>{children}</span>
        {time && <span className="font-normal tabular-nums">· {time}</span>}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}

/**
 * One line of a run log: what happened, to what, and when. Dense on purpose; open the details elsewhere (Trace).
 * The status is a glyph, so a long log of normal lines stays quiet.
 */
export function MarkerRow({
  status,
  icon,
  title,
  detail,
  time,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  /** The line's status, drawn as its glyph: only warning and danger are coloured, the glyph and never the title. */
  status?: Status
  /** An icon for the kind of line, used when there is no status. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Arguments, an id, a path: shown in monospace after the title. */
  detail?: React.ReactNode
  time?: React.ReactNode
}) {
  return (
    <div data-slot="marker-row" className={cn("flex min-h-8 min-w-0 items-center gap-2 text-sm", className)} {...props}>
      {status ? (
        <span className="grid size-4 shrink-0 place-items-center">
          <StatusGlyph status={status} />
        </span>
      ) : (
        icon && (
          <span aria-hidden="true" className="grid shrink-0 place-items-center text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )
      )}
      {/* The title stays in the text colour: status colour is for the glyph only. */}
      <span className="shrink-0 font-medium">
        {title}
        {(status === "danger" || status === "warning") && <span className="sr-only"> {status === "danger" ? "failed" : "warning"}</span>}
      </span>
      {detail && <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{detail}</span>}
      {children}
      {time && <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground tabular-nums">{time}</span>}
    </div>
  )
}
