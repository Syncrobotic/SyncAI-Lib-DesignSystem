// @syncrobotic/freshness-stamp v0.56.0 · update: npx shadcn add @syncrobotic/freshness-stamp --overwrite
"use client"

import { cn } from "@/lib/utils"
import { useNow } from "@/registry/syncrobotic/hooks/use-now"
import { formatAbsolute, formatRelative, toTime, type DateInput } from "@/registry/syncrobotic/lib/relative-time"
import { StatusGlyph, glyphText, type GlyphStatus } from "@/registry/syncrobotic/shell/status-glyph"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

/**
 * How old a snapshot is. `live` and `lagging` are inside the server's liveness window, `stale` is past it; `never` has
 * not reported yet and `not-applicable` never reports by design (air-gapped). The last two are not faults.
 */
export type Freshness = "live" | "lagging" | "stale" | "never" | "not-applicable"

/** The server's liveness, in ms since the last report. Without `staleAfterMs` only the server's `offline` makes it stale. */
export type FreshnessThresholds = { laggingAfterMs: number; staleAfterMs?: number }

export type FreshnessOptions = {
  /** ms since the epoch; the clock when omitted. */
  now?: number
  /** Never reports, and that is correct: not-applicable, whatever `lastAt` says. */
  airGapped?: boolean
  /** The server's own verdict when it sends one: true is stale, false is never stale. It wins over `staleAfterMs`. */
  offline?: boolean
}

/**
 * The freshness of a report sent at `lastAt`. Air-gapped first, then never (no report), then the server's verdict, then
 * the thresholds. A report from the future (a device clock running fast) is live: the device is plainly reporting.
 */
export function freshnessOf(lastAt: DateInput | null | undefined, thresholds: FreshnessThresholds, { now = Date.now(), airGapped = false, offline }: FreshnessOptions = {}): Freshness {
  if (airGapped) return "not-applicable"
  const t = toTime(lastAt)
  if (t === null) return "never"
  if (offline === true) return "stale"
  const age = Math.max(0, now - t)
  if (offline !== false && thresholds.staleAfterMs !== undefined && age >= thresholds.staleAfterMs) return "stale"
  return age >= thresholds.laggingAfterMs ? "lagging" : "live"
}

export type FreshnessStampLabels = {
  /** `ago` is the relative time, "3 minutes ago". */
  live: (ago: string) => string
  lagging: (ago: string) => string
  stale: (ago: string) => string
  never: string
  notApplicable: string
  /** The exact moment, in the tooltip and for screen readers. */
  at: (absolute: string) => string
  /** Between the age and the exact moment when both are read: ". " in English, "。" in Chinese. */
  separator: string
}

export const defaultFreshnessStampLabels: FreshnessStampLabels = {
  live: (ago) => `Reported ${ago}`,
  lagging: (ago) => `Last report ${ago}`,
  stale: (ago) => `Out of date: last report ${ago}`,
  never: "Not reported yet",
  notApplicable: "Does not report (air-gapped)",
  at: (absolute) => `Last report at ${absolute}`,
  separator: ". ",
}

// Colour only where the numbers beside it should not be trusted as current; the quiet states stay grey.
const glyph: Record<Freshness, GlyphStatus> = { live: "normal", lagging: "warning", stale: "danger", never: "none", "not-applicable": "none" }
const ink: Record<Freshness, string> = { live: "text-muted-foreground", lagging: glyphText.warning, stale: glyphText.danger, never: "text-muted-foreground", "not-applicable": "text-muted-foreground" }

/**
 * How old a device's last report is, beside the values it qualifies: live, lagging, stale, never reported, or not
 * applicable (air-gapped). The relative age is in the text and the exact time in a tooltip and for screen readers.
 */
export function FreshnessStamp({
  lastAt,
  thresholds,
  airGapped,
  offline,
  now: nowProp,
  hideWhenLive = false,
  variant = "text",
  locale,
  timeZone,
  refreshMs = 30_000,
  labels,
  className,
}: {
  /** When the last report arrived; null or undefined when none has. */
  lastAt: DateInput | null | undefined
  /** The server's liveness thresholds, never a number of the interface's own. */
  thresholds: FreshnessThresholds
  airGapped?: boolean
  /** The server's verdict, when it sends one (`liveness === "offline"`). */
  offline?: boolean
  /** ms since the epoch. Pass one `useNow` from the page to keep a list of stamps in step; otherwise it reads the clock. */
  now?: number
  /** Nothing while live: a mark on every healthy panel teaches people to stop reading marks. */
  hideWhenLive?: boolean
  /** "icon" shows the glyph alone, the words in its tooltip and name: for a value that already sits beside a stamp. */
  variant?: "text" | "icon"
  locale?: string
  /** IANA zone for the exact time; the browser's when omitted. */
  timeZone?: string
  /** How often it reads the clock when no `now` is given. Ages are said to the minute, so 30 s is enough. */
  refreshMs?: number
  labels?: Partial<FreshnessStampLabels>
  className?: string
}) {
  const l = { ...defaultFreshnessStampLabels, ...labels }
  const clock = useNow(nowProp === undefined ? refreshMs : null)
  const now = nowProp ?? clock
  const timeless = airGapped || toTime(lastAt) === null
  // Until the page hydrates there is no clock: render nothing time-based, so the server and the browser agree.
  if (now === null && !timeless) return <span data-slot="freshness-stamp" className={className} />
  const level = freshnessOf(lastAt, thresholds, { now: now ?? 0, airGapped, offline })
  if (hideWhenLive && level === "live") return null
  const ago = timeless ? "" : formatRelative(lastAt as DateInput, { now: now ?? 0, locale, minUnit: "minute", future: "clamp" })
  const text = level === "never" ? l.never : level === "not-applicable" ? l.notApplicable : l[level](ago)
  const exact = timeless ? "" : l.at(formatAbsolute(lastAt as DateInput, { locale, timeZone }))
  const said = [text, exact].filter(Boolean).join(l.separator)
  const stamp = (
    <span
      data-slot="freshness-stamp"
      data-freshness={level}
      aria-label={variant === "icon" ? said : undefined}
      role={variant === "icon" ? "img" : undefined}
      className={cn("inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-xs", ink[level], className)}
    >
      <StatusGlyph status={glyph[level]} />
      {variant === "text" && (
        <span>
          {text}
          {exact && <span className="sr-only">{`${l.separator}${exact}`}</span>}
        </span>
      )}
    </span>
  )
  if (!exact && variant === "text") return stamp
  return (
    <Tooltip>
      <TooltipTrigger asChild>{stamp}</TooltipTrigger>
      <TooltipContent>{variant === "icon" ? said : exact}</TooltipContent>
    </Tooltip>
  )
}
