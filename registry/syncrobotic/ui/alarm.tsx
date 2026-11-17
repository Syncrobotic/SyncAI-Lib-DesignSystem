// @syncrobotic/alarm v0.8.0 · update: npx shadcn add @syncrobotic/alarm --overwrite
"use client"

import * as React from "react"
import { CircleAlert, OctagonAlert, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence, usePresenceList } from "@/registry/syncrobotic/hooks/use-presence"

/**
 * Alarms follow ISA-18.2 / IEC 62682: an alarm is an abnormal condition that needs an operator action.
 * Three priorities, each with its own shape, colour and words, so priority reads without colour vision.
 * An alarm stays until the condition clears AND someone acknowledges it. It never auto-dismisses and never blinks.
 */
export type AlarmPriority = "critical" | "high" | "low"

export const alarmPriority = {
  critical: {
    icon: OctagonAlert,
    text: "text-danger",
    tint: "bg-danger-subtle",
    bar: "bg-danger",
    rank: 0,
  },
  high: {
    icon: TriangleAlert,
    text: "text-warning",
    tint: "bg-warning-subtle",
    bar: "bg-warning",
    rank: 1,
  },
  low: {
    icon: CircleAlert,
    text: "text-neutral",
    tint: "bg-neutral-subtle",
    bar: "bg-neutral",
    rank: 2,
  },
} as const

export type AlarmLabels = {
  critical: string
  high: string
  low: string
  unacknowledged: string
  acknowledged: string
  cleared: string
  acknowledge: string
}

export const defaultAlarmLabels: AlarmLabels = {
  critical: "Critical",
  high: "High",
  low: "Low",
  unacknowledged: "Unacknowledged",
  acknowledged: "Acknowledged",
  cleared: "Cleared, not acknowledged",
  acknowledge: "Acknowledge",
}

export type AlarmData = {
  id: string
  priority: AlarmPriority
  /** What happened and where: "Collision risk · Hall B". */
  title: string
  /** The robot, sensor or system that raised it. */
  source?: string
  /** When it was raised, already formatted by the app: "14:02:31". */
  time?: string
  /** The condition is still present. */
  active: boolean
  /** An operator has acknowledged it. */
  acknowledged: boolean
}

type AlarmProps = Omit<AlarmData, "id"> & {
  /** Shown while unacknowledged. Without it the alarm is read-only (for viewers). */
  onAcknowledge?: () => void
  /** The corrective action, e.g. "Open camera". */
  action?: { label: string; onClick: () => void }
  labels?: Partial<AlarmLabels>
  className?: string
}

/** One alarm. Unacknowledged: a bar in the priority colour and the word "Unacknowledged"; critical ones are also tinted. Colour stays off everything else. */
export function Alarm({ priority, title, source, time, active, acknowledged, onAcknowledge, action, labels, className }: AlarmProps) {
  const l = { ...defaultAlarmLabels, ...labels }
  const p = alarmPriority[priority]
  const Icon = p.icon
  const id = React.useId()
  const state = !acknowledged ? (active ? l.unacknowledged : l.cleared) : l.acknowledged
  return (
    <article
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-meta`}
      data-priority={priority}
      data-state={!acknowledged ? "unacknowledged" : "acknowledged"}
      className={cn(
        "relative flex min-h-(--h-row) animate-appear flex-wrap items-center gap-x-2 gap-y-2 overflow-hidden rounded-md py-2 pr-2 pl-4",
        !acknowledged && active && priority === "critical" ? p.tint : "bg-card ring-1 ring-border",
        className,
      )}
    >
      {!acknowledged && <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", p.bar)} />}
      <Icon aria-hidden="true" className={cn("size-5 shrink-0", p.text)} />
      <div className="flex min-w-0 flex-1 basis-40 flex-col">
        <p id={`${id}-title`} className={cn("line-clamp-2 text-sm", !acknowledged ? "font-bold" : "font-medium")}>
          <span className={p.text}>{l[priority]}</span>
          <span aria-hidden="true" className="text-muted-foreground">
            {" "}
            ·{" "}
          </span>
          <span className="sr-only">: </span>
          {title}
        </p>
        <p id={`${id}-meta`} className="text-xs text-muted-foreground">
          {[source, time, state].filter(Boolean).join(" · ")}
        </p>
      </div>
      {/* Actions wrap under the text when the row is narrow, instead of squeezing the title. */}
      <div className="ml-auto flex shrink-0 gap-2 empty:hidden">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent"
          >
            {action.label}
          </button>
        )}
        {!acknowledged && onAcknowledge && (
          <button
            type="button"
            onClick={onAcknowledge}
            className="press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-foreground ring-inset hover:bg-accent"
          >
            {l.acknowledge}
            <span className="sr-only">: {title}</span>
          </button>
        )}
      </div>
    </article>
  )
}

/** Unacknowledged before acknowledged, then priority, then newest first (by list order). Cleared and acknowledged alarms leave the list. */
export function sortAlarms<T extends AlarmData>(alarms: T[]): T[] {
  return alarms
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => a.active || !a.acknowledged)
    .sort((x, y) => Number(x.a.acknowledged) - Number(y.a.acknowledged) || alarmPriority[x.a.priority].rank - alarmPriority[y.a.priority].rank || y.i - x.i)
    .map(({ a }) => a)
}

/** The alarm a compact surface (the control app's island) should show: the first unacknowledged one in list order. */
export const topAlarm = <T extends AlarmData>(alarms: T[]): T | undefined => sortAlarms(alarms).find((a) => !a.acknowledged)

/** Tray edge colour while an alarm is unacknowledged: critical → danger, high → warning, low → none. */
export const alarmEdge = (alarm?: AlarmData) => (alarm?.priority === "critical" ? "danger" : alarm?.priority === "high" ? "warning" : undefined)

type AlarmListProps = {
  alarms: AlarmData[]
  onAcknowledge?: (id: string) => void
  labels?: Partial<AlarmLabels> & {
    title?: string
    summary?: (active: number, unacknowledged: number) => string
    none?: string
  }
  className?: string
}

/**
 * The alarm list: summary, then alarms in order. New critical alarms are announced assertively,
 * others politely, so screen-reader users hear them without moving focus.
 */
export function AlarmList({ alarms, onAcknowledge, labels, className }: AlarmListProps) {
  const l = {
    ...defaultAlarmLabels,
    title: "Alarms",
    none: "No active alarms",
    ...labels,
  }
  const shown = React.useMemo(() => sortAlarms(alarms), [alarms])
  // A cleared alarm fades out (disappear, --motion-fast) instead of vanishing from under the operator's finger.
  const { rendered, done } = usePresenceList(shown, (a) => a.id)
  const unack = shown.filter((a) => !a.acknowledged).length
  const summary = labels?.summary?.(shown.filter((a) => a.active).length, unack) ?? `${shown.filter((a) => a.active).length} active · ${unack} unacknowledged`

  const seen = React.useRef<Set<string> | null>(null)
  const [announce, setAnnounce] = React.useState({ assertive: "", polite: "" })
  React.useEffect(() => {
    const ids = new Set(alarms.map((a) => a.id))
    if (seen.current) {
      const fresh = alarms.filter((a) => a.active && !seen.current!.has(a.id))
      const text = (list: AlarmData[]) => list.map((a) => `${l[a.priority]}: ${a.title}`).join(". ")
      if (fresh.length)
        setAnnounce({
          assertive: text(fresh.filter((a) => a.priority === "critical")),
          polite: text(fresh.filter((a) => a.priority !== "critical")),
        })
    }
    seen.current = ids
    // Labels are stable strings; announcing depends only on which alarms are new.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarms])

  return (
    <section aria-label={l.title} className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-sm font-bold">{l.title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{summary}</span>
      </div>
      {rendered.length === 0 ? (
        <p className="rounded-md bg-card px-4 py-4 text-sm text-muted-foreground ring-1 ring-border">{l.none}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rendered.map(({ item: a, leaving }) => (
            <li
              key={a.id}
              aria-hidden={leaving || undefined}
              className={leaving ? "animate-disappear" : undefined}
              onAnimationEnd={(e) => leaving && e.target === e.currentTarget && done(a.id)}
            >
              <Alarm {...a} labels={labels} onAcknowledge={onAcknowledge ? () => onAcknowledge(a.id) : undefined} />
            </li>
          ))}
        </ul>
      )}
      <div aria-live="assertive" className="sr-only">
        {announce.assertive}
      </div>
      <div aria-live="polite" className="sr-only">
        {announce.polite}
      </div>
    </section>
  )
}
