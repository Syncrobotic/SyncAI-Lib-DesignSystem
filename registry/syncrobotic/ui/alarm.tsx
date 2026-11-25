// @syncrobotic/alarm v0.36.0 · update: npx shadcn add @syncrobotic/alarm --overwrite
"use client"

import * as React from "react"
import { ChevronRight, CloudOff, OctagonAlert, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresenceList } from "@/registry/syncrobotic/hooks/use-presence"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"
import { feedback as signal } from "@/registry/syncrobotic/lib/feedback"
import { DiamondAlert } from "@/registry/syncrobotic/ui/robot-icons"

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
    /** Not used by Alarm since 0.22.0 (rows are never tinted); kept for code that reads it. */
    tint: "bg-danger-subtle",
    bar: "bg-danger",
    border: "border-danger",
    rank: 0,
  },
  high: {
    icon: TriangleAlert,
    text: "text-warning",
    tint: "bg-warning-subtle",
    bar: "bg-warning",
    border: "border-warning",
    rank: 1,
  },
  low: {
    icon: DiamondAlert,
    text: "text-neutral",
    tint: "bg-neutral-subtle",
    bar: "bg-neutral",
    border: "border-neutral",
    rank: 2,
  },
} as const

export type AlarmLabels = {
  critical: string
  high: string
  low: string
  unacknowledged: string
  /** Alone, or before `acknowledgedAt`: "Acknowledged 13:42". */
  acknowledged: string
  /** Cleared before anyone acknowledged it, when `clearedAt` is not given. */
  cleared: string
  /** The same with the time it cleared: "Cleared 14:07, not acknowledged". */
  clearedWhen: (time: string) => string
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
  clearedWhen: (t) => `Cleared ${t}, not acknowledged`,
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
  /** When it was raised, already formatted by the app: "14:02:31". Shown first, in tabular figures. */
  time?: string
  /** The condition is still present. */
  active: boolean
  /** An operator has acknowledged it. */
  acknowledged: boolean
  /** When it was acknowledged, already formatted: "13:42". Shown as "Acknowledged 13:42". */
  acknowledgedAt?: string
  /** When the condition cleared, already formatted ("14:07"). Shown while a cleared alarm waits for acknowledgement. */
  clearedAt?: string
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

/**
 * A short last word ("3" in "Floor 3", "B" in "Hall B") held to the word before it, so it never wraps alone; and each " · "
 * held to the word before it, so a wrapped line never starts on a bare "·".
 */
const keepLastWord = (text: string) => text.replace(/ (\S{1,3})$/, "\u00a0$1").replace(/ \u00b7 /g, "\u00a0\u00b7 ")

// Light row buttons, 44 px on touch (--h-sm). Beside Acknowledge the others are ghost (ring-transparent), so the one thing
// every unacknowledged row asks for is the only box in it; alone in a row (Unshelve) a button keeps its quiet outline.
const rowButton = "press h-(--h-sm) shrink-0 rounded-xs px-3 text-sm font-medium ring-1 ring-inset hover:bg-accent"

/**
 * One alarm, as a row of aligned columns: priority glyph, time, priority word and title (source under it), then state
 * and actions. Colour is only on the glyph and the priority word; rows are never tinted.
 *
 * - Unacknowledged: bold title and a solid bar in the priority's colour.
 * - Cleared, not acknowledged: still bold (it still needs someone), but the bar is dashed: the condition has gone.
 * - Acknowledged: regular weight, muted title, no bar, and when ("Acknowledged 13:42").
 * - Shelved: quiet like acknowledged, with "Shelved until 15:30" and the way back.
 *
 * Narrower than 576 px (its container, not the screen) the columns reflow: the time goes under the title, and the
 * state and buttons get a line of their own.
 */
export function Alarm({
  priority,
  title,
  source,
  time,
  active,
  acknowledged,
  acknowledgedAt,
  clearedAt,
  shelvedUntil,
  onAcknowledge,
  onShelve,
  onUnshelve,
  action,
  labels,
  className,
}: AlarmProps) {
  const l = { ...defaultAlarmLabels, ...labels }
  const p = alarmPriority[priority]
  const Icon = p.icon
  const id = React.useId()
  // Critical alarms cannot be shelved: a stray shelvedUntil on one is ignored, here and in the list.
  const shelved = Boolean(shelvedUntil) && priority !== "critical"
  // A shelved alarm is quiet: no bar, no weight, no acknowledge; only the way back.
  const loud = !acknowledged && !shelved
  const cleared = loud && !active
  const state = shelved
    ? `${l.shelvedUntil} ${shelvedUntil}`
    : !acknowledged
      ? active
        ? l.unacknowledged
        : clearedAt
          ? l.clearedWhen(clearedAt)
          : l.cleared
      : acknowledgedAt
        ? `${l.acknowledged} ${acknowledgedAt}`
        : l.acknowledged
  return (
    <article
      data-slot="alarm"
      aria-labelledby={`${id}-title`}
      aria-describedby={[time && `${id}-time`, source && `${id}-source`, `${id}-state`].filter(Boolean).join(" ")}
      data-priority={priority}
      data-state={shelved ? "shelved" : cleared ? "cleared" : loud ? "unacknowledged" : "acknowledged"}
      className={cn("@container relative w-full animate-appear rounded-md bg-card ring-1 ring-border", className)}
    >
      {/* Solid while the condition is present; dashed once it has cleared and only the acknowledgement is missing. */}
      {loud && (
        <span
          aria-hidden="true"
          className={cn("absolute inset-y-2 left-0 rounded-r-xs", cleared ? cn("border-l-4 border-dashed", p.border) : cn("w-1", p.bar))}
        />
      )}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 py-3 pr-3 pl-4 @xl:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
        {/* A 20 px glyph on the title's 20 px first line, not the middle of a two-line block. */}
        <Icon aria-hidden="true" className={cn("col-start-1 row-start-1 size-5 shrink-0", p.text)} />
        <p
          id={`${id}-title`}
          className={cn("col-start-2 row-start-1 line-clamp-2 text-sm text-pretty @xl:col-start-3", loud ? "font-bold" : "text-muted-foreground")}
        >
          <span className={cn("mr-2 font-medium", p.text)}>{l[priority]}</span>
          <span className="sr-only">: </span>
          {keepLastWord(title)}
        </p>
        {/* Narrow: one line under the title, time first. Wide: the time is its own column and the source sits under the title. */}
        <div className="col-start-2 row-start-2 mt-1 flex min-w-0 flex-wrap gap-x-2 text-xs text-muted-foreground @xl:contents">
          {time && (
            <span id={`${id}-time`} className="font-mono whitespace-nowrap tabular-nums @xl:col-start-2 @xl:row-start-1 @xl:mr-2 @xl:min-w-[8ch] @xl:text-sm">
              {time}
            </span>
          )}
          {time && source && (
            <span aria-hidden="true" className="@xl:hidden">
              ·
            </span>
          )}
          {source && (
            <span id={`${id}-source`} className="min-w-0 @xl:col-start-3 @xl:row-start-2 @xl:mt-1">
              {source}
            </span>
          )}
        </div>
        {/* Narrow: state and buttons on their own line, the buttons at its end. Wide: the last column. */}
        <div className="col-start-2 row-start-3 mt-2 flex flex-wrap items-center justify-between gap-2 @xl:col-start-4 @xl:row-span-2 @xl:row-start-1 @xl:mt-0 @xl:justify-end @xl:self-center">
          <span id={`${id}-state`} className="text-xs text-muted-foreground">
            {state}
          </span>
          <span className="ml-auto flex flex-wrap justify-end gap-2 empty:hidden">
            {action && (
              <button data-slot="alarm-action" type="button" onClick={action.onClick} className={cn(rowButton, "ring-transparent")}>
                {action.label}
              </button>
            )}
            {!shelved && onShelve && priority !== "critical" && (
              <button data-slot="alarm-shelve" type="button" onClick={onShelve} className={cn(rowButton, "ring-transparent")}>
                {l.shelve}
                <span className="sr-only">: {title}</span>
              </button>
            )}
            {shelved && onUnshelve && (
              <button data-slot="alarm-unshelve" type="button" onClick={onUnshelve} className={cn(rowButton, "ring-border")}>
                {l.unshelve}
                <span className="sr-only">: {title}</span>
              </button>
            )}
            {loud && onAcknowledge && (
              <button data-slot="alarm-acknowledge" type="button" data-alarm-acknowledge="" onClick={onAcknowledge} className={cn(rowButton, "ring-input")}>
                {l.acknowledge}
                <span className="sr-only">: {title}</span>
              </button>
            )}
          </span>
        </div>
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
  {
    feedback = true,
    flooding = false,
    ready = true,
    labels,
  }: {
    feedback?: boolean
    flooding?: boolean
    /** False while the alarms are still loading: what arrives with the first load is the starting point, not news. */
    ready?: boolean
    labels?: Partial<AlarmLabels> & { many?: (n: number) => string }
  },
) {
  const live = React.useMemo(() => sortAlarms(alarms), [alarms])
  const seen = React.useRef<Set<string> | null>(null)
  const [announce, setAnnounce] = React.useState({ assertive: "", polite: "" })
  React.useEffect(() => {
    if (!ready) return
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
  }, [live, ready])
  // Critical keeps sounding until acknowledged (the Alarms foundation's promise), not only once when raised.
  const ringing = feedback && ready && live.some((a) => a.priority === "critical" && a.active && !a.acknowledged)
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
  /**
   * "Acknowledge all" in the header: only when you pass it, since a product may require every alarm to be read and
   * acknowledged on its own. Shown while two or more alarms it may take are unacknowledged and in view. It is called with
   * those ids only: never a critical alarm (each is acknowledged on its own row), never shelved, suppressed or
   * out-of-service ones, and the low alarms folded in a flood only while their group is open.
   */
  onAcknowledgeAll?: (ids: string[]) => void
  onShelve?: (id: string) => void
  onUnshelve?: (id: string) => void
  labels?: Partial<AlarmLabels> & {
    title?: string
    summary?: (active: number, unacknowledged: number) => string
    none?: string
    /** The header button while every unacknowledged alarm is in view. */
    acknowledgeAll?: string
    /** The same button when some are out of view (folded low alarms in a flood): "Acknowledge 2 shown". */
    acknowledgeShown?: (count: number) => string
    /** The same button while critical alarms are unacknowledged, which it leaves to their own rows: "Acknowledge 3 non-critical". */
    acknowledgeNonCritical?: (count: number) => string
    /** Announced after "Acknowledge all": "3 alarms acknowledged". */
    acknowledgedCount?: (count: number) => string
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
    /** Read out while the first load runs. */
    loading?: string
    /** The error with no alarms to show: it must not read as "no alarms". */
    errorEmpty?: string
    /** The error while older alarms are still shown. */
    errorStale?: string
    /** "Last updated 13:42" */
    updatedAt?: (time: string) => string
    retry?: string
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
  /**
   * Where the alarms come from. "loading": rows held by placeholders, never "No active alarms". "error": the list says it
   * could not load or update, keeps the alarms it already has (an old list beats an empty one), and offers `onRetry`.
   */
  status?: "ready" | "loading" | "error"
  onRetry?: () => void
  /** When the alarms were last loaded, shown with an error: "Last updated 13:42". */
  updatedAt?: string
  className?: string
}

const groupSummary =
  "press flex min-h-(--h-md) cursor-pointer items-center gap-2 px-4 text-sm font-medium hover:bg-accent [&::-webkit-details-marker]:hidden"
const groupChevron = "size-4 shrink-0 transition-transform duration-(--motion-fast) ease-(--ease-standard) group-open:rotate-90"

/**
 * The alarm list: one panel with a header (title, counts, "Acknowledge all"), the live alarms as rows, then what is not
 * live but never hidden silently: shelved alarms in their own group, suppressed and out-of-service ones counted. New
 * critical alarms are announced assertively, others politely, so screen-reader users hear them without moving focus.
 */
export function AlarmList({
  alarms,
  onAcknowledge,
  onAcknowledgeAll,
  onShelve,
  onUnshelve,
  labels,
  flood = { count: 10, minutes: 10 },
  now,
  feedback = true,
  status: source = "ready",
  onRetry,
  updatedAt,
  className,
}: AlarmListProps) {
  const l = {
    ...defaultAlarmLabels,
    title: "Alarms",
    none: "No active alarms",
    acknowledgeAll: "Acknowledge all",
    acknowledgeShown: (n: number) => `Acknowledge ${n} shown`,
    acknowledgeNonCritical: (n: number) => `Acknowledge ${n} non-critical`,
    acknowledgedCount: (n: number) => `${n} alarm${n === 1 ? "" : "s"} acknowledged`,
    shelvedGroup: (n: number) => `Shelved · ${n}`,
    hidden: (sup: number, oos: number) => [sup && `${sup} suppressed by design`, oos && `${oos} out of service`].filter(Boolean).join(" · "),
    flood: (n: number, m: number) => `Alarm flood: ${n} alarms in ${m} min. Critical and high first; low alarms are grouped.`,
    lowGroup: (n: number) => `${n} low alarm${n === 1 ? "" : "s"}`,
    many: (n: number) => `${n} new alarms`,
    loading: "Loading alarms",
    errorEmpty: "Could not load alarms. There may be alarms you cannot see here.",
    errorStale: "Could not update alarms. This list may be out of date.",
    updatedAt: (t: string) => `Last updated ${t}`,
    retry: "Try again",
    ...labels,
  }
  const loading = source === "loading" && alarms.length === 0
  const failed = source === "error"
  const headingId = React.useId()
  const heading = React.useRef<HTMLHeadingElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const shown = React.useMemo(() => sortAlarms(alarms), [alarms])
  // A cleared alarm fades out (disappear, --motion-fast) instead of vanishing from under the operator's finger.
  const { rendered, done } = usePresenceList(shown, (a) => a.id)
  const unack = shown.filter((a) => !a.acknowledged).length
  const shelved = alarms.filter((a) => isShelved(a) && (a.active || !a.acknowledged))
  const suppressed = alarms.filter((a) => a.suppressed && a.active).length
  const outOfService = alarms.filter((a) => a.outOfService && (a.active || !a.acknowledged)).length
  // The clock moves on (every 30 s), so a flood ends when its alarms age out of the window. Null until hydrated: the
  // server's clock is not the browser's, so the server and the first render in the browser both count no flood.
  const clock = useNow(now === undefined ? 30_000 : null)
  const at = now ?? clock
  // Only live alarms count: acknowledged-and-cleared, shelved, suppressed and out-of-service ones are not annunciating.
  const recent = at === null ? 0 : shown.filter((a) => a.raisedAt !== undefined && at - a.raisedAt <= flood.minutes * 60_000).length
  const flooding = recent > flood.count
  // In a flood, unacknowledged low alarms fold into one row so critical and high stay in view.
  const folded = flooding ? rendered.filter(({ item: a }) => a.priority === "low" && !a.acknowledged) : []
  const open = folded.length ? rendered.filter((r) => !folded.includes(r)) : rendered
  const [lowOpen, setLowOpen] = React.useState(false)

  // Acknowledge all takes only what the operator can see: the live rows, and the folded low ones while their group is open.
  // Never a critical alarm: each one is read and acknowledged on its own row (ISA-18.2).
  const inViewRows = [...open, ...(lowOpen ? folded : [])].filter((r) => !r.leaving && !r.item.acknowledged)
  const inView = inViewRows.filter((r) => r.item.priority !== "critical").map((r) => r.item.id)
  const criticalLeft = inViewRows.some((r) => r.item.priority === "critical")
  const [status, setStatus] = React.useState("")

  // After an Acknowledge button leaves (its alarm was acknowledged), focus goes to the next one, or to the heading,
  // so a keyboard user is never dropped at the top of the page.
  const refocus = React.useRef(false)
  React.useEffect(() => {
    if (!refocus.current) return
    if (document.activeElement && document.activeElement !== document.body) return
    refocus.current = false
    const next = listRef.current?.querySelector<HTMLElement>("[data-alarm-acknowledge]")
    ;(next ?? heading.current)?.focus()
  }, [shown])

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
        className="rounded-none bg-transparent ring-0"
        onAcknowledge={
          onAcknowledge
            ? () => {
                refocus.current = true
                onAcknowledge(a.id)
              }
            : undefined
        }
        onShelve={onShelve ? () => onShelve(a.id) : undefined}
      />
    </li>
  )
  const active = shown.filter((a) => a.active).length
  const summary = labels?.summary?.(active, unack) ?? `${active} active · ${unack} unacknowledged`
  const hidden = suppressed > 0 || outOfService > 0

  const announce = useAlarmSignals(alarms, { feedback, flooding, labels, ready: !loading })

  return (
    <section data-slot="alarm-list" aria-labelledby={headingId} aria-busy={loading || undefined} className={cn("@container w-full overflow-hidden rounded-md bg-card ring-1 ring-border", className)}>
      {/* The button keeps the title's line; on a narrow panel the counts go under the title rather than the button under everything. */}
      <div className="flex min-h-(--h-row) items-center justify-between gap-3 border-b border-border px-4 py-2">
        <div className="flex min-w-0 flex-col @md:flex-row @md:flex-wrap @md:items-baseline @md:gap-x-2">
          {/* Focusable from script only: where focus lands when the last Acknowledge button goes. */}
          <h2 id={headingId} ref={heading} tabIndex={-1} className="text-sm font-medium">
            {l.title}
          </h2>
          {/* Each part keeps its words together, so a narrow header breaks between "3 active ·" and "2 unacknowledged". */}
          <span className={cn("text-xs text-muted-foreground tabular-nums", (loading || (failed && alarms.length === 0)) && "hidden")}>
            {summary.split(" · ").map((part, i, all) => (
              <React.Fragment key={i}>
                <span className="whitespace-nowrap">
                  {part}
                  {i < all.length - 1 && " ·"}
                </span>
                {i < all.length - 1 && " "}
              </React.Fragment>
            ))}
          </span>
        </div>
        {onAcknowledgeAll && inView.length >= 2 && (
          <button data-slot="alarm-acknowledge-all"
            type="button"
            onClick={() => {
              onAcknowledgeAll(inView)
              setStatus(l.acknowledgedCount(inView.length))
              // The button leaves with the alarms it acknowledged; the heading keeps the keyboard in the list.
              heading.current?.focus()
            }}
            className={cn(rowButton, "ring-input")}
          >
            {/* Honest about its reach: with critical alarms left to their rows, or alarms folded out of view, it says how many it will take. */}
            {criticalLeft ? l.acknowledgeNonCritical(inView.length) : inView.length < unack ? l.acknowledgeShown(inView.length) : l.acknowledgeAll}
          </button>
        )}
      </div>
      {flooding && (
        <p className="flex items-start gap-2 border-b border-border bg-warning-subtle px-4 py-3 text-sm">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <span className="font-medium">{l.flood(recent, flood.minutes)}</span>
        </p>
      )}
      {failed && (
        // A tint, not solid red (solid red is the emergency stop's). Said once, as an alert: the operator must know the list cannot be trusted.
        <div role="alert" className="flex flex-wrap items-center gap-2 border-b border-border bg-danger-subtle px-4 py-3 text-sm">
          <CloudOff aria-hidden="true" className="size-4 shrink-0 text-danger" />
          <span className="min-w-0 flex-1">
            <span className="font-medium">{alarms.length ? l.errorStale : l.errorEmpty}</span>
            {updatedAt && <span className="block text-xs text-muted-foreground">{l.updatedAt(updatedAt)}</span>}
          </span>
          {onRetry && (
            <button data-slot="alarm-retry" type="button" onClick={onRetry} className={cn(rowButton, "ring-input")}>
              {l.retry}
            </button>
          )}
        </div>
      )}
      {loading ? (
        // Placeholders in the rows' own shape; never "No active alarms" before the alarms are known.
        <ul aria-hidden="true" className="divide-y divide-border">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex min-h-(--h-row) items-center gap-3 px-4 py-3">
              <span className="size-5 shrink-0 animate-breath rounded-xs bg-track" />
              <span className="h-3 w-12 animate-breath rounded-xs bg-track" />
              <span className="h-3 w-1/2 animate-breath rounded-xs bg-track" />
            </li>
          ))}
        </ul>
      ) : rendered.length === 0 ? (
        !failed && <p className="px-4 py-4 text-sm text-muted-foreground">{l.none}</p>
      ) : (
        open.length > 0 && (
          <ul ref={listRef} className="divide-y divide-border">
            {open.map(row)}
          </ul>
        )
      )}
      {folded.length > 0 && (
        <details className="group border-t border-border" onToggle={(e) => setLowOpen(e.currentTarget.open)}>
          <summary className={groupSummary}>
            <ChevronRight aria-hidden="true" className={groupChevron} />
            {l.lowGroup(folded.length)}
          </summary>
          <ul className="divide-y divide-border border-t border-border">{folded.map(row)}</ul>
        </details>
      )}
      {/* Not live, never hidden silently: shelved alarms in their group, the others counted. */}
      {(shelved.length > 0 || hidden) && (
        <div className="border-t border-border bg-muted">
          {shelved.length > 0 && (
            <details className="group">
              <summary className={groupSummary}>
                <ChevronRight aria-hidden="true" className={groupChevron} />
                {l.shelvedGroup(shelved.length)}
              </summary>
              <ul className="divide-y divide-border border-y border-border bg-card">
                {shelved.map((a) => (
                  <li key={a.id}>
                    <Alarm {...a} labels={labels} className="rounded-none bg-transparent ring-0" onUnshelve={onUnshelve ? () => onUnshelve(a.id) : undefined} />
                  </li>
                ))}
              </ul>
            </details>
          )}
          {hidden && <p className="px-4 py-3 text-xs text-muted-foreground">{l.hidden(suppressed, outOfService)}</p>}
        </div>
      )}
      <AlarmAnnouncer announce={announce} />
      <p role="status" className="sr-only">
        {loading ? l.loading : status}
      </p>
    </section>
  )
}
