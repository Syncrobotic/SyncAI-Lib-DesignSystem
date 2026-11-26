// @syncrobotic/stats-cards v0.28.0 · update: npx shadcn add @syncrobotic/stats-cards --overwrite
import { cn } from "@/lib/utils"
import { MetricCard, MetricGrid } from "@/registry/syncrobotic/ui/metric-card"

export type Stat = {
  label: string
  value: string
  /** e.g. "/ 14" after the value. */
  unit?: string
  /** Change against the previous period, e.g. "+8 %". */
  delta?: string
  /** Whether the change is good. A rise in events is bad, so direction alone does not decide the colour. */
  trend?: "good" | "bad" | "flat"
  /** Last values, oldest first, for the sparkline. */
  series?: number[]
  caption?: string
}

export const sampleStats: Stat[] = [
  { label: "Robots online", value: "12", unit: "/ 14", delta: "+1", trend: "good", series: [9, 10, 10, 11, 11, 12, 12], caption: "2 docked for charging" },
  { label: "Patrol hours", value: "286", unit: "h", delta: "+8 %", trend: "good", series: [210, 230, 228, 250, 262, 270, 286], caption: "Last 7 days" },
  { label: "Events", value: "24", delta: "+6", trend: "bad", series: [12, 15, 14, 18, 16, 18, 24], caption: "3 need review" },
  { label: "Avg. battery", value: "71", unit: "%", delta: "−2 pp", trend: "flat", series: [76, 75, 74, 72, 73, 72, 71], caption: "Lowest: 9C44 at 14 %" },
]

/**
 * Headline numbers for a dashboard, one MetricCard each in a MetricGrid: value first, then the change, then context, and
 * the last values as a sparkline when a stat has a `series`. Only a change for the worse is coloured. Four by default (two
 * across on a phone); `columns={3}` for three, three across from 640 px and one per row on a phone.
 */
export function StatsCards({ stats = sampleStats, columns = 4, className }: { stats?: Stat[]; columns?: 3 | 4; className?: string }) {
  return (
    <MetricGrid className={cn(columns === 3 && "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3", className)}>
      {stats.map((s) => (
        <MetricCard key={s.label} {...s} />
      ))}
    </MetricGrid>
  )
}
