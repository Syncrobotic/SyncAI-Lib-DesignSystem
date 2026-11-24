// @syncrobotic/log-viewer v0.32.0 · update: npx shadcn add @syncrobotic/log-viewer --overwrite
"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowDownToLine, Bug, ChevronDown, ChevronRight, ChevronUp, CircleAlert, Ellipsis, Info, OctagonAlert, ScrollText, Search, SearchX, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePresence } from "@/registry/syncrobotic/hooks/use-presence"
import { Button } from "@/registry/syncrobotic/ui/button"
import { CopyButton, copyText } from "@/registry/syncrobotic/ui/copy-button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/registry/syncrobotic/ui/input-group"

/*
  A log viewer for robot and system logs (ROS /rosout, journald, a service's own lines): a virtual list that stays smooth
  with 100,000 lines, follows the newest line until someone scrolls up, and keeps at most `maxLines` in a ring buffer.

  Data comes in two ways. `lines` is an array prop: one that only grows (or a new array with more lines at the end)
  appends, anything else replaces. For a stream, append outside React: `createLogBuffer()` (pass it as `buffer`, append
  from a ROS callback) or the `ref` handle's `append`. Appends are batched (every 100 ms by default), so a topic at
  1,000 lines a second renders ten times a second, not a thousand.

  Accessibility: a grid, not role="log". A log region announces every line added to it, and a virtual list adds and
  removes lines as it scrolls, so it would read the log aloud while someone scrolls. A grid names its size
  (aria-rowcount) and each line's place in it (aria-rowindex) although only the lines in view exist, and gives the
  keyboard one Tab stop with the arrow keys inside. New lines are announced on their own, at most every 5 s, and only
  errors by default (`announce`).
*/

// ---------- Lines and levels ----------

export const logLevels = ["debug", "info", "warn", "error", "fatal"] as const
export type LogLevel = (typeof logLevels)[number]

/** One line. `time` in ms since the epoch; the rest as the source writes it. */
export type LogLine = {
  /** Optional: a stable id, for `defaultExpanded`. The viewer numbers lines itself. */
  id?: string | number
  time: number
  level: LogLevel
  /** The node (ROS `name`), unit, service or process that wrote it. */
  source?: string
  message: string
  file?: string
  function?: string
  line?: number
  /** Any other fields to show when the line is opened: a PID, a robot, a topic. */
  fields?: Record<string, string | number | boolean>
}

/**
 * Each level by shape and word, the kit's status language: colour only on the glyph and the word, never on the row.
 * Debug and info are calm (grey), told apart by shape; warn is warning; error and fatal are danger, told apart by shape
 * (a circle, the critical octagon) and fatal's bold word.
 */
export const logLevel: Record<LogLevel, { icon: LucideIcon; text: string; rank: number }> = {
  debug: { icon: Bug, text: "text-muted-foreground", rank: 0 },
  info: { icon: Info, text: "text-muted-foreground", rank: 1 },
  warn: { icon: TriangleAlert, text: "text-warning", rank: 2 },
  error: { icon: CircleAlert, text: "text-danger", rank: 3 },
  fatal: { icon: OctagonAlert, text: "text-danger font-bold", rank: 4 },
}

const isLevel = (v: unknown): v is LogLevel => typeof v === "string" && v in logLevel

export type LogViewerLabels = {
  /** The grid's name. */
  name: string
  debug: string
  info: string
  warn: string
  error: string
  fatal: string
  /** Column names, read by screen readers. */
  time: string
  level: string
  source: string
  message: string
  search: string
  searchPlaceholder: string
  /** Beside the search box: "3 of 120", or how many lines match before one is picked. */
  matches: (current: number, total: number, locale: string | undefined) => string
  previousMatch: string
  nextMatch: string
  /** The level menu's button: all, one or a few by name, or how many. */
  levels: string
  allLevels: string
  levelCount: (n: number) => string
  sources: string
  allSources: string
  sourceCount: (n: number) => string
  /** Shown in a menu item beside a level or a source. */
  count: (n: number, locale: string | undefined) => string
  viewOptions: string
  wrap: string
  relativeTime: string
  /** The footer's button while scrolled up: with how many new lines arrived, or without. */
  jumpToLatest: string
  newLines: (n: number, locale: string | undefined) => string
  following: string
  paused: string
  /** Footer: all lines, or the lines the filters show of them. */
  total: (shown: number, total: number, locale: string | undefined) => string
  /** Footer, once the buffer is full: older lines are being dropped. */
  capped: (max: number, locale: string | undefined) => string
  empty: string
  noMatch: string
  showAll: string
  /** The footer's copy button, shown while several lines are selected. */
  copyLines: (n: number) => string
  copied: string
  copyFailed: string
  copiedLines: (n: number) => string
  copyLine: string
  /** A message of several lines, shown on one: what is hidden until the line is opened or wrapped. */
  moreLines: (n: number) => string
  /** Fields of an opened line. */
  location: string
  function: string
  /** Relative time, "4.2 s ago". */
  ago: (ms: number, locale: string | undefined) => string
  /** Said at most every 5 s while lines stream in (see `announce`). */
  announce: (counts: { lines: number; errors: number; warnings: number }, locale: string | undefined) => string
  /** How the keyboard works, read once when the grid gets focus. */
  keys: string
}

const plural = (n: number, one: string, many: string, locale: string | undefined) => `${n.toLocaleString(locale)} ${n === 1 ? one : many}`

export const defaultLogViewerLabels: LogViewerLabels = {
  name: "Log",
  debug: "Debug",
  info: "Info",
  warn: "Warn",
  error: "Error",
  fatal: "Fatal",
  time: "Time",
  level: "Level",
  source: "Source",
  message: "Message",
  search: "Search the log",
  searchPlaceholder: "Search messages and sources",
  matches: (current, total, locale) =>
    total === 0 ? "No matches" : current ? `${current.toLocaleString(locale)} of ${total.toLocaleString(locale)}` : plural(total, "match", "matches", locale),
  previousMatch: "Previous match",
  nextMatch: "Next match",
  levels: "Levels",
  allLevels: "All levels",
  levelCount: (n) => `${n} levels`,
  sources: "Sources",
  allSources: "All sources",
  sourceCount: (n) => `${n} sources`,
  count: (n, locale) => n.toLocaleString(locale),
  viewOptions: "View options",
  wrap: "Wrap long lines",
  relativeTime: "Show time ago",
  jumpToLatest: "Jump to latest",
  newLines: (n, locale) => `${n.toLocaleString(locale)} new`,
  following: "Following new lines",
  paused: "Paused",
  total: (shown, total, locale) => (shown === total ? plural(total, "line", "lines", locale) : `${shown.toLocaleString(locale)} of ${plural(total, "line", "lines", locale)}`),
  capped: (max, locale) => `keeps the last ${max.toLocaleString(locale)}`,
  empty: "No log lines yet",
  noMatch: "No lines match the filters",
  showAll: "Show all lines",
  copyLines: (n) => (n === 1 ? "Copy line" : `Copy ${n} lines`),
  copied: "Copied",
  copyFailed: "Could not copy: select the text and copy it",
  copiedLines: (n) => (n === 1 ? "Copied 1 line" : `Copied ${n} lines`),
  copyLine: "Copy line",
  moreLines: (n) => `+${n} ${n === 1 ? "line" : "lines"}`,
  location: "Location",
  function: "Function",
  ago: (ms, locale) => {
    const s = Math.max(0, ms) / 1000
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "narrow" })
    if (s < 60) return rtf.format(-Number(s.toFixed(s < 10 ? 1 : 0)), "second")
    if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute")
    if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour")
    return rtf.format(-Math.floor(s / 86400), "day")
  },
  announce: ({ lines, errors, warnings }, locale) =>
    [plural(lines, "new line", "new lines", locale), errors && plural(errors, "error", "errors", locale), warnings && plural(warnings, "warning", "warnings", locale)]
      .filter(Boolean)
      .join(", "),
  keys: "Up and down arrows move between lines, Shift with them selects lines, Enter opens a line, C copies, End goes to the latest line, slash searches.",
}

// ---------- The buffer ----------

export type LogBufferSnapshot = {
  /** Changes on every commit, so a component can memoize on it. */
  version: number
  /** Lines held. */
  size: number
  /** The sequence number of the oldest line held; `next` is the one the next line will get. */
  first: number
  next: number
  /** The most lines held. */
  maxLines: number
  /** Lines dropped from the front so far because the buffer was full. */
  dropped: number
  /** Lines held per level. */
  counts: Readonly<Record<LogLevel, number>>
}

export type LogBuffer = {
  /** Queues lines; they are committed together within `flushMs`. */
  append(lines: LogLine | readonly LogLine[]): void
  /** Commits queued lines now. */
  flush(): void
  clear(): void
  /** The line with this sequence number, while it is still held. */
  get(seq: number): LogLine | undefined
  setMaxLines(max: number): void
  /** Lines ever committed per level, dropped ones included (for announcements). */
  totals(): Record<LogLevel, number>
  subscribe(listener: () => void): () => void
  getSnapshot(): LogBufferSnapshot
}

const zeroCounts = (): Record<LogLevel, number> => ({ debug: 0, info: 0, warn: 0, error: 0, fatal: 0 })

/**
 * A ring buffer of log lines outside React. Keeps the newest `maxLines` (default 10,000) and drops the oldest; numbers
 * every line in order (its sequence number), so a line keeps its identity while older ones are dropped. Appends are
 * queued and committed at most every `flushMs` (default 100; 0 commits at once), then subscribers are told once.
 */
export function createLogBuffer(options: { maxLines?: number; flushMs?: number; lines?: readonly LogLine[] } = {}): LogBuffer {
  let cap = Math.max(1, Math.floor(options.maxLines ?? 10_000))
  let ring: (LogLine | undefined)[] = new Array(cap)
  let head = 0
  let size = 0
  let first = 0
  let dropped = 0
  let pending: LogLine[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  const flushMs = options.flushMs ?? 100
  const counts = zeroCounts()
  const totals = zeroCounts()
  const listeners = new Set<() => void>()
  const snap = (version: number): LogBufferSnapshot => ({ version, size, first, next: first + size, maxLines: cap, dropped, counts: { ...counts } })

  const push = (raw: LogLine) => {
    // A level the viewer does not know (a typo, a new one upstream) reads as info rather than breaking the row.
    const line = isLevel(raw.level) ? raw : { ...raw, level: "info" as const }
    totals[line.level]++
    counts[line.level]++
    if (size < cap) {
      ring[(head + size) % cap] = line
      size++
      return
    }
    const old = ring[head]
    if (old) counts[old.level]--
    ring[head] = line
    head = (head + 1) % cap
    first++
    dropped++
  }
  const publish = () => {
    snapshot = snap(snapshot.version + 1)
    for (const l of [...listeners]) l()
  }
  const flush = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    if (pending.length === 0) return
    const batch = pending
    pending = []
    for (const line of batch) push(line)
    publish()
  }
  for (const line of options.lines ?? []) push(line)
  let snapshot = snap(0)

  return {
    append(lines) {
      const list: readonly LogLine[] = Array.isArray(lines) ? lines : [lines as LogLine]
      if (list.length === 0) return
      // A loop, not push(...list): spreading 100,000 arguments overflows the stack.
      for (const line of list) pending.push(line)
      if (flushMs <= 0) flush()
      else if (timer === undefined) timer = setTimeout(flush, flushMs)
    },
    flush,
    clear() {
      pending = []
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      ring = new Array(cap)
      first += size
      head = 0
      size = 0
      Object.assign(counts, zeroCounts())
      publish()
    },
    get(seq) {
      if (seq < first || seq >= first + size) return undefined
      return ring[(head + (seq - first)) % cap]
    },
    setMaxLines(max) {
      const next = Math.max(1, Math.floor(max))
      if (next === cap) return
      const keep = Math.min(size, next)
      const kept: LogLine[] = []
      for (let i = size - keep; i < size; i++) kept.push(ring[(head + i) % cap]!)
      for (let i = 0; i < size - keep; i++) {
        const old = ring[(head + i) % cap]
        if (old) counts[old.level]--
      }
      dropped += size - keep
      first += size - keep
      cap = next
      ring = new Array(cap)
      kept.forEach((l, i) => (ring[i] = l))
      head = 0
      size = keep
      publish()
    },
    totals: () => ({ ...totals }),
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => snapshot,
  }
}

// ---------- Filtering, search, copy ----------

/** The sequence numbers of the held lines that pass the filters, oldest first. No sources means every source. */
export function filterLog(buffer: Pick<LogBuffer, "get">, snapshot: LogBufferSnapshot, filter: { levels: readonly LogLevel[]; sources?: readonly string[] }): number[] {
  const levels = new Set(filter.levels)
  const sources = filter.sources?.length ? new Set(filter.sources) : null
  const out: number[] = []
  for (let seq = snapshot.first; seq < snapshot.next; seq++) {
    const line = buffer.get(seq)
    if (!line || !levels.has(line.level)) continue
    if (sources && !sources.has(line.source ?? "")) continue
    out.push(seq)
  }
  return out
}

/** A case-insensitive pattern for the search text, or null when it is blank. The text is matched as written, not as a regex. */
export function logQuery(text: string): RegExp | null {
  const q = text.trim()
  return q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null
}

/** Of `seqs`, the lines whose message or source matches. */
export function matchLog(buffer: Pick<LogBuffer, "get">, seqs: readonly number[], query: RegExp | null): number[] {
  if (!query) return []
  const out: number[] = []
  for (const seq of seqs) {
    const line = buffer.get(seq)
    if (line && (query.test(line.message) || (line.source !== undefined && query.test(line.source)))) out.push(seq)
  }
  return out
}

/** The index of the first item >= `value` in an ascending list. */
export function lowerBound(list: readonly number[], value: number): number {
  let lo = 0
  let hi = list.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (list[mid]! < value) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** The match after (`dir` 1) or before (−1) `from`, wrapping round; `from` Infinity starts from the end. */
export function stepMatch(matches: readonly number[], from: number, dir: 1 | -1): number | undefined {
  if (matches.length === 0) return undefined
  if (dir === 1) {
    const i = Number.isFinite(from) ? lowerBound(matches, from + 1) : matches.length
    return matches[i < matches.length ? i : 0]
  }
  const i = (Number.isFinite(from) ? lowerBound(matches, from) : matches.length) - 1
  return matches[i >= 0 ? i : matches.length - 1]
}

/**
 * A line as text for the clipboard, in a form that pastes into a ticket and reads the same everywhere: the time in UTC
 * (ISO 8601), the level, the source, the message, then where it was written.
 */
export function formatLogLine(line: LogLine): string {
  const time = Number.isFinite(line.time) ? new Date(line.time).toISOString() : "-"
  const where = line.file ? ` (${line.file}${line.line !== undefined ? `:${line.line}` : ""}${line.function ? ` in ${line.function}` : ""})` : ""
  return `[${time}] [${line.level.toUpperCase()}]${line.source ? ` [${line.source}]` : ""} ${line.message}${where}`
}

// ---------- Small parts ----------

/** A level's glyph and word; `word` translates it (default the English word). */
export function LogLevelLabel({ level, word, className }: { level: LogLevel; word?: string; className?: string }) {
  const m = logLevel[level]
  const Icon = m.icon
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 text-sm", m.text, className)}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">{word ?? defaultLogViewerLabels[level]}</span>
    </span>
  )
}

/** Text with each match of `query` marked; the current match's marks are inverted. */
function Marked({ text, query, current }: { text: string; query: RegExp | null; current: boolean }) {
  if (!query) return <>{text}</>
  const re = new RegExp(query.source, "gi")
  const out: React.ReactNode[] = []
  let at = 0
  for (const m of text.matchAll(re)) {
    if (m[0] === "") break
    if (m.index > at) out.push(text.slice(at, m.index))
    out.push(
      <mark key={m.index} className={cn("rounded-2xs text-foreground", current ? "bg-foreground text-background" : "bg-track")}>
        {m[0]}
      </mark>,
    )
    at = m.index + m[0].length
  }
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0")

function useFormatters(locale: string | undefined, timeZone: string | undefined) {
  return React.useMemo(() => {
    const clock = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone })
    const day = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", timeZone })
    const zone = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
    const zoneName = (t: number) => zone.formatToParts(t).find((p) => p.type === "timeZoneName")?.value ?? ""
    // Milliseconds are written by hand: fractionalSecondDigits is missing from older Safari.
    const ms = (t: number) => pad(((t % 1000) + 1000) % 1000, 3)
    return {
      time: (t: number) => (Number.isFinite(t) ? `${clock.format(t)}.${ms(t)}` : "–"),
      full: (t: number) => (Number.isFinite(t) ? `${day.format(t)} ${clock.format(t)}.${ms(t)} ${zoneName(t)}`.trim() : "–"),
    }
  }, [locale, timeZone])
}

/** Re-renders every second while `on`, for "time ago". */
function useNow(on: boolean, given: number | undefined) {
  const [now, setNow] = React.useState(() => given ?? Date.now())
  React.useEffect(() => {
    if (!on || given !== undefined) return
    const tick = () => setNow(Date.now())
    const first = window.setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      window.clearTimeout(first)
      clearInterval(id)
    }
  }, [on, given])
  return given ?? now
}

// ---------- The viewer ----------

export type LogViewerHandle = {
  /** Adds lines (batched, see `createLogBuffer`). */
  append(lines: LogLine | readonly LogLine[]): void
  clear(): void
  /** Scrolls to the newest line and follows again. */
  jumpToLatest(): void
  /** The buffer the viewer reads, to subscribe to or read from. */
  buffer: LogBuffer
}

type Props = {
  /** Lines, oldest first. An array that only grows appends; any other new array replaces what is shown. */
  lines?: readonly LogLine[]
  /** A buffer the app appends to (`createLogBuffer`), instead of `lines`. Its own `maxLines` applies. */
  buffer?: LogBuffer
  /** `append`, `clear` and `jumpToLatest`, for a stream that should not go through React state. */
  ref?: React.Ref<LogViewerHandle>
  /** The most lines kept; the oldest are dropped. Default 10,000. Up to about 200,000 stay smooth. */
  maxLines?: number
  /** The levels shown at first. Default all. */
  defaultLevels?: readonly LogLevel[]
  /** The sources shown at first. Default all. */
  defaultSources?: readonly string[]
  /** Search text at first. */
  defaultQuery?: string
  /** Wrap long messages instead of cutting them at the edge. */
  defaultWrap?: boolean
  /** Clock time (default) or time ago. */
  defaultTimeMode?: "absolute" | "relative"
  /** Lines (by `id`) open at first. */
  defaultExpanded?: readonly (string | number)[]
  /** "Now" for time ago, in ms since the epoch. Without it the viewer reads the clock every second while time ago is on. */
  now?: number
  /** Formats times, and counts. */
  locale?: string
  /** The time zone times are shown in. Default the browser's. */
  timeZone?: string
  /**
   * Announce new lines to screen readers, at most every 5 s: "errors" (default) only when errors or fatal lines arrived,
   * "all" for every batch, false never.
   */
  announce?: false | "errors" | "all"
  /** The viewer's height (it scrolls inside). Default 480. */
  height?: number | string
  labels?: Partial<LogViewerLabels>
  className?: string
}

/**
 * Robot and system logs: a virtual list that stays smooth with 100,000 lines, filtered by level and source, searched with
 * the matches marked, following the newest line until someone scrolls up ("12 new · Jump to latest"). Each line opens to
 * show its whole message and fields; lines are copied one at a time or as a selection.
 */
export function LogViewer({
  lines,
  buffer: given,
  ref,
  maxLines = 10_000,
  defaultLevels = logLevels,
  defaultSources = [],
  defaultQuery = "",
  defaultWrap = false,
  defaultTimeMode = "absolute",
  defaultExpanded,
  now: givenNow,
  locale,
  timeZone,
  announce = "errors",
  height = 480,
  labels,
  className,
}: Props) {
  const l = React.useMemo(() => ({ ...defaultLogViewerLabels, ...labels }), [labels])
  const id = React.useId()
  const [own] = React.useState(() => createLogBuffer({ maxLines, lines: given ? [] : lines }))
  const buffer = given ?? own
  const snapshot = React.useSyncExternalStore(buffer.subscribe, buffer.getSnapshot, buffer.getSnapshot)

  // `lines` that only grew are appended; anything else replaces. Applied before paint, so a new array never flashes.
  const seen = React.useRef<readonly LogLine[] | undefined>(lines)
  React.useLayoutEffect(() => {
    if (given || !lines) return
    const prev = seen.current
    seen.current = lines
    if (prev === lines) return
    const grew = prev && prev.length > 0 && lines.length >= prev.length && lines[0] === prev[0] && lines[prev.length - 1] === prev[prev.length - 1]
    if (!grew) own.clear()
    own.append(grew ? lines.slice(prev.length) : lines)
    own.flush()
  }, [lines, given, own])
  React.useEffect(() => {
    if (!given) own.setMaxLines(maxLines)
  }, [given, own, maxLines])

  const [levels, setLevels] = React.useState<readonly LogLevel[]>(defaultLevels)
  const [sources, setSources] = React.useState<readonly string[]>(defaultSources)
  const [query, setQuery] = React.useState(defaultQuery)
  const [wrap, setWrap] = React.useState(defaultWrap)
  const [timeMode, setTimeMode] = React.useState(defaultTimeMode)
  // Lines opened at first are scrolled to, so following starts only without them.
  const [following, setFollowing] = React.useState(!defaultExpanded?.length)
  // The sequence number the next line got when following stopped: lines from here on are "new".
  const [pausedAt, setPausedAt] = React.useState(() => buffer.getSnapshot().next)
  const [active, setActive] = React.useState<number | null>(null)
  const [anchor, setAnchor] = React.useState<number | null>(null)
  const [current, setCurrent] = React.useState<number | null>(null)
  const [expanded, setExpanded] = React.useState<ReadonlySet<number>>(() => {
    const open = new Set<number>()
    if (!defaultExpanded?.length) return open
    const ids = new Set(defaultExpanded)
    const s = buffer.getSnapshot()
    for (let seq = s.first; seq < s.next; seq++) {
      const line = buffer.get(seq)
      if (line?.id !== undefined && ids.has(line.id)) open.add(seq)
    }
    return open
  })
  const [said, setSaid] = React.useState("")
  const [firstOpen] = React.useState(() => (expanded.size ? Math.min(...expanded) : null))

  const seqs = React.useMemo(() => filterLog(buffer, snapshot, { levels, sources }), [buffer, snapshot, levels, sources])
  const pattern = React.useMemo(() => logQuery(query), [query])
  const matches = React.useMemo(() => matchLog(buffer, seqs, pattern), [buffer, seqs, pattern])
  const now = useNow(timeMode === "relative", givenNow)
  const format = useFormatters(locale, timeZone)
  const rows = React.useRef<RowsHandle>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const newCount = following ? 0 : seqs.length - lowerBound(seqs, pausedAt)
  const follow = (on: boolean) => {
    if (on === following) return
    setFollowing(on)
    if (!on) setPausedAt(buffer.getSnapshot().next)
  }

  // The selection: the lines between the anchor and the active line, among those shown.
  const activeIndex = active === null ? -1 : lowerBound(seqs, active)
  const activeShown = activeIndex >= 0 && seqs[activeIndex] === active
  const anchorIndex = anchor === null ? -1 : lowerBound(seqs, anchor)
  const anchorShown = anchorIndex >= 0 && seqs[anchorIndex] === anchor
  const range: [number, number] | null = activeShown ? (anchorShown ? [Math.min(activeIndex, anchorIndex), Math.max(activeIndex, anchorIndex)] : [activeIndex, activeIndex]) : null
  const selectedText = () => {
    if (!range) return ""
    const out: string[] = []
    for (let i = range[0]; i <= range[1]; i++) {
      const line = buffer.get(seqs[i]!)
      if (line) out.push(formatLogLine(line))
    }
    return out.join("\n")
  }
  const selectedCount = range ? range[1] - range[0] + 1 : 0

  const goToMatch = (dir: 1 | -1) => {
    const from = current ?? active ?? (following ? Infinity : (rows.current?.firstVisible() ?? -1))
    const next = stepMatch(matches, from, dir)
    if (next === undefined) return
    setCurrent(next)
    setActive(next)
    setAnchor(next)
    follow(false)
    rows.current?.scrollToSeq(next)
  }
  const currentIndex = current === null ? -1 : lowerBound(matches, current)
  const currentNumber = currentIndex >= 0 && matches[currentIndex] === current ? currentIndex + 1 : 0

  const jumpToLatest = () => {
    setFollowing(true)
    rows.current?.scrollToEnd()
  }
  React.useImperativeHandle(
    ref,
    () => ({
      append: (next) => buffer.append(next),
      clear: () => buffer.clear(),
      jumpToLatest: () => {
        setFollowing(true)
        rows.current?.scrollToEnd()
      },
      buffer,
    }),
    [buffer],
  )

  // Announcements: what arrived since the last one, at most every 5 s, never while nothing did.
  const words = React.useEffectEvent((counts: { lines: number; errors: number; warnings: number }) => l.announce(counts, locale))
  React.useEffect(() => {
    if (!announce) return
    let last = buffer.totals()
    const tick = setInterval(() => {
      const t = buffer.totals()
      const diff = (k: LogLevel) => t[k] - last[k]
      const counts = { lines: logLevels.reduce((n, k) => n + diff(k), 0), errors: diff("error") + diff("fatal"), warnings: diff("warn") }
      if (counts.lines === 0 || (announce === "errors" && counts.errors === 0)) return
      last = t
      setSaid(words(counts))
    }, 5000)
    return () => clearInterval(tick)
  }, [buffer, announce])

  const toggleLevel = (level: LogLevel) => setLevels((ls) => (ls.includes(level) ? ls.filter((x) => x !== level) : logLevels.filter((x) => x === level || ls.includes(x))))
  const toggleSource = (source: string) => setSources((ss) => (ss.includes(source) ? ss.filter((x) => x !== source) : [...ss, source]))
  const allLevels = levels.length === logLevels.length
  const levelButton = allLevels
    ? l.allLevels
    : levels.length <= 2 && levels.length > 0
      ? levels.map((x) => l[x]).join(", ")
      : l.levelCount(levels.length)
  const sourceButton = sources.length === 0 ? l.allSources : sources.length === 1 ? sources[0]! : l.sourceCount(sources.length)
  const showAll = () => {
    setLevels(logLevels)
    setSources([])
  }

  const presence = usePresence(!following && seqs.length > 0)
  const total = snapshot.size
  const counts = snapshot.counts
  const capped = snapshot.dropped > 0

  return (
    <section
      data-slot="log-viewer"
      aria-label={l.name}
      style={{ height }}
      className={cn("@container flex w-full min-w-0 flex-col overflow-hidden rounded-md bg-card ring-1 ring-border", className)}
    >
      {/* One control height across the toolbar, the field's (--h-md: 44 px, 48 with gloves), so the search and the menus
          beside it line up, as in every toolbar of the kit that holds a field. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
        <InputGroup className="w-full @xl:w-auto @xl:min-w-0 @xl:flex-1">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <Input
            ref={searchRef}
            type="search"
            aria-label={l.search}
            aria-describedby={pattern ? `${id}-matches` : undefined}
            placeholder={l.searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCurrent(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                goToMatch(e.shiftKey ? -1 : 1)
              }
            }}
          />
          {pattern && (
            <>
              <span id={`${id}-matches`} aria-live="polite" className="shrink-0 px-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                {l.matches(currentNumber, matches.length, locale)}
              </span>
              <InputGroupButton aria-label={l.previousMatch} disabled={matches.length === 0} onClick={() => goToMatch(-1)} className="mx-0">
                <ChevronUp aria-hidden="true" />
              </InputGroupButton>
              <InputGroupButton aria-label={l.nextMatch} disabled={matches.length === 0} onClick={() => goToMatch(1)} className="mr-1 ml-0">
                <ChevronDown aria-hidden="true" />
              </InputGroupButton>
            </>
          )}
        </InputGroup>
        <div className="flex min-w-0 flex-1 items-center gap-2 @xl:flex-none">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-0 px-3" aria-label={`${l.levels}: ${levelButton}`}>
                <span className="truncate">{levelButton}</span>
                <ChevronDown aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{l.levels}</DropdownMenuLabel>
              {logLevels.map((level) => (
                <DropdownMenuCheckboxItem key={level} checked={levels.includes(level)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => toggleLevel(level)}>
                  <LogLevelLabel level={level} word={l[level]} />
                  <span className="ml-auto pl-4 text-xs text-muted-foreground tabular-nums">{l.count(counts[level], locale)}</span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={allLevels} disabled={allLevels} onSelect={(e) => e.preventDefault()} onCheckedChange={() => setLevels(logLevels)}>
                {l.allLevels}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-0 px-3" aria-label={`${l.sources}: ${sourceButton}`}>
                <span className={cn("truncate", sources.length === 1 && "font-mono")}>{sourceButton}</span>
                <ChevronDown aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-96 overflow-y-auto">
              <SourceItems buffer={buffer} snapshot={snapshot} chosen={sources} onToggle={toggleSource} onAll={() => setSources([])} labels={l} locale={locale} />
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={l.viewOptions} className="ml-auto">
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked={wrap} onCheckedChange={(on) => setWrap(on === true)}>
                {l.wrap}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={timeMode === "relative"} onCheckedChange={(on) => setTimeMode(on === true ? "relative" : "absolute")}>
                {l.relativeTime}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {total === 0 || seqs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground">
            {total === 0 ? <ScrollText aria-hidden="true" className="size-6" /> : <SearchX aria-hidden="true" className="size-6" />}
            <p>{total === 0 ? l.empty : l.noMatch}</p>
            {total > 0 && (
              <Button variant="outline" size="sm" onClick={showAll}>
                {l.showAll}
              </Button>
            )}
          </div>
        ) : (
          <LogRows
            ref={rows}
            id={id}
            buffer={buffer}
            seqs={seqs}
            labels={l}
            wrap={wrap}
            time={timeMode === "relative" ? (t) => l.ago(now - t, locale) : format.time}
            fullTime={format.full}
            pattern={pattern}
            current={current}
            active={activeShown ? active : null}
            range={range}
            expanded={expanded}
            following={following}
            onFollow={follow}
            onActivate={(seq, extend) => {
              setActive(seq)
              if (!extend) setAnchor(seq)
            }}
            onToggle={(seq, open) =>
              setExpanded((s) => {
                const next = new Set(s)
                if (open ?? !s.has(seq)) next.add(seq)
                else next.delete(seq)
                return next
              })
            }
            onCopy={() => {
              const n = selectedCount
              const text = selectedText()
              if (!text) return
              void copyText(text).then((ok) => setSaid(ok ? l.copiedLines(n) : l.copyFailed))
            }}
            onSearch={() => searchRef.current?.focus()}
            initialSeq={firstOpen}
          />
        )}
      </div>

      {/* The footer holds the list's state and its two actions, so nothing floats over the lines: Jump to latest beside
          Paused (where the reader looks to see why the list stopped), and Copy only for a selection of several lines (one
          line is copied from its own detail, or with C). */}
      <div className="flex min-h-(--h-md) flex-wrap items-center gap-x-2 border-t border-border px-3 text-xs text-muted-foreground tabular-nums">
        <span>
          {l.total(seqs.length, total, locale)}
          {capped && ` · ${l.capped(snapshot.maxLines, locale)}`}
        </span>
        <span aria-hidden="true">·</span>
        <span>{following ? l.following : l.paused}</span>
        {presence.mounted && (
          <Button
            size="sm"
            variant="ghost"
            onClick={jumpToLatest}
            onAnimationEnd={presence.done}
            className={cn("-ml-1 px-2 text-foreground", presence.leaving ? "animate-disappear" : "animate-appear")}
          >
            <ArrowDownToLine aria-hidden="true" />
            {newCount > 0 ? `${l.newLines(newCount, locale)} · ${l.jumpToLatest}` : l.jumpToLatest}
          </Button>
        )}
        {selectedCount > 1 && (
          <CopyButton value={selectedText()} labels={{ copied: l.copied, failed: l.copyFailed }} className="-mr-2 ml-auto">
            {l.copyLines(selectedCount)}
          </CopyButton>
        )}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
      <span id={`${id}-keys`} className="sr-only">
        {l.keys}
      </span>
    </section>
  )
}

function SourceItems({
  buffer,
  snapshot,
  chosen,
  onToggle,
  onAll,
  labels: l,
  locale,
}: {
  buffer: LogBuffer
  snapshot: LogBufferSnapshot
  chosen: readonly string[]
  onToggle: (source: string) => void
  onAll: () => void
  labels: LogViewerLabels
  locale: string | undefined
}) {
  // Counted only while the menu is open: one pass over the buffer.
  const sources = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (let seq = snapshot.first; seq < snapshot.next; seq++) {
      const s = buffer.get(seq)?.source ?? ""
      counts.set(s, (counts.get(s) ?? 0) + 1)
    }
    for (const c of chosen) if (!counts.has(c)) counts.set(c, 0)
    return [...counts].sort((a, b) => a[0].localeCompare(b[0]))
  }, [buffer, snapshot, chosen])
  return (
    <>
      <DropdownMenuLabel>{l.sources}</DropdownMenuLabel>
      {sources.map(([source, n]) => (
        <DropdownMenuCheckboxItem key={source} checked={chosen.includes(source)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => onToggle(source)}>
          <span className="min-w-0 truncate font-mono">{source || "–"}</span>
          <span className="ml-auto pl-4 text-xs text-muted-foreground tabular-nums">{l.count(n, locale)}</span>
        </DropdownMenuCheckboxItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked={chosen.length === 0} disabled={chosen.length === 0} onSelect={(e) => e.preventDefault()} onCheckedChange={onAll}>
        {l.allSources}
      </DropdownMenuCheckboxItem>
    </>
  )
}

// ---------- The rows ----------

type RowsHandle = {
  scrollToSeq: (seq: number) => void
  scrollToEnd: () => void
  /** The first line in view, for searching from where the reader is. */
  firstVisible: () => number | undefined
}

const tokenPx = (el: Element | null, name: string) => {
  if (!el) return undefined
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return undefined
  return raw.endsWith("rem") ? n * parseFloat(getComputedStyle(document.documentElement).fontSize || "16") : n
}

function LogRows({
  ref,
  id,
  buffer,
  seqs,
  labels: l,
  wrap,
  time,
  fullTime,
  pattern,
  current,
  active,
  range,
  expanded,
  following,
  onFollow,
  onActivate,
  onToggle,
  onCopy,
  onSearch,
  initialSeq,
}: {
  ref: React.Ref<RowsHandle>
  id: string
  buffer: LogBuffer
  seqs: number[]
  labels: LogViewerLabels
  wrap: boolean
  time: (t: number) => string
  fullTime: (t: number) => string
  pattern: RegExp | null
  current: number | null
  active: number | null
  range: [number, number] | null
  expanded: ReadonlySet<number>
  following: boolean
  onFollow: (on: boolean) => void
  onActivate: (seq: number, extend: boolean) => void
  onToggle: (seq: number, open?: boolean) => void
  onCopy: () => void
  onSearch: () => void
  /** Scrolled to the top when the rows first mount (the first line opened by `defaultExpanded`). */
  initialSeq: number | null
}) {
  // TanStack Virtual answers through methods on one virtualizer object that reads live scroll state, so the compiler must
  // not cache this component's calls to it, as with data-grid's table. The compiler 1.0 already skips a component that
  // calls useVirtualizer (a library it knows to be incompatible); "use no memo" says so here, so it stays skipped if that
  // list changes. Everything that does not touch the virtualizer lives in LogViewer, which compiles.
  // tests/unit/log-viewer.compiler.test.tsx runs both compiled.
  "use no memo"
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const anchor = React.useRef<{ seq: number; offset: number } | null>(null)
  const lastTop = React.useRef(0)
  // A line is a --h-sm row (36 px with a mouse, 44 on touch), or two 20 px lines and their padding where the viewer is
  // narrower than 36rem and the message goes under the level. Each line is measured once drawn, so wrapped and opened
  // lines take their real height; a close estimate matters because every line measured at another height moves the start
  // of every line after it. Read once per mount, not per line: the estimate is asked for every line.
  const rowPx = React.useRef(36)
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    const row = tokenPx(el, "--h-sm") ?? 36
    const narrow = el ? el.clientWidth < 36 * (tokenPx(document.documentElement, "font-size") ?? 16) : false
    rowPx.current = narrow ? Math.max(row, 60) : row
  }, [])
  // Both stay the same function until the lines change. TanStack Virtual rebuilds every line's measurement whenever its
  // options change, which at 100,000 lines on each scroll frame was the whole cost of scrolling.
  const getItemKey = React.useCallback((i: number) => seqs[i] ?? i, [seqs])
  const estimateSize = React.useCallback(() => rowPx.current, [])
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual's useVirtualizer, kept out of the compiler on purpose.
  const virtualizer = useVirtualizer({
    count: seqs.length,
    getScrollElement: () => scrollRef.current,
    getItemKey,
    estimateSize,
    overscan: 12,
  })
  const items = virtualizer.getVirtualItems()

  const scrollToEnd = () => {
    const el = scrollRef.current
    if (!el) return
    virtualizer.scrollToIndex(seqs.length - 1, { align: "end" })
    el.scrollTop = el.scrollHeight
  }
  React.useImperativeHandle(ref, () => ({
    scrollToSeq: (seq) => {
      const i = lowerBound(seqs, seq)
      if (i < seqs.length) virtualizer.scrollToIndex(i, { align: "center" })
    },
    scrollToEnd,
    firstVisible: () => {
      const el = scrollRef.current
      const top = el?.scrollTop ?? 0
      const first = virtualizer.getVirtualItems().find((v) => v.end > top)
      return first ? seqs[first.index] : undefined
    },
  }))

  React.useLayoutEffect(() => {
    if (initialSeq === null) return
    const i = lowerBound(seqs, initialSeq)
    if (i >= seqs.length) return
    // Once now, and again on the next frame, when the lines in view have been measured.
    virtualizer.scrollToIndex(i, { align: "start" })
    const frame = requestAnimationFrame(() => virtualizer.scrollToIndex(i, { align: "start" }))
    return () => cancelAnimationFrame(frame)
    // Once, when the rows mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Following: after every render the newest line is in view. Not following: the line at the top stays where it was
  // while older lines are dropped or the filters change, so the text being read never slides away.
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (following) {
      if (el.scrollHeight - el.scrollTop - el.clientHeight > 1) el.scrollTop = el.scrollHeight
      return
    }
    const a = anchor.current
    if (!a) return
    const i = lowerBound(seqs, a.seq)
    if (i >= seqs.length) return
    const at = virtualizer.getOffsetForIndex(i, "start")?.[0]
    if (at === undefined) return
    const target = at - a.offset
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
  })

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const top = el.scrollTop
    const first = virtualizer.getVirtualItems().find((v) => v.end > top)
    const firstSeq = first ? seqs[first.index] : undefined
    anchor.current = first && firstSeq !== undefined ? { seq: firstSeq, offset: first.start - top } : null
    const atBottom = el.scrollHeight - top - el.clientHeight <= 2
    const up = top < lastTop.current - 1
    lastTop.current = top
    // While following, the viewer only ever scrolls down (to the newest line), so a scroll up is the reader's: it stops
    // following. Back at the end, following resumes.
    if (atBottom && !following) onFollow(true)
    else if (!atBottom && following && up) onFollow(false)
  }

  const indexOf = (seq: number | null) => (seq === null ? -1 : lowerBound(seqs, seq))
  const move = (to: number, extend: boolean) => {
    const i = Math.max(0, Math.min(seqs.length - 1, to))
    const seq = seqs[i]
    if (seq === undefined) return
    onActivate(seq, extend)
    if (i === seqs.length - 1 && !extend) {
      onFollow(true)
      scrollToEnd()
      return
    }
    onFollow(false)
    virtualizer.scrollToIndex(i, { align: "auto" })
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const el = scrollRef.current
    const at = active === null ? -1 : indexOf(active)
    const page = Math.max(1, Math.floor((el?.clientHeight ?? 360) / (virtualizer.options.estimateSize(0) || 36)) - 1)
    const mod = e.ctrlKey || e.metaKey
    const startFrom = () => {
      if (at >= 0) return at
      const top = el?.scrollTop ?? 0
      return virtualizer.getVirtualItems().find((v) => v.end > top)?.index ?? 0
    }
    let handled = true
    if (e.key === "ArrowDown") move(at < 0 ? startFrom() : at + 1, e.shiftKey)
    else if (e.key === "ArrowUp") move(at < 0 ? startFrom() : at - 1, e.shiftKey)
    else if (e.key === "PageDown") move(startFrom() + page, e.shiftKey)
    else if (e.key === "PageUp") move(startFrom() - page, e.shiftKey)
    else if (e.key === "Home") move(0, e.shiftKey)
    else if (e.key === "End") move(seqs.length - 1, e.shiftKey)
    else if ((e.key === "Enter" || e.key === " ") && active !== null) {
      onFollow(false)
      onToggle(active)
    } else if (e.key === "ArrowRight" && active !== null) {
      onFollow(false)
      onToggle(active, true)
    } else if (e.key === "ArrowLeft" && active !== null) onToggle(active, false)
    else if (e.key === "Escape" && active !== null && expanded.has(active)) onToggle(active, false)
    else if (e.key === "Escape" && range && range[0] !== range[1] && active !== null) onActivate(active, false)
    else if ((e.key === "c" || e.key === "C") && !e.altKey && (!mod || !window.getSelection()?.toString())) {
      // C, or Ctrl/Cmd+C with no text selected: copy the selected lines. With text selected, the browser copies it.
      if (active === null) handled = false
      else onCopy()
    } else if (e.key === "/" && !mod) onSearch()
    else handled = false
    if (handled) e.preventDefault()
  }

  const activeId = active !== null && items.some((v) => seqs[v.index] === active) ? `${id}-line-${active}` : undefined
  return (
    // The frame draws the grid's focus ring inside its edge, so the scrolling never clips it.
    <div className="h-full rounded-b-md has-[>[role=grid]:focus-visible]:outline-2 has-[>[role=grid]:focus-visible]:-outline-offset-2 has-[>[role=grid]:focus-visible]:outline-ring">
      <div
        ref={scrollRef}
        // focus-ring: the frame around the grid draws it (has-[…:focus-visible]), and the line in focus its own.
        className="group/grid relative h-full overflow-auto overscroll-contain outline-none [overflow-anchor:none]"
        // A treegrid, not a grid: only a treegrid's rows may say whether they are open (aria-expanded), and each line opens.
        role="treegrid"
        tabIndex={0}
        aria-label={l.name}
        aria-rowcount={seqs.length + 1}
        aria-colcount={4}
        aria-multiselectable="true"
        aria-activedescendant={activeId}
        aria-describedby={`${id}-keys`}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          if (e.target !== e.currentTarget || active !== null) return
          // Focus lands on the newest line while following, else on the first line in view.
          const top = scrollRef.current?.scrollTop ?? 0
          const i = following ? seqs.length - 1 : (virtualizer.getVirtualItems().find((v) => v.end > top)?.index ?? 0)
          const seq = seqs[i]
          if (seq !== undefined) onActivate(seq, false)
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.closest("[data-log-detail]")) return
          const row = target.closest<HTMLElement>("[data-seq]")
          if (!row) return
          // A drag that selected text is a selection, not a click.
          if (window.getSelection()?.toString()) return
          const seq = Number(row.dataset.seq)
          onFollow(false)
          if (e.shiftKey) onActivate(seq, true)
          else {
            onActivate(seq, false)
            onToggle(seq)
          }
        }}
      >
        <div role="row" aria-rowindex={1} aria-level={1} className="sr-only">
          <span role="columnheader">{l.time}</span>
          <span role="columnheader">{l.level}</span>
          <span role="columnheader">{l.source}</span>
          <span role="columnheader">{l.message}</span>
        </div>
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {items.map((v) => {
            const seq = seqs[v.index]
            const line = seq === undefined ? undefined : buffer.get(seq)
            if (seq === undefined || !line) return null
            return (
              <LogRow
                key={v.key}
                ref={virtualizer.measureElement}
                index={v.index}
                start={v.start}
                seq={seq}
                rowId={`${id}-line-${seq}`}
                line={line}
                time={time(line.time)}
                fullTime={expanded.has(seq) ? fullTime(line.time) : ""}
                wrap={wrap}
                pattern={pattern}
                current={current === seq}
                active={active === seq}
                selected={range !== null && v.index >= range[0] && v.index <= range[1]}
                expanded={expanded.has(seq)}
                labels={l}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

const LogRow = React.memo(function LogRow({
  ref,
  index,
  start,
  seq,
  rowId,
  line,
  time,
  fullTime,
  wrap,
  pattern,
  current,
  active,
  selected,
  expanded,
  labels: l,
}: {
  ref: (el: HTMLDivElement | null) => void
  index: number
  start: number
  seq: number
  rowId: string
  line: LogLine
  time: string
  fullTime: string
  wrap: boolean
  pattern: RegExp | null
  current: boolean
  active: boolean
  selected: boolean
  expanded: boolean
  labels: LogViewerLabels
}) {
  const [firstLine, ...rest] = line.message.split("\n")
  const shown = wrap || expanded ? line.message : (firstLine ?? "")
  const fields: { label: React.ReactNode; value: React.ReactNode }[] = [
    { label: l.time, value: fullTime },
    { label: l.level, value: <LogLevelLabel level={line.level} word={l[line.level]} /> },
  ]
  if (line.source) fields.push({ label: l.source, value: <span className="font-mono">{line.source}</span> })
  if (line.file) fields.push({ label: l.location, value: <span className="font-mono break-all">{`${line.file}${line.line !== undefined ? `:${line.line}` : ""}`}</span> })
  if (line.function) fields.push({ label: l.function, value: <span className="font-mono break-all">{line.function}</span> })
  for (const [k, v] of Object.entries(line.fields ?? {})) fields.push({ label: k, value: <span className="font-mono break-all">{String(v)}</span> })

  return (
    <div
      ref={ref}
      id={rowId}
      role="row"
      aria-level={1}
      data-index={index}
      data-seq={seq}
      aria-rowindex={index + 2}
      aria-selected={selected}
      aria-expanded={expanded}
      data-active={active || undefined}
      style={{ transform: `translateY(${start}px)` }}
      className={cn(
        "absolute top-0 left-0 grid w-full cursor-default grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-2 gap-y-1 px-3 py-2",
        "@xl:grid-cols-[1rem_6.5rem_5rem_9rem_minmax(0,1fr)] @xl:gap-x-3",
        "min-h-(--h-sm) transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
        selected && "bg-accent shadow-selected",
        active && "group-focus-visible/grid:outline-2 group-focus-visible/grid:-outline-offset-2 group-focus-visible/grid:outline-ring",
      )}
    >
      <ChevronRight
        aria-hidden="true"
        className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform @xl:col-start-1 @xl:row-start-1 duration-(--motion-fast) ease-(--ease-standard)", expanded && "rotate-90")}
      />
      {/* Narrow: level, time and source on the first line, the message under them. Wide: one column each. */}
      <div className="flex min-w-0 items-center gap-2 @xl:contents">
        <span role="gridcell" className="order-2 shrink-0 font-mono text-xs leading-5 text-muted-foreground tabular-nums @xl:order-none @xl:col-start-2 @xl:row-start-1 @xl:text-sm">
          {time}
        </span>
        <span role="gridcell" className="order-1 flex shrink-0 @xl:order-none @xl:col-start-3 @xl:row-start-1">
          <LogLevelLabel level={line.level} word={l[line.level]} />
        </span>
        <span role="gridcell" className="order-3 min-w-0 truncate font-mono text-xs leading-5 text-muted-foreground @xl:order-none @xl:col-start-4 @xl:row-start-1 @xl:text-sm">
          {line.source ? <Marked text={line.source} query={pattern} current={current} /> : null}
        </span>
      </div>
      {/* Wide, the message cell spans the time, level, source and message columns on a subgrid: the message sits in its own
          column and an opened line's detail runs under the whole row, from the time column. The cell lets the pointer through
          to the cells it lies over; its children take it back. */}
      <div
        role="gridcell"
        className="col-start-2 min-w-0 @xl:pointer-events-none @xl:col-[2/-1] @xl:row-start-1 @xl:grid @xl:grid-cols-subgrid @xl:*:pointer-events-auto"
      >
        <p
          className={cn(
            "font-mono text-sm leading-5 @xl:col-start-4",
            line.level === "debug" && "text-muted-foreground",
            wrap || expanded ? "break-words whitespace-pre-wrap" : "truncate",
          )}
        >
          <Marked text={shown} query={pattern} current={current} />
          {!wrap && !expanded && rest.length > 0 && <span className="text-muted-foreground"> {l.moreLines(rest.length)}</span>}
        </p>
        {expanded && (
          // A band of the row, not a card in it: a hairline under the message, the fields and one quiet Copy line.
          <div
            data-log-detail=""
            className="mt-2 flex animate-appear cursor-auto flex-col items-start gap-x-3 gap-y-1 border-t border-border pt-2 pb-1 @xl:col-span-full @xl:flex-row"
          >
            {/* Names under the time, values under the level (6.5rem and the row's 12 px gap), so they read as the row's
                own columns; a long path or function name wraps in its value. */}
            <dl className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm leading-5 @xl:grid-cols-[6.5rem_minmax(0,1fr)] @xl:gap-x-3">
              {fields.map((f, i) => (
                <React.Fragment key={i}>
                  <dt className="min-w-0 break-words text-muted-foreground">{f.label}</dt>
                  <dd className="min-w-0 tabular-nums">{f.value}</dd>
                </React.Fragment>
              ))}
            </dl>
            <CopyButton value={formatLogLine(line)} labels={{ copied: l.copied, failed: l.copyFailed }} className="-ml-3 shrink-0 @xl:-my-2 @xl:ml-0">
              {l.copyLine}
            </CopyButton>
          </div>
        )}
      </div>
    </div>
  )
})
