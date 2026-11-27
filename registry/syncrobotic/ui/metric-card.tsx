// @syncrobotic/metric-card v0.53.0 · update: npx shadcn add @syncrobotic/metric-card --overwrite
import * as React from "react"
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { Card } from "@/registry/syncrobotic/ui/card"
import { StatusGlyph, statusText } from "@/registry/syncrobotic/shell/status-glyph"

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
 * The shape of the last values, no axes, hidden from screen readers (the delta and caption say it). From 640 px it sits
 * beside the value and shrinks first; on a phone it takes its own line.
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
 * One headline number on a card (label, value, change, context), coloured only for a change for the worse or a `tone`,
 * with link, loading and unavailable states and MetricGrid for a row. A rise is not always good, so only `trend="bad"`
 * is coloured. `href` makes the card one link; `loading` keeps its height; `unavailable` shows a dash, never a made-up
 * 0.
 */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  trend = "flat",
  series,
  caption,
  tone,
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
  /** Change against the previous period: "+8 %", "−2". A leading minus (- or −) turns the arrow down; no change ("0", "±0 %") has no arrow. */
  delta?: string
  /** Whether the change is good. Direction alone does not decide: a rise in events is bad. Only "bad" is coloured. */
  trend?: "good" | "bad" | "flat"
  /** Last values, oldest first, drawn as a sparkline: beside the value from 640 px, under it on a phone. Two or more. */
  series?: number[]
  /** One line of context under the value: "2 docked for charging", "Last 7 days". */
  caption?: React.ReactNode
  /**
   * The number needs attention (warning) or someone now (danger): the caption takes the status glyph and colour, so it
   * should say why ("3 blocking a release"). The value stays foreground. Calm by default.
   */
  tone?: "warning" | "danger"
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
      data-tone={tone && caption && !loading && !missing ? tone : undefined}
      aria-busy={loading || undefined}
      // In a MetricGrid each card takes two of the grid's rows (subgrid): its head (label, change, value) and its caption.
      // The heads of a row share one height and each value sits at the bottom of its head, so a label on two lines or a
      // change on a line of its own moves every value in the row down together: the values stay on one line.
      className={cn(
        "gap-3 [[data-slot=metric-grid]>&]:row-span-2 [[data-slot=metric-grid]>&]:grid [[data-slot=metric-grid]>&]:grid-cols-1 [[data-slot=metric-grid]>&]:grid-rows-subgrid",
        href && "press relative hover:ring-muted-foreground has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring",
        className,
      )}
      {...props}
    >
      {/* Label, value, then the change in the DOM, so a screen reader hears "Events, 24, +6, worse". The change is drawn at
          the top right (order-last puts the value row under both). On a phone it sits under the label in every card, so the
          values of a row line up; a label too long to share its line pushes the change under it (flex-wrap). */}
      <div className="flex h-full flex-wrap content-between items-center justify-between gap-x-2 max-sm:flex-col max-sm:flex-nowrap max-sm:items-start">
        <span className="text-sm text-muted-foreground">
          {href ? (
            // focus-ring: the whole card draws the ring (has-[a:focus-visible] on the card), since the link covers it.
            <Link data-slot="metric-card-link" href={href} className="inline-flex items-center gap-2 outline-none after:absolute after:inset-0 after:rounded-[inherit]">
              {label}
              <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          ) : (
            label
          )}
        </span>
        <div className="order-last mt-3 flex w-full items-end justify-between gap-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-2">
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
          {!loading && !missing && series && series.length > 1 && <Sparkline series={series} className="max-sm:h-6 max-sm:w-full" />}
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
        caption &&
        (tone ? (
          // Status is a shape and a word: the glyph and the caption in the tone's colour; nothing else on the card changes.
          <span className={cn("flex items-center gap-2 text-xs", statusText[tone])}>
            <StatusGlyph status={tone} />
            <span>{caption}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{caption}</span>
        ))
      )}
    </Card>
  )
}

/** The row of MetricCards under a page's header: two across from the smallest phone, so four take half a screen, four from 1280 px. */
export function MetricGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="metric-grid" className={cn("grid grid-cols-2 gap-4 xl:grid-cols-4", className)} {...props} />
}
