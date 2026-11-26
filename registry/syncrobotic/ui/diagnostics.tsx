// @syncrobotic/diagnostics v0.40.0 · update: npx shadcn add @syncrobotic/diagnostics --overwrite
"use client"

import * as React from "react"
import { Bot, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount, formatNumber, resolveLocale } from "@/registry/syncrobotic/lib/format-number"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"
import { Bone, LoadingLine } from "@/registry/syncrobotic/shell/skeleton"
import { StatusGlyph, statusText, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { ChipGroup } from "@/registry/syncrobotic/ui/chip-group"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { SearchField } from "@/registry/syncrobotic/ui/search-field"
import { Tree, type TreeNode } from "@/registry/syncrobotic/ui/tree"

/**
 * A `diagnostic_msgs/DiagnosticStatus` level: OK (0), WARN (1), ERROR (2), STALE (3). Stale is also what any status
 * becomes when no update has arrived for `staleAfterMs`.
 */
export type DiagnosticLevel = "ok" | "warn" | "error" | "stale"

/** One of a status's `values`: a reading or a setting, both as text, as ROS sends them. */
export type DiagnosticValue = { key: string; value: string }

/** One `diagnostic_msgs/DiagnosticStatus`, in the shape `diagnosticArrayToStatuses` (in `ros`) gives. */
export type DiagnosticStatus = {
  /**
   * The status's name, also its key. "/" builds the hierarchy, as the diagnostic aggregator writes it:
   * "/Motors/Left wheel" sits under "Motors". A name without "/" ("motor_driver: Left wheel") is a top-level item.
   */
  name: string
  level: DiagnosticLevel
  /** One line: what is wrong, or "OK". */
  message?: string
  /** The device the status is about: a serial number, a CAN id, a hostname. */
  hardwareId?: string
  values?: DiagnosticValue[]
  /**
   * When this browser received the status, in ms since the epoch (`Date.now()` when the message arrived). With it, a
   * status that has not been updated for `staleAfterMs` reads Stale, and each says "updated 12 s ago". Never the
   * message's header stamp: the robot's clock is rarely in step with the browser's.
   */
  receivedAt?: number
}

/** What the panel shows, as `data-state` on its root. */
export type DiagnosticsState = "loading" | "empty" | "live"

/** Which statuses the tree shows: all, or only the ones that are not OK (and the groups above them). */
export type DiagnosticsFilter = "all" | "problems"

export type DiagnosticsLabels = {
  /** The panel's name when there is no `label`. */
  title: string
  ok: string
  warn: string
  error: string
  stale: string
  /** Beside the worst level, at the top: "6 of 24 need attention", or "All 24 OK". */
  summary: (problems: number, total: number, locale: string) => string
  /** The time since a status (or, in the header, the last status) arrived: "updated 12 s ago". */
  updatedAgo: (ms: number, locale: string) => string
  /** Names the filter chips. */
  filter: string
  all: string
  problems: string
  /** Names the search box. */
  search: string
  /** In the empty search box. */
  searchPlaceholder: string
  /** Before a status's hardware ID, for screen readers (the badge shows the ID alone). */
  hardwareId: string
  /** Under an opened status that has no values. */
  noValues: string
  /** A status whose name is empty. */
  unnamed: string
  /** The disclosure button of a group. */
  toggle: (name: string) => string
  /** The disclosure button of a status, which opens its values. */
  details: (name: string) => string
  loading: string
  empty: string
  emptyHint: string
  /** The search matches nothing. */
  noMatch: (query: string) => string
  noMatchHint: string
  /** "Problems" is chosen and every status is OK. */
  noProblems: string
  /** Read out politely when a status turns ERROR. */
  announceError: (name: string, message: string) => string
  /** Read out instead when more than three turn ERROR at once. */
  announceErrors: (count: number) => string
}

export const defaultDiagnosticsLabels: DiagnosticsLabels = {
  title: "Diagnostics",
  ok: "OK",
  warn: "Warning",
  error: "Error",
  stale: "Stale",
  summary: (problems, total, locale) => {
    const f = (n: number) => formatCount(n, { locale })
    if (problems === 0) return `${f(total)} ${total === 1 ? "status" : "statuses"}, nothing needs attention`
    return `${f(problems)} of ${f(total)} ${problems === 1 ? "needs" : "need"} attention`
  },
  updatedAgo: (ms, locale) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const f = (n: number) => formatCount(n, { locale })
    if (s < 60) return `updated ${f(s)} s ago`
    if (s < 3600) return `updated ${f(Math.floor(s / 60))} min ago`
    return `updated ${f(Math.floor(s / 3600))} h ago`
  },
  filter: "Show",
  all: "All",
  problems: "Problems",
  search: "Search diagnostics",
  searchPlaceholder: "Filter by name or hardware ID",
  hardwareId: "Hardware ID",
  noValues: "No values",
  unnamed: "(no name)",
  toggle: (name) => `Items under ${name}`,
  details: (name) => `Details of ${name}`,
  loading: "Loading diagnostics…",
  empty: "No diagnostics yet",
  emptyHint: "The robot's hardware and software checks show here once it publishes them.",
  noMatch: (query) => `Nothing matches “${query}”`,
  noMatchHint: "Search looks at the names and hardware IDs.",
  noProblems: "Nothing needs attention: every status is OK.",
  announceError: (name, message) => (message ? `Error: ${name}, ${message}` : `Error: ${name}`),
  announceErrors: (count) => `${count} new errors`,
}

// --- The model: pure, exported for tests and for apps that summarise elsewhere (a fleet table's health column) ---------

/**
 * How bad a level is, for the roll-up and the summary's order. Stale outranks a warning: no news could be hiding anything.
 * Unlike the ROS aggregator, which turns a partly stale group into ERROR, a group with a stale child reads Stale: an
 * update that stopped is not a fault, and saying Error would send someone to fix the wrong thing.
 */
export const diagnosticRank: Record<DiagnosticLevel, number> = { ok: 0, warn: 1, stale: 2, error: 3 }

/** The levels from worst to best, the order the summary counts them in. */
export const diagnosticLevels: DiagnosticLevel[] = ["error", "stale", "warn", "ok"]

/** The worse of two levels. */
export const worseLevel = (a: DiagnosticLevel, b: DiagnosticLevel): DiagnosticLevel => (diagnosticRank[b] > diagnosticRank[a] ? b : a)

/**
 * A status's level now: its own, or Stale when it has a `receivedAt` and nothing newer arrived within `staleAfterMs` of
 * `now`. Without `now` (before the panel has read the clock) nothing is timed out.
 */
export function diagnosticLevelOf(status: DiagnosticStatus, now: number | undefined, staleAfterMs: number): DiagnosticLevel {
  if (status.level === "stale") return "stale"
  if (now !== undefined && status.receivedAt !== undefined && Number.isFinite(staleAfterMs) && now - status.receivedAt > staleAfterMs) return "stale"
  return status.level
}

/** One node of the hierarchy: a status, a group the names imply ("Motors" in "/Motors/Left wheel"), or both. */
export type DiagnosticsNode = {
  /** The path: "/Motors/Left wheel" for a named status, or the segments joined with "/" for a group. */
  id: string
  /** The last segment: "Left wheel". */
  name: string
  /** The status at this path, if one was sent for it. */
  status?: DiagnosticStatus
  /** The status's own level now (stale by time included); undefined for a group with no status of its own. */
  ownLevel?: DiagnosticLevel
  /** The worst of its own level and every level under it. */
  level: DiagnosticLevel
  children: DiagnosticsNode[]
}

const segmentsOf = (name: string) => name.split("/").filter((s) => s.trim() !== "")

/** A status's node id (its path, "/Motors/Left wheel"), for `defaultExpanded`: the name with empty segments dropped. */
export const diagnosticsId = (name: string) => "/" + (segmentsOf(name).join("/") || name)

/**
 * The statuses as a tree by their names' "/" paths, each node's level rolled up from everything under it. Siblings keep the
 * order their first status arrived in, so rows do not jump as levels change. A name sent twice keeps the last.
 */
export function buildDiagnosticsTree(statuses: DiagnosticStatus[], options: { now?: number; staleAfterMs?: number } = {}): DiagnosticsNode[] {
  const { now, staleAfterMs = 5000 } = options
  const roots: DiagnosticsNode[] = []
  const byId = new Map<string, DiagnosticsNode>()
  const nodeAt = (segments: string[]): DiagnosticsNode => {
    const id = "/" + segments.join("/")
    let node = byId.get(id)
    if (!node) {
      node = { id, name: segments[segments.length - 1] ?? "", level: "ok", children: [] }
      byId.set(id, node)
      if (segments.length > 1) nodeAt(segments.slice(0, -1)).children.push(node)
      else roots.push(node)
    }
    return node
  }
  for (const status of statuses) {
    const segments = segmentsOf(status.name)
    // An empty name ("", "/") is still a status: it gets a row of its own, under its name as sent.
    const node = segments.length ? nodeAt(segments) : nodeAt([status.name])
    node.status = status
    node.ownLevel = diagnosticLevelOf(status, now, staleAfterMs)
  }
  const roll = (node: DiagnosticsNode): DiagnosticLevel => {
    let level = node.ownLevel ?? "ok"
    for (const child of node.children) level = worseLevel(level, roll(child))
    node.level = level
    return level
  }
  roots.forEach(roll)
  return roots
}

/**
 * The statuses the summary counts: every leaf, and a status with children only when its own level is worse than all of
 * theirs (an aggregator's "missing item" error). A group's status that only repeats its children's is not counted twice.
 */
export function countedDiagnostics(nodes: DiagnosticsNode[]): DiagnosticsNode[] {
  const out: DiagnosticsNode[] = []
  const walk = (node: DiagnosticsNode) => {
    if (node.ownLevel !== undefined) {
      const below = node.children.reduce<DiagnosticLevel | undefined>((worst, c) => (worst === undefined ? c.level : worseLevel(worst, c.level)), undefined)
      if (below === undefined || diagnosticRank[node.ownLevel] > diagnosticRank[below]) out.push(node)
    }
    node.children.forEach(walk)
  }
  nodes.forEach(walk)
  return out
}

/**
 * The tree narrowed: with `problems`, only what is not OK and the groups above it; with `query`, the nodes whose full name
 * or hardware ID contains it (any case), with the groups above them and everything under them.
 */
export function filterDiagnosticsTree(nodes: DiagnosticsNode[], { problems = false, query = "" }: { problems?: boolean; query?: string }): DiagnosticsNode[] {
  const q = query.trim().toLocaleLowerCase()
  const keep = (node: DiagnosticsNode, matched: boolean): DiagnosticsNode | null => {
    if (problems && node.level === "ok") return null
    const hit =
      matched ||
      q === "" ||
      (node.status?.name ?? node.id).toLocaleLowerCase().includes(q) ||
      (node.status?.hardwareId?.toLocaleLowerCase().includes(q) ?? false)
    const children = node.children.map((c) => keep(c, hit)).filter((c): c is DiagnosticsNode => c !== null)
    if (!hit && children.length === 0) return null
    return { ...node, children }
  }
  return nodes.map((n) => keep(n, false)).filter((n): n is DiagnosticsNode => n !== null)
}

// --- The panel ------------------------------------------------------------------------------------------------------

/** The kit's status glyph for each level: hollow circle OK, triangle warning, square error, slashed circle stale. */
const glyph: Record<DiagnosticLevel, Status> = { ok: "normal", warn: "warning", error: "danger", stale: "offline" }
/** A row's word: coloured only for warning and error. OK and Stale stay grey, as calm and offline states do. */
const rowWord: Record<DiagnosticLevel, string> = { ok: "", warn: "font-medium text-warning", error: "font-medium text-danger", stale: "" }

// Errors that arrive within this long of the last announcement are held and read out together, so a cascade of faults is
// one sentence, not a minute of speech.
const ANNOUNCE_GAP_MS = 5000

// A plain number, with an optional sign and an optional unit after it that has no digits: "1204553 ticks", "-8.4 A",
// "64 %", "412". Not a version ("2.4.1"), a hex ID ("0x21"), a number already grouped ("1,204") or a word.
const PLAIN_NUMBER = /^([-+−]?)(0|[1-9]\d*)(?:\.(\d+))?(\s*[^\d\s.,][^\d]*)?$/

/**
 * A status value as people read it: a plain number (with an optional unit) is grouped and written in `locale`
 * ("1204553 ticks" → "1,204,553 ticks" in English, "1.204.553 ticks" in German), keeping its decimals and its sign.
 * Anything else (a version, an ID, a flag, a sentence) is shown exactly as the robot sent it.
 */
export function formatDiagnosticValue(value: string, locale = "en"): string {
  const m = PLAIN_NUMBER.exec(value.trim())
  if (!m) return value
  const [, sign, whole, decimals = "", unit = ""] = m
  const n = Number(`${whole}${decimals ? `.${decimals}` : ""}`)
  if (!Number.isFinite(n)) return value
  const digits = decimals.length
  const text = formatNumber(n, { locale, minimumFractionDigits: digits, maximumFractionDigits: digits })
  return `${sign}${text}${unit}`
}

export type DiagnosticsProps = {
  /** Every status, as the latest of each name (merge arrays as they arrive with `mergeDiagnostics` from `ros`). */
  statuses: DiagnosticStatus[]
  /** The robot's name, written above and naming the panel for screen readers: "AMR-07". */
  label?: string
  /** Waiting for the first diagnostics: a skeleton the size of a short tree. */
  loading?: boolean
  /**
   * A status not updated for this long reads Stale (by its `receivedAt`). 5000 ms by default: diagnostic_updater publishes
   * once a second, and ROS's own aggregator calls a status stale after 5 s. `null` never times out.
   */
  staleAfterMs?: number | null
  /**
   * The time to measure from, in ms since the epoch. Left out, the panel reads the browser's clock once a second while any
   * status has a `receivedAt`. Pass it for a fixed picture (a test, a screenshot, a recorded bag played back).
   */
  now?: number
  /** Which statuses the tree shows, controlled; pair with `onFilterChange`. */
  filter?: DiagnosticsFilter
  /** The filter at first (uncontrolled). */
  defaultFilter?: DiagnosticsFilter
  onFilterChange?: (filter: DiagnosticsFilter) => void
  /** The search text, controlled; pair with `onQueryChange`. */
  query?: string
  /** The search text at first (uncontrolled). */
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  /**
   * Statuses and groups open at first, by name ("/Motors/Left wheel" opens that status's values, "/Motors" the group).
   * Groups with a problem under them open by themselves; this is for anything else.
   */
  defaultExpanded?: string[]
  /**
   * BCP 47 tag for the numbers and the "ago" times ("zh-TW", "de"): pass the app's locale. Left out, English ("en") on the
   * server and in every browser, so the page hydrates cleanly; a tag Intl cannot read falls back to "en".
   */
  locale?: string
  labels?: Partial<DiagnosticsLabels>
  className?: string
}

type Expansion = { opened: string[]; closed: string[] }

/**
 * A robot's hardware and software health as `diagnostic_msgs/DiagnosticArray` reports it, the way rqt_robot_monitor and
 * the diagnostic aggregator show it: the worst level and the counts first, worst on top; then a tree by the names' "/"
 * paths, each group showing the worst level under it. Each status is a glyph and a word (colour only on the two, rows never
 * tinted) with its message, and opens to its hardware ID and values. A status with no update for `staleAfterMs` reads
 * Stale, with how long ago it arrived. "Problems" narrows the tree to what is not OK; search narrows it by name.
 */
export function Diagnostics({
  statuses,
  label,
  loading = false,
  staleAfterMs = 5000,
  now: nowProp,
  filter: filterProp,
  defaultFilter = "all",
  onFilterChange,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  defaultExpanded,
  locale,
  labels: labelsProp,
  className,
}: DiagnosticsProps) {
  const l = { ...defaultDiagnosticsLabels, ...labelsProp }
  const name = label ?? l.title
  const numberLocale = resolveLocale(locale)

  const [filterState, setFilterState] = React.useState(defaultFilter)
  const filter = filterProp ?? filterState
  const setFilter = (next: DiagnosticsFilter) => {
    if (filterProp === undefined) setFilterState(next)
    onFilterChange?.(next)
  }
  const [queryState, setQueryState] = React.useState(defaultQuery)
  const query = queryProp ?? queryState
  const setQuery = (next: string) => {
    if (queryProp === undefined) setQueryState(next)
    onQueryChange?.(next)
  }

  // The clock, read once a second while anything can time out or say how long ago it came. Null until hydrated, so the
  // server and the browser's first render agree (nothing is timed out, no "ago" yet).
  const timed = nowProp === undefined && !loading && statuses.some((s) => s.receivedAt !== undefined)
  const clock = useNow(timed ? 1000 : null)
  const now = nowProp ?? clock ?? undefined

  const tree = buildDiagnosticsTree(statuses, { now, staleAfterMs: staleAfterMs ?? Infinity })
  const counted = countedDiagnostics(tree)
  const counts: Record<DiagnosticLevel, number> = { error: 0, stale: 0, warn: 0, ok: 0 }
  for (const n of counted) counts[n.ownLevel!]++
  const total = counted.length
  const problemCount = total - counts.ok
  const worst = tree.reduce<DiagnosticLevel>((w, n) => worseLevel(w, n.level), "ok")
  const latest = statuses.reduce<number | undefined>((t, s) => (s.receivedAt === undefined ? t : t === undefined ? s.receivedAt : Math.max(t, s.receivedAt)), undefined)

  const filtering = filter === "problems" || query.trim() !== ""
  const shown = filtering ? filterDiagnosticsTree(tree, { problems: filter === "problems", query }) : tree

  // What is open. Groups with a problem under them open by themselves, so the first look lands on it, and a group that turns
  // bad later opens too; what someone opens or closes by hand stays that way. A search or the Problems filter opens every
  // group it keeps; that view remembers its own choices and forgets them when it changes, and the full tree keeps its own.
  const filterKey = filtering ? `${filter}\u0000${query.trim().toLocaleLowerCase()}` : ""
  const [expansion, setExpansion] = React.useState<{ base: Expansion; filtered: Expansion & { key: string } }>(() => {
    const opened = (defaultExpanded ?? []).map(diagnosticsId)
    return { base: { opened, closed: [] }, filtered: { key: filterKey, opened, closed: [] } }
  })
  let current = expansion
  if (filtering && expansion.filtered.key !== filterKey) {
    current = { ...expansion, filtered: { key: filterKey, opened: [], closed: [] } }
    setExpansion(current)
  }
  const mine = filtering ? current.filtered : current.base
  const expandable: { id: string; auto: boolean }[] = []
  const walk = (nodes: DiagnosticsNode[]) => {
    for (const n of nodes) {
      if (n.children.length) expandable.push({ id: n.id, auto: filtering || n.level !== "ok" })
      else if (n.status) expandable.push({ id: n.id, auto: false })
      walk(n.children)
    }
  }
  walk(shown)
  const expanded = expandable.filter((e) => mine.opened.includes(e.id) || (e.auto && !mine.closed.includes(e.id))).map((e) => e.id)
  const onExpandedChange = (next: string[]) => {
    const opening = next.filter((id) => !expanded.includes(id))
    const closing = expanded.filter((id) => !next.includes(id))
    const update = (e: Expansion): Expansion => ({
      opened: [...e.opened.filter((id) => !closing.includes(id)), ...opening],
      closed: [...e.closed.filter((id) => !opening.includes(id)), ...closing],
    })
    setExpansion((s) => (filtering ? { ...s, filtered: { ...s.filtered, ...update(s.filtered) } } : { ...s, base: update(s.base) }))
  }

  // A status that turns ERROR is read out politely, throttled: errors arriving within ANNOUNCE_GAP_MS of the last
  // announcement wait and are read together. What is in error when the panel first has data is the starting point, not news.
  const errorKey = counted
    .filter((n) => n.ownLevel === "error")
    .map((n) => `${n.status!.name}\u0000${n.status!.message ?? ""}`)
    .join("\n")
  const [spoken, setSpoken] = React.useState<{ id: number; errors: [string, string][] } | null>(null)
  const seen = React.useRef<Set<string> | null>(null)
  const pending = React.useRef(new Map<string, string>())
  const lastSpoken = React.useRef(-Infinity)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ready = !loading && statuses.length > 0
  React.useEffect(() => {
    if (!ready) return
    const errors = new Map(errorKey ? errorKey.split("\n").map((line) => line.split("\u0000") as [string, string]) : [])
    if (seen.current) for (const [n, message] of errors) if (!seen.current.has(n)) pending.current.set(n, message)
    seen.current = new Set(errors.keys())
    if (pending.current.size === 0 || timer.current !== undefined) return
    const speak = () => {
      // Within the gap after the last announcement, wait out the rest of it; what else turns ERROR meanwhile joins in.
      const wait = lastSpoken.current + ANNOUNCE_GAP_MS - Date.now()
      if (wait > 0) {
        timer.current = setTimeout(speak, wait)
        return
      }
      timer.current = undefined
      // Only what is still in error when the wait is over: a fault that came and went in a second is not read out late.
      const still = [...pending.current].filter(([n]) => seen.current?.has(n))
      pending.current.clear()
      if (!still.length) return
      lastSpoken.current = Date.now()
      setSpoken((s) => ({ id: (s?.id ?? 0) + 1, errors: still }))
    }
    timer.current = setTimeout(speak, 0)
  }, [errorKey, ready])
  React.useEffect(
    () => () => {
      clearTimeout(timer.current)
      timer.current = undefined
    },
    [],
  )
  const segmentOf = (full: string) => {
    const s = segmentsOf(full)
    return s[s.length - 1] ?? (full || l.unnamed)
  }
  const announcement = spoken
    ? spoken.errors.length > 3
      ? l.announceErrors(spoken.errors.length)
      : spoken.errors.map(([n, m]) => l.announceError(segmentOf(n), m)).join(". ")
    : ""

  const state: DiagnosticsState = loading ? "loading" : statuses.length === 0 ? "empty" : "live"
  const ago = (at: number | undefined) => (now !== undefined && at !== undefined ? l.updatedAgo(Math.max(0, now - at), numberLocale) : null)

  const toTreeNode = (node: DiagnosticsNode): TreeNode => {
    const status = node.status
    const level = node.level
    const text = node.name || l.unnamed
    const timedOut = status && node.ownLevel === "stale" && status.level !== "stale"
    return {
      id: node.id,
      textValue: text,
      label: (
        <span data-slot="diagnostics-row" data-level={level} data-own-level={node.ownLevel} className="flex min-w-0 items-center gap-2">
          <StatusGlyph status={glyph[level]} />
          <span className="min-w-0 truncate">{text}</span>
          {status?.message && <span className="hidden min-w-0 flex-1 basis-0 truncate text-muted-foreground @md:block">{status.message}</span>}
        </span>
      ),
      meta: (
        <span className="flex items-center gap-2">
          {timedOut && <span className="@max-md:sr-only">{ago(status.receivedAt)}</span>}
          <span data-slot="diagnostics-level" className={rowWord[level]}>
            {l[level]}
          </span>
        </span>
      ),
      content: status ? <Details status={status} ago={ago(status.receivedAt)} locale={numberLocale} labels={l} /> : undefined,
      children: node.children.length ? node.children.map(toTreeNode) : undefined,
    }
  }

  return (
    <div
      data-slot="diagnostics"
      data-state={state}
      data-level={state === "live" ? worst : undefined}
      role="region"
      aria-label={name}
      aria-busy={loading || undefined}
      className={cn("@container flex flex-col gap-4 text-sm", className)}
    >
      {/* Spoken when a status turns ERROR. A new key per announcement, so the same words said again are heard again. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement && <span key={spoken?.id}>{announcement}</span>}
      </div>

      <div data-slot="diagnostics-header" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 font-medium">{name}</p>
        {state === "live" && ago(latest) && <p className="text-muted-foreground tabular-nums">{ago(latest)}</p>}
      </div>

      {state === "loading" ? (
        <div className="flex flex-col gap-3">
          <LoadingLine>{l.loading}</LoadingLine>
          <div aria-hidden="true" className="flex flex-col gap-3">
            <Bone className="h-6 w-48" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex h-(--h-sm) items-center gap-2">
                <Bone className="size-4" />
                <Bone className={cn("h-4", i % 2 ? "w-32" : "w-48")} />
              </div>
            ))}
          </div>
        </div>
      ) : state === "empty" ? (
        <EmptyState icon={Bot} title={l.empty} description={l.emptyHint} />
      ) : (
        <>
          <div data-slot="diagnostics-summary" className="flex flex-col gap-2">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusGlyph status={glyph[worst]} className="size-4" />
              <span className={cn("text-lg font-bold", statusText[glyph[worst]])}>{l[worst]}</span>
              <span className="text-muted-foreground tabular-nums">{l.summary(problemCount, total, numberLocale)}</span>
            </p>
            {/* The counts, worst first; a level nothing is at is left out. */}
            <ul role="list" className="flex flex-wrap gap-x-4 gap-y-1">
              {diagnosticLevels
                .filter((level) => counts[level] > 0)
                .map((level) => (
                  <li key={level} data-level={level} className="flex items-center gap-2">
                    <StatusGlyph status={glyph[level]} />
                    <span className="font-medium tabular-nums">{formatCount(counts[level], { locale: numberLocale })}</span>
                    <span className={cn(level === "ok" || level === "stale" ? "text-muted-foreground" : statusText[glyph[level]])}>{l[level]}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 @lg:flex-row @lg:items-center">
            <SearchField
              label={l.search}
              placeholder={l.searchPlaceholder}
              hotkey={null}
              value={query}
              onValueChange={setQuery}
              className="@lg:flex-1"
            />
            <ChipGroup
              label={l.filter}
              value={filter}
              allowNone={false}
              onValueChange={(v) => v && setFilter(v as DiagnosticsFilter)}
              locale={numberLocale}
              items={[
                { value: "all", label: l.all, count: total },
                { value: "problems", label: l.problems, count: problemCount },
              ]}
              className="shrink-0"
            />
          </div>

          {/* Said here rather than through the tree's `empty`, which is a line of text: no match gets the kit's empty state. */}
          {shown.length === 0 ? (
            query.trim() !== "" ? (
              <EmptyState icon={SearchX} title={l.noMatch(query.trim())} description={l.noMatchHint} />
            ) : (
              <p className="py-2 text-muted-foreground">{l.noProblems}</p>
            )
          ) : (
            <Tree
              label={name}
              items={shown.map(toTreeNode)}
              expanded={expanded}
              onExpandedChange={onExpandedChange}
              labels={{ toggle: l.toggle, details: l.details }}
            />
          )}
        </>
      )}
    </div>
  )
}

/** An opened status: its whole message, its hardware ID, when it arrived and its values. */
function Details({ status, ago, locale, labels: l }: { status: DiagnosticStatus; ago: string | null; locale: string; labels: DiagnosticsLabels }) {
  const values = status.values ?? []
  return (
    <div data-slot="diagnostics-details" className="flex flex-col gap-2">
      {(status.message || status.hardwareId || ago) && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {status.message && <span className="min-w-0 wrap-anywhere">{status.message}</span>}
          {status.hardwareId && (
            <Badge tone="outline" className="font-mono">
              <span className="sr-only">{l.hardwareId} </span>
              {status.hardwareId}
            </Badge>
          )}
          {ago && <span className="text-muted-foreground tabular-nums">{ago}</span>}
        </p>
      )}
      {values.length ? (
        <DescriptionList
          columns={2}
          items={values.map((v) => ({ label: v.key, value: <span className="wrap-anywhere tabular-nums">{formatDiagnosticValue(v.value, locale)}</span> }))}
        />
      ) : (
        <p className="text-muted-foreground">{l.noValues}</p>
      )}
    </div>
  )
}
