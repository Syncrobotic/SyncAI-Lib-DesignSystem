// @syncrobotic/trace v0.28.0 · update: npx shadcn add @syncrobotic/trace --overwrite
"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { ChevronRight, Circle, CircleAlert, CircleCheck, Minus, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

/**
 * The steps of a run, in order, each with its status and how long it took: a mission the robot executed, an agent's
 * tool calls, a firmware rollout, an audit trail. Steps open to show their input, output or sub-steps.
 * A run that went well is calm: done steps are a neutral check; only warnings and failures are coloured.
 */
export type TraceStatus = "pending" | "running" | "done" | "warning" | "error" | "skipped"

/** 840 ms, 1.2 s, 2 m 05 s, 1 h 04 m. */
export function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`
  const s = Math.round(ms / 1000)
  if (s < 3600) return `${Math.floor(s / 60)} m ${String(s % 60).padStart(2, "0")} s`
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")} m`
}

export type TraceLabels = {
  /** Each status in words, read after a step's title and used in TraceHeader's counts. */
  pending: string
  running: string
  done: string
  warning: string
  error: string
  skipped: string
  /** TraceHeader's count per status: "3 done", from the status word above. */
  count: (n: number, status: string) => string
  /** How long a step took, from ms: "1.2 s". */
  duration: (ms: number) => string
}

export const defaultTraceLabels: TraceLabels = {
  pending: "Waiting",
  running: "Running",
  done: "Done",
  warning: "Warning",
  error: "Failed",
  skipped: "Skipped",
  count: (n, status) => `${n} ${status.toLowerCase()}`,
  duration: (ms) => formatDuration(ms),
}

type Ctx = { density: "default" | "dense"; total?: number; labels: TraceLabels }
const TraceCtx = React.createContext<Ctx>({ density: "default", labels: defaultTraceLabels })

const warned = new Set<string>()
/** Says once that `density` is now `size`, so it is not confused with the theme's data-density. Development only. */
function warnDensity(component: string, density: unknown) {
  if (density === undefined || process.env.NODE_ENV === "production" || warned.has(component)) return
  warned.add(component)
  console.warn(`${component}: \`density="dense"\` is now \`size="sm"\`. \`density\` stops working in 1.0.`)
}

export function Trace({
  size,
  density: legacy,
  total,
  labels,
  className,
  ...props
}: React.ComponentProps<"ol"> & {
  /** sm: tighter rows for a long run. Rows you can open stay 44 px. */
  size?: "default" | "sm"
  /** @deprecated Use `size="sm"`. */
  density?: "default" | "dense"
  /** Length of the whole run in ms. With it, steps that have `start` and `duration` draw a waterfall bar. */
  total?: number
  /** The words it says, to translate them. Nested traces take their parent's. */
  labels?: Partial<TraceLabels>
}) {
  const parent = React.useContext(TraceCtx)
  warnDensity("Trace", legacy)
  const density = size ? (size === "sm" ? "dense" : "default") : legacy
  // Nested traces (sub-steps) inherit density and the run length.
  return (
    <TraceCtx.Provider value={{ density: density ?? parent.density, total: total ?? parent.total, labels: { ...parent.labels, ...labels } }}>
      <ol data-slot="trace" className={cn("flex flex-col", className)} {...props} />
    </TraceCtx.Provider>
  )
}

/** The status mark: shape first, colour only for warning and failure. */
export function TraceStatusIcon({ status, className }: { status: TraceStatus; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid size-5 shrink-0 place-items-center [&_svg]:size-4", className)}>
      {status === "running" && <Spinner delay={0} label="" className="size-4" />}
      {status === "done" && <CircleCheck className="text-foreground" />}
      {status === "warning" && <TriangleAlert className="text-warning" />}
      {status === "error" && <CircleAlert className="text-danger" />}
      {status === "pending" && <Circle className="text-muted-foreground" />}
      {status === "skipped" && <Minus className="text-muted-foreground" />}
    </span>
  )
}

export function TraceItem({
  status,
  title,
  description,
  meta,
  icon,
  duration,
  start,
  time,
  defaultOpen,
  open,
  onOpenChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  status: TraceStatus
  title: React.ReactNode
  /** One line under the title: the reason for a failure, a short result. */
  description?: React.ReactNode
  /** A muted detail beside the title: the tool, the robot, the model. */
  meta?: React.ReactNode
  /**
   * An icon for the kind of step (a tool, a robot), shown in place of the done check. Any other status keeps its mark
   * (spinner, warning, failure, waiting, skipped), so a step that needs someone never looks finished.
   */
  icon?: React.ReactNode
  /** In ms. */
  duration?: number
  /** Offset from the start of the run in ms, for the waterfall bar. */
  start?: number
  /** A clock time, shown as written. */
  time?: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { density, total, labels: l } = React.useContext(TraceCtx)
  const expandable = React.Children.count(children) > 0
  const bar = !!total && start !== undefined && duration !== undefined
  // Dense only tightens the padding: a row you can open is still a full touch target.
  const row = cn("flex w-full min-w-0 items-start gap-2 text-left text-sm", expandable || density !== "dense" ? "min-h-(--h-md)" : "min-h-8", density === "dense" ? "py-1" : "py-2")
  const head = (
    <>
      <span className={cn("relative z-10 flex shrink-0 items-center bg-background", density === "dense" ? "h-6" : "h-5")}>
        {/* The kind-of-step icon stands in for the done check only: a spinner, a warning or a failure always shows. */}
        {icon && status === "done" ? (
          <span aria-hidden="true" className="grid size-5 place-items-center text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : (
          <TraceStatusIcon status={status} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span
            className={cn(
              "font-medium",
              status === "pending" || status === "skipped" ? "text-muted-foreground" : "text-foreground",
              status === "error" && "text-danger",
            )}
          >
            {title}
          </span>
          {meta && <span className="truncate font-mono text-xs text-muted-foreground">{meta}</span>}
          <span className="sr-only">, {l[status]}</span>
        </span>
        {description && <span className={cn("text-xs", status === "error" ? "text-danger" : "text-muted-foreground")}>{description}</span>}
      </span>
      {bar && (
        <span aria-hidden="true" className="relative mt-2 hidden h-1.5 w-1/3 shrink-0 overflow-hidden rounded-full bg-track sm:block">
          <span
            className={cn("absolute inset-y-0 rounded-full", status === "error" ? "bg-danger" : status === "warning" ? "bg-warning" : "bg-foreground/60")}
            style={{ left: `${(start! / total!) * 100}%`, width: `${Math.max((duration! / total!) * 100, 1)}%` }}
          />
        </span>
      )}
      {(duration !== undefined || time) && (
        // In a waterfall the times take a fixed column, so every bar's track starts and ends at the same x.
        <span className={cn("flex shrink-0 flex-col items-end gap-1 pt-px text-xs text-muted-foreground tabular-nums", bar && "min-w-14")}>
          {duration !== undefined && <span>{l.duration(duration)}</span>}
          {time && <span>{time}</span>}
        </span>
      )}
      {expandable ? (
        <ChevronRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-(--motion-fast) ease-(--ease-standard) group-data-[state=open]/trace:rotate-90"
        />
      ) : (
        // A waterfall keeps the chevron's slot in rows that do not open, so their bars line up with the rows that do.
        bar && <span aria-hidden="true" className="size-4 shrink-0" />
      )}
    </>
  )

  return (
    <li data-slot="trace-item" data-status={status} className={cn("group/item relative", className)} {...props}>
      {/* The line joining this step to the next, through the status column. */}
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-2.5 w-px bg-border group-first/item:top-3 group-last/item:bottom-auto group-last/item:h-3"
      />
      {expandable ? (
        <CollapsiblePrimitive.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange} className="group/trace">
          <CollapsiblePrimitive.Trigger
            className={cn(
              row,
              "press rounded-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            {head}
          </CollapsiblePrimitive.Trigger>
          {/* 0 is the fallback height: Radix leaves the variable unset at 0, and a nested span would inherit its parent's. */}
          <CollapsiblePrimitive.Content className="overflow-hidden [--radix-collapsible-content-height:0px] data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
            <div className="flex gap-2 pb-2">
              {/* Indented under the title: the status column's width, then the same gap. */}
              <span aria-hidden="true" className="w-5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
            </div>
          </CollapsiblePrimitive.Content>
        </CollapsiblePrimitive.Root>
      ) : (
        <div className={row}>{head}</div>
      )}
    </li>
  )
}

/** A labelled block inside an open step: input, output, an error, notes. */
export function TraceDetail({ label, className, children }: { label: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div data-slot="trace-detail" className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  )
}

/** Machine output as it was: JSON, a command, a log. Scrolls instead of wrapping. */
export function TraceCode({ className, children, tone }: { className?: string; children: React.ReactNode; tone?: "danger" }) {
  return (
    <pre
      tabIndex={0}
      className={cn(
        "max-h-48 overflow-auto rounded-sm bg-muted p-3 font-mono text-xs leading-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        tone === "danger" && "text-danger",
        className,
      )}
    >
      {children}
    </pre>
  )
}

/** The run as a whole: its name, overall status, how long it took and a count per status. */
export function TraceHeader({
  title,
  status,
  duration,
  counts,
  labels,
  className,
  children,
}: {
  title: React.ReactNode
  status: TraceStatus
  duration?: number
  counts?: Partial<Record<TraceStatus, number>>
  /** The words it says, to translate them; inside a Trace, its labels are the starting point. */
  labels?: Partial<TraceLabels>
  className?: string
  children?: React.ReactNode
}) {
  const l = { ...React.useContext(TraceCtx).labels, ...labels }
  return (
    <div data-slot="trace-header" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border pb-3", className)}>
      <TraceStatusIcon status={status} />
      <span className="font-medium">
        {title}
        <span className="sr-only">, {l[status]}</span>
      </span>
      {duration !== undefined && <span className="text-sm text-muted-foreground tabular-nums">{l.duration(duration)}</span>}
      {counts && (
        <span className="flex gap-3 text-xs text-muted-foreground tabular-nums">
          {(Object.keys(counts) as TraceStatus[]).map((k) => (
            <span key={k} className={cn("flex items-center gap-1", k === "error" && "text-danger", k === "warning" && "text-warning")}>
              {l.count(counts[k] ?? 0, l[k])}
            </span>
          ))}
        </span>
      )}
      {children && <span className="ml-auto flex items-center gap-2">{children}</span>}
    </div>
  )
}
