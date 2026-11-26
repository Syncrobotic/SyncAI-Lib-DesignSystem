// @syncrobotic/sparkline-metric-tiles v0.28.0 · update: npx shadcn add @syncrobotic/sparkline-metric-tiles --overwrite
import { StatsCards, type Stat } from "@/registry/syncrobotic/blocks/stats-cards"

// Sample data, oldest first. The trend decides the colour of the change, not its sign: more incidents is worse.
export const sampleTrendStats: Stat[] = [
  { label: "Uptime", value: "99.2", unit: "%", delta: "+0.4 pp", trend: "good", series: [98.1, 98.6, 98.4, 98.9, 99.0, 98.8, 99.2], caption: "Last 7 days" },
  { label: "Incidents", value: "11", delta: "+4", trend: "bad", series: [5, 6, 4, 7, 6, 9, 11], caption: "Last 7 days" },
  { label: "Avg. response", value: "48", unit: "s", delta: "−6 s", trend: "good", series: [62, 58, 57, 55, 51, 54, 48], caption: "Last 7 days" },
]

/**
 * Three headline numbers, each with its week as a sparkline and the range in words: stats-cards with three stats, three
 * across from 640 px and one per row on a phone, so no card is left alone on a second row. Only a change for the worse is
 * coloured. It is kept so the name still installs; for a new screen install stats-cards and pass your own stats.
 */
export function SparklineMetricTiles({ stats = sampleTrendStats, className }: { stats?: Stat[]; className?: string }) {
  return <StatsCards stats={stats} columns={3} className={className} />
}
