// @syncrobotic/marker v0.9.0 · update: npx shadcn add @syncrobotic/marker --overwrite
import * as React from "react"
import { StatusGlyph, type Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { cn } from "@/lib/utils"

/**
 * A labelled line across a log or a feed: where a day starts, where the operator took over, where a run resumed.
 * It reads as text, not as a control. Neutral by default; a tone only for the moments that went wrong.
 */
export function Marker({
  icon,
  time,
  tone,
  align = "center",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  time?: React.ReactNode
  /** warning or danger colour the label; anything else stays neutral. */
  tone?: "warning" | "danger"
  align?: "start" | "center"
}) {
  return (
    <div data-slot="marker" className={cn("flex min-h-8 items-center gap-3 text-xs", className)} {...props}>
      {align === "center" && <span aria-hidden="true" className="h-px flex-1 bg-border" />}
      <span
        className={cn(
          "flex shrink-0 items-center gap-2 font-medium text-muted-foreground [&_svg]:size-4",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
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
  tone,
  icon,
  title,
  detail,
  time,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  tone?: Tone
  /** An icon for the kind of line, used when there is no tone. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Arguments, an id, a path: shown in monospace after the title. */
  detail?: React.ReactNode
  time?: React.ReactNode
}) {
  return (
    <div data-slot="marker-row" className={cn("flex min-h-8 min-w-0 items-center gap-2 text-sm", className)} {...props}>
      {tone ? (
        <span className="grid size-4 shrink-0 place-items-center">
          <StatusGlyph tone={tone} />
        </span>
      ) : (
        icon && (
          <span aria-hidden="true" className="grid shrink-0 place-items-center text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )
      )}
      <span className={cn("shrink-0 font-medium", tone === "danger" && "text-danger", tone === "warning" && "text-warning")}>
        {title}
        {(tone === "danger" || tone === "warning") && <span className="sr-only">, {tone === "danger" ? "failed" : "warning"}</span>}
      </span>
      {detail && <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{detail}</span>}
      {children}
      {time && <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground tabular-nums">{time}</span>}
    </div>
  )
}
