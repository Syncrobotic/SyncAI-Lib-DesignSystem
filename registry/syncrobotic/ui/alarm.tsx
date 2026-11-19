// @syncrobotic/alarm v0.17.2 · update: npx shadcn add @syncrobotic/alarm --overwrite
"use client"

import * as React from "react"
import { ChevronRight, CircleAlert, OctagonAlert, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence, usePresenceList } from "@/registry/syncrobotic/hooks/use-presence"
import { feedback as signal } from "@/registry/syncrobotic/lib/feedback"

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
  shelve: string
  unshelve: string
  /** Before the time the alarm comes back: "Shelved until 15:30". */
  shelvedUntil: string
}

export const defaultAlarmLabels: AlarmLabels = {
  critical: "Critical",
  high: "High",
  low: "Low",
  unacknowledged: "Unacknowledged",
  acknowledged: "Acknowledged",
  cleared: "Cleared, not acknowledged",
  acknowledge: "Acknowledge",
  shelve: "Shelve",
  unshelve: "Unshelve",
  shelvedUntil: "Shelved until",
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
  /**
   * Shelved by an operator until this time, already formatted ("15:30"). A shelved alarm is out of the live list and
   * silent; the app clears this field when the time comes, and the alarm returns. Critical alarms cannot be shelved.
   */
  shelvedUntil?: string
  /** Suppressed by design: the app's logic says it does not apply now (a docked robot's "not moving"). Counted, not shown. */
  suppressed?: boolean
  /** Out of service: taken off for maintenance by an authorised person. Counted, not shown. */
  outOfService?: boolean
  /** When it was raised, in ms since the epoch. Needed only for flood detection. */
  raisedAt?: number
}

type AlarmProps = Omit<AlarmData, "id"> & {
  /** Shown while unacknowledged. Without it the alarm is read-only (for viewers). */
  onAcknowledge?: () => void
  /** Shows "Shelve" (not on critical alarms). The app asks how long, then sets `shelvedUntil`. */
  onShelve?: () => void
  /** Shows "Unshelve" on a shelved alarm. */
  onUnshelve?: () => void
  /** The corrective action, e.g. "Open camera". */
  action?: { label: string; onClick: () => void }
  labels?: Partial<AlarmLabels>
  className?: string
}

/** One alarm. Unacknowledged: a bar in the priority colour and the word "Unacknowledged"; critical ones are also tinted. Colour stays off everything else. */
export function Alarm({ priority, title, source, time, active, acknowledged, shelvedUntil, onAcknowledge, onShelve, onUnshelve, action, labels, className }: AlarmProps) {
  const l = { ...defaultAlarmLabels, ...labels }
  const p = alarmPriority[priority]
  const Icon = p.icon
  const id = React.useId()
  // Critical alarms cannot be shelved: a stray shelvedUntil on one is ignored, here and in the list.
  const shelved = Boolean(shelvedUntil) && priority !== "critical"
  const state = shelved ? `${l.shelvedUntil} ${shelvedUntil}` : !acknowledged ? (active ? l.unacknowledged : l.cleared) : l.acknowledged
  // A shelved alarm is quiet: no bar, no tint, no acknowledge; only the way back.
  const loud = !acknowledged && !shelved
  return (
    <article
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-meta`}
      data-priority={priority}
      data-state={shelved ? "shelved" : !acknowledged ? "unacknowledged" : "acknowledged"}
      className={cn(
        "relative flex min-h-(--h-row) animate-appear flex-wrap items-start gap-x-2 gap-y-2 overflow-hidden rounded-md py-2 pr-2 pl-4",
        loud && active && priority === "critical" ? p.tint : "bg-card ring-1 ring-border",
        className,
      )}
    >
      {loud && <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", p.bar)} />}
      {/* On the title's first line (20 px icon, 20 px line), not the middle of a two- or three-line block. */}
      <Icon aria-hidden="true" className={cn("size-5 shrink-0", p.text)} />
      <div className="flex min-w-0 flex-1 basis-40 flex-col">
        <p id={`${id}-title`} className={cn("line-clamp-2 text-sm", loud ? "font-bold" : "font-medium")}>
          <span className={p.text}>{l[priority]}</span>
          <span aria-hidden="true" className="text-muted-foreground">
            {" "}
            ·{" "}
          </span>
          <span className="sr-only">: </span>
          {title}
        </p>
        <p id={`${id}-meta`} className="text-xs text-muted-foreground">
          {/* Each separator is held to the word after it (no-break space), so a wrapped line never ends on a bare "·". */}
          {[source, time, state].filter(Boolean).join(" \u00b7\u00a0")}
        </p>
      </div>
      {/* Actions wrap under the text when the row is narrow, instead of squeezing the title. */}
      <div className="ml-auto flex shrink-0 gap-2 self-center empty:hidden">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent"
          >
            {action.label}
          </button>
        )}
        {!shelved && onShelve && priority !== "critical" && (
          <button
            type="button"
            onClick={onShelve}
            className="press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent"
          >
            {l.shelve}
            <span className="sr-only">: {title}</span>
          </button>
        )}
        {shelved && onUnshelve && (
          <button
            type="button"
            onClick={onUnshelve}
            className="press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-border ring-inset hover:bg-accent"
          >
            {l.unshelve}
            <span className="sr-only">: {title}</span>
          </button>
        )}
        {loud && onAcknowledge && (
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

/** Shelved, unless it is critical: critical alarms cannot be shelved, whatever the data says. */
const isShelved = (a: AlarmData) => Boolean(a.shelvedUntil) && a.priority !== "critical"

/**
 * The live list: unacknowledged before acknowledged, then priority, then newest first (by list order). Cleared and
 * acknowledged alarms leave it, and so do shelved, suppressed and out-of-service ones (AlarmList shows those apart).
 */
export function sortAlarms<T extends AlarmData>(alarms: T[]): T[] {
  return alarms
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => (a.active || !a.acknowledged) && !isShelved(a) && !a.suppressed && !a.outOfService)
    .sort((x, y) => Number(x.a.acknowledged) - Number(y.a.acknowledged) || alarmPriority[x.a.priority].rank - alarmPriority[y.a.priority].rank || y.i - x.i)
    .map(({ a }) => a)
}

/** The alarm a compact surface (the control app's island) should show: the first unacknowledged one in list order. */
export const topAlarm = <T extends AlarmData>(alarms: T[]): T | undefined => sortAlarms(alarms).find((a) => !a.acknowledged)

/** Tray edge colour while an alarm is unacknowledged: critical → danger, high → warning, low → none. */
export const alarmEdge = (alarm?: AlarmData) => (alarm?.priority === "critical" ? "danger" : alarm?.priority === "high" ? "warning" : undefined)

/** How often an unacknowledged critical alarm sounds again (ms). It repeats until someone acknowledges it. */
export const CRITICAL_REPEAT_MS = 10_000

/**
 * The live part every alarm surface shares, so the phone's island and the dashboard's list behave the same: for an
 * alarm that newly enters the live list (raised, or back from shelving), buzz and sound by priority; keep sounding
 * while a critical alarm is unacknowledged; and say what arrived to screen readers. Shelved, suppressed and
 * out-of-service alarms are not live, so they stay silent. In a flood only the count is announced. Turn `feedback`
 * off on all but one surface per screen, so a phone that shows two does not buzz twice.
 */
export function useAlarmSignals(
  alarms: AlarmData[],
  { feedback = true, flooding = false, labels }: { feedback?: boolean; flooding?: boolean; labels?: Partial<AlarmLabels> & { many?: (n: number) => string } },
) {
  const live = React.useMemo(() => sortAlarms(alarms), [alarms])
  const seen = React.useRef<Set<string> | null>(null)
  const [announce, setAnnounce] = React.useState({ assertive: "", polite: "" })
  React.useEffect(() => {
    const l = { ...defaultAlarmLabels, many: (n: number) => `${n} new alarms`, ...labels }
    const ids = new Set(live.map((a) => a.id))
    if (seen.current) {
      const fresh = live.filter((a) => a.active && !a.acknowledged && !seen.current!.has(a.id))
      const critical = fresh.some((a) => a.priority === "critical")
      if (feedback && critical) signal("alarmCritical")
      else if (feedback && fresh.some((a) => a.priority === "high")) signal("alarmHigh")
      const text = (list: AlarmData[]) => list.map((a) => `${l[a.priority]}: ${a.title}`).join(". ")
      // In a flood, or when many arrive at once: one count, not a minute of titles read aloud; assertive only for critical.
      if (fresh.length && (flooding || fresh.length > 5))
        setAnnounce(critical ? { assertive: l.many(fresh.length), polite: "" } : { assertive: "", polite: l.many(fresh.length) })
      else if (fresh.length) setAnnounce({ assertive: text(fresh.filter((a) => a.priority === "critical")), polite: text(fresh.filter((a) => a.priority !== "critical")) })
    }
    seen.current = ids
    // Labels are stable strings; signals depend only on which alarms are newly live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])
  // Critical keeps sounding until acknowledged (the Alarms foundation's promise), not only once when raised.
  const ringing = feedback && live.some((a) => a.priority === "critical" && a.active && !a.acknowledged)
  React.useEffect(() => {
    if (!ringing) return
    const t = setInterval(() => signal("alarmCritical"), CRITICAL_REPEAT_MS)
    return () => clearInterval(t)
  }, [ringing])
  return announce
}

/** The two live regions an alarm surface keeps mounted, so announcements are heard even when the surface is empty. */
export function AlarmAnnouncer({ announce }: { announce: { assertive: string; polite: string } }) {
  return (
    <>
      <div aria-live="assertive" className="sr-only">
        {announce.assertive}
      </div>
      <div aria-live="polite" className="sr-only">
        {announce.polite}
      </div>
    </>
  )
}

type AlarmListProps = {
  alarms: AlarmData[]
  onAcknowledge?: (id: string) => void
  onShelve?: (id: string) => void
  onUnshelve?: (id: string) => void
  labels?: Partial<AlarmLabels> & {
    title?: string
    summary?: (active: number, unacknowledged: number) => string
    none?: string
    /** "Shelved · 2" */
    shelvedGroup?: (count: number) => string
    /** "2 suppressed by design · 1 out of service" */
    hidden?: (suppressed: number, outOfService: number) => string
    /** The flood banner. */
    flood?: (count: number, minutes: number) => string
    /** "18 low alarms" */
    lowGroup?: (count: number) => string
    /** Announced instead of every title when many arrive at once: "23 new alarms". */
    many?: (count: number) => string
  }
  /**
   * More than `count` alarms raised within `minutes` is a flood (ISA-18.2: over 10 in 10 minutes per operator). The list
   * says so, keeps critical and high on top and folds low alarms into one row. Needs `raisedAt` on the alarms.
   */
  flood?: { count: number; minutes: number }
  /** The current time in ms, for flood detection. Defaults to the clock; pass it to make a story or test stable. */
  now?: number
  /** Buzz and sound for a new critical or high alarm (the `feedback` patterns). On by default; turn off where the list is a record, not a live feed. */
  feedback?: boolean
  className?: string
}

/**
 * The alarm list: summary, then alarms in order. New critical alarms are announced assertively,
 * others politely, so screen-reader users hear them without moving focus.
 */
export function AlarmList({ alarms, onAcknowledge, onShelve, onUnshelve, labels, flood = { count: 10, minutes: 10 }, now, feedback = true, className }: AlarmListProps) {
  const l = {
    ...defaultAlarmLabels,
    title: "Alarms",
    none: "No active alarms",
    shelvedGroup: (n: number) => `Shelved · ${n}`,
    hidden: (sup: number, oos: number) => [sup && `${sup} suppressed by design`, oos && `${oos} out of service`].filter(Boolean).join(" · "),
    flood: (n: number, m: number) => `Alarm flood: ${n} alarms in ${m} min. Critical and high first; low alarms are grouped.`,
    lowGroup: (n: number) => `${n} low alarm${n === 1 ? "" : "s"}`,
    many: (n: number) => `${n} new alarms`,
    ...labels,
  }
  const shown = React.useMemo(() => sortAlarms(alarms), [alarms])
  // A cleared alarm fades out (disappear, --motion-fast) instead of vanishing from under the operator's finger.
  const { rendered, done } = usePresenceList(shown, (a) => a.id)
  const unack = shown.filter((a) => !a.acknowledged).length
  const shelved = alarms.filter((a) => isShelved(a) && (a.active || !a.acknowledged))
  const suppressed = alarms.filter((a) => a.suppressed && a.active).length
  const outOfService = alarms.filter((a) => a.outOfService && (a.active || !a.acknowledged)).length
  // The clock moves on (every 30 s), so a flood ends when its alarms age out of the window.
  const [clock, setClock] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (now !== undefined) return
    const t = setInterval(() => setClock(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [now])
  const at = now ?? clock
  // Only live alarms count: acknowledged-and-cleared, shelved, suppressed and out-of-service ones are not annunciating.
  const recent = shown.filter((a) => a.raisedAt !== undefined && at - a.raisedAt <= flood.minutes * 60_000).length
  const flooding = recent > flood.count
  // In a flood, unacknowledged low alarms fold into one row so critical and high stay in view.
  const folded = flooding ? rendered.filter(({ item: a }) => a.priority === "low" && !a.acknowledged) : []
  const open = folded.length ? rendered.filter((r) => !folded.includes(r)) : rendered
  const row = ({ item: a, leaving }: (typeof rendered)[number]) => (
    <li
      key={a.id}
      aria-hidden={leaving || undefined}
      className={leaving ? "animate-disappear" : undefined}
      onAnimationEnd={(e) => leaving && e.target === e.currentTarget && done(a.id)}
    >
      <Alarm
        {...a}
        labels={labels}
        onAcknowledge={onAcknowledge ? () => onAcknowledge(a.id) : undefined}
        onShelve={onShelve ? () => onShelve(a.id) : undefined}
      />
    </li>
  )
  const summary = labels?.summary?.(shown.filter((a) => a.active).length, unack) ?? `${shown.filter((a) => a.active).length} active · ${unack} unacknowledged`

  const announce = useAlarmSignals(alarms, { feedback, flooding, labels })

  return (
    <section aria-label={l.title} className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 className="text-sm font-bold">{l.title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{summary}</span>
      </div>
      {flooding && (
        <p className="flex items-start gap-2 rounded-md bg-warning-subtle px-4 py-3 text-sm">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <span className="font-medium">{l.flood(recent, flood.minutes)}</span>
        </p>
      )}
      {rendered.length === 0 ? (
        <p className="rounded-md bg-card px-4 py-4 text-sm text-muted-foreground ring-1 ring-border">{l.none}</p>
      ) : (
        <ul className="flex flex-col gap-2">{open.map(row)}</ul>
      )}
      {folded.length > 0 && (
        <details className="group rounded-md ring-1 ring-border">
          <summary className="press flex min-h-(--h-md) cursor-pointer items-center gap-2 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 transition-transform duration-(--motion-fast) ease-(--ease-standard) group-open:rotate-90" />
            {l.lowGroup(folded.length)}
          </summary>
          <ul className="flex flex-col gap-2 p-2">{folded.map(row)}</ul>
        </details>
      )}
      {shelved.length > 0 && (
        <details className="group rounded-md ring-1 ring-border">
          <summary className="press flex min-h-(--h-md) cursor-pointer items-center gap-2 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 transition-transform duration-(--motion-fast) ease-(--ease-standard) group-open:rotate-90" />
            {l.shelvedGroup(shelved.length)}
          </summary>
          <ul className="flex flex-col gap-2 p-2">
            {shelved.map((a) => (
              <li key={a.id}>
                <Alarm {...a} labels={labels} onUnshelve={onUnshelve ? () => onUnshelve(a.id) : undefined} />
              </li>
            ))}
          </ul>
        </details>
      )}
      {(suppressed > 0 || outOfService > 0) && <p className="px-1 text-xs text-muted-foreground">{l.hidden(suppressed, outOfService)}</p>}
      <AlarmAnnouncer announce={announce} />
    </section>
  )
}
