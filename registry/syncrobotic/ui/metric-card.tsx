// @syncrobotic/metric-card v0.19.0 · update: npx shadcn add @syncrobotic/metric-card --overwrite
import * as React from "react"
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { Card } from "@/registry/syncrobotic/ui/card"

/** Words only screen readers hear, and the stand-in for a value that cannot be shown. Pass them translated. */
export type MetricCardLabels = {
  /** Read after a change for the better: "+1, better". */
  better?: string
  /** Read after a change for the worse: "+6, worse". */
  worse?: string
  /** Read in place of the value while it loads. */
  loading?: string
  /** Read in place of the dash when the value is unavailable. */
  unavailable?: string
}

const defaultLabels: Required<MetricCardLabels> = { better: ", better", worse: ", worse", loading: "Loading", unavailable: "Not available" }

// Only a change for the worse gets colour. Good news and the sparkline stay neutral, so the bad number is the one you see.
const trendText = { good: "text-foreground", bad: "text-danger", flat: "text-muted-foreground" } as const

/**
 * The shape of the last values, no axes. Neutral and hidden from screen readers: the delta and caption say it in words.
 * In a narrow card it gives way (shrinks) so the value and its unit stay on one line.
 */
function Sparkline({ series, className }: { series: number[]; className?: string }) {
  const min = Math.min(...series)
  const max = Math.max(...series)
  const points = series.map((v, i) => `${(i / (series.length - 1)) * 100},${max === min ? 50 : 100 - ((v - min) / (max - min)) * 100}`).join(" ")
  return (
    <svg aria-hidden="true" viewBox="-2 -6 104 112" preserveAspectRatio="none" className={cn("h-8 w-24 min-w-0 shrink text-muted-foreground", className)}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * One headline number on a card: what it is, the number, how it changed and a line of context. Only a change for the
 * worse takes colour (`trend="bad"`); good news stays foreground and no change stays grey, because a rise is not always
 * good (more events is worse). The value is the card's figure (24 px, tabular, as CardFigure). With `href` the whole card
 * is one link; `loading` keeps its height with bones; `unavailable` shows a dash and says why, never a made-up 0.
 * Put several in a MetricGrid.
 */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  trend = "flat",
  series,
  caption,
  href,
  linkAs: Link = "a",
  loading = false,
  unavailable,
  labels,
  className,
  ...props
}: {
  /** What is counted: "Robots online". The link's text when the card has `href`. */
  label: React.ReactNode
  /** The number, already formatted: "12", "1,204", "99.2". */
  value?: React.ReactNode
  /** Written small after the value: "/ 14", "h", "%". */
  unit?: string
  /** Change against the previous period: "+8%", "−2". A leading minus (- or −) turns the arrow down; no change ("0", "±0 %") has no arrow. */
  delta?: string
  /** Whether the change is good. Direction alone does not decide: a rise in events is bad. Only "bad" is coloured. */
  trend?: "good" | "bad" | "flat"
  /** Last values, oldest first, drawn as a sparkline from 640 px. Two or more. */
  series?: number[]
  /** One line of context under the value: "2 docked for charging", "Last 7 days". */
  caption?: React.ReactNode
  /** Makes the whole card one link, to the page behind the number. */
  href?: string
  /** Your router's link (e.g. next/link), for `href`. */
  linkAs?: React.ElementType
  /** The value is on its way: the label stays, bones hold the value and caption at the same height. */
  loading?: boolean
  /** Why there is no value ("Device offline since 14:02"). The value shows a dash and this replaces the caption. */
  unavailable?: string
  /** The words only screen readers hear (", better", ", worse", "Loading", "Not available"), to translate them. */
  labels?: MetricCardLabels
  className?: string
} & Omit<React.ComponentProps<"div">, "children">) {
  const l = { ...defaultLabels, ...labels }
  const missing = !loading && unavailable !== undefined
  // No change has no direction: "0", "+0", "±0", "0.0 %" get no arrow.
  const unchanged = delta !== undefined && /^[+\-−±]?\s*0+(?:[.,]0+)?\s*%?$/.test(delta.trim())
  const Arrow = unchanged ? null : delta?.startsWith("-") || delta?.startsWith("−") ? ArrowDownRight : ArrowUpRight
  return (
    <Card
      data-slot="metric-card"
      data-trend={delta && !loading && !missing ? trend : undefined}
      aria-busy={loading || undefined}
      className={cn(
        "gap-3",
        href && "press relative hover:ring-muted-foreground has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring",
        className,
      )}
      {...props}
    >
      {/* Label, value, then the change in the DOM, so a screen reader hears "Events, 24, +6, worse". The change is drawn at
          the top right (order-last puts the value row under both). On a phone it sits under the label in every card, so the
          values of a row line up; a label too long to share its line pushes the change under it (flex-wrap). */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 max-sm:flex-col max-sm:items-start">
        <span className="text-sm text-muted-foreground">
          {href ? (
            // focus-ring: the whole card draws the ring (has-[a:focus-visible] on the card), since the link covers it.
            <Link href={href} className="inline-flex items-center gap-2 outline-none after:absolute after:inset-0 after:rounded-[inherit]">
              {label}
              <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          ) : (
            label
          )}
        </span>
        <div className="order-last mt-3 flex w-full items-end justify-between gap-4">
          {loading ? (
            <>
              <Bone className="h-8 w-20" />
              <span className="sr-only">{l.loading}</span>
            </>
          ) : missing ? (
            <span className="text-2xl font-bold">
              <span aria-hidden="true">—</span>
              <span className="sr-only">{l.unavailable}</span>
            </span>
          ) : (
            <span className="flex shrink-0 items-baseline gap-1 whitespace-nowrap">
              <span className="text-2xl font-bold tabular-nums">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </span>
          )}
          {!loading && !missing && series && series.length > 1 && <Sparkline series={series} className="max-sm:hidden" />}
        </div>
        {loading ? (
          <Bone className="h-5 w-10" />
        ) : (
          delta &&
          !missing && (
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium tabular-nums", trendText[trend])}>
              {Arrow && <Arrow aria-hidden="true" className="size-4" />}
              {delta}
              {trend !== "flat" && <span className="sr-only">{trend === "good" ? l.better : l.worse}</span>}
            </span>
          )
        )}
      </div>
      {loading ? (
        <Bone className="h-4 w-3/4" />
      ) : missing ? (
        <span className="text-xs text-muted-foreground">{unavailable}</span>
      ) : (
        caption && <span className="text-xs text-muted-foreground">{caption}</span>
      )}
    </Card>
  )
}

/** The row of MetricCards under a page's header: two across from the smallest phone, so four take half a screen, four from 1280 px. */
export function MetricGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="metric-grid" className={cn("grid grid-cols-2 gap-4 xl:grid-cols-4", className)} {...props} />
}
