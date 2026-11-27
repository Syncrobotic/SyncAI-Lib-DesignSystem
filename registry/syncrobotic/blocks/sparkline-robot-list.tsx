// @syncrobotic/sparkline-robot-list v0.53.0 · update: npx shadcn add @syncrobotic/sparkline-robot-list --overwrite
"use client"

import { cn } from "@/lib/utils"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"

// A sparkline: the shape of the last values, no axes. Neutral, so only a word or a number carries a warning.
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${max === min ? 50 : 100 - ((v - min) / (max - min)) * 100}`).join(" ")
  return (
    <svg aria-hidden="true" viewBox="-2 -6 104 112" preserveAspectRatio="none" className={cn("h-8 w-24 text-muted-foreground", className)}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

type Row = { id: string; tone: Status; state: string; battery: number[] }
// Sample data: battery over the last 12 hours, oldest first.
const rows: Row[] = [
  { id: "7F3A", tone: "active", state: "Patrolling", battery: [96, 90, 84, 77, 70, 64, 58, 51, 45, 40, 36, 33] },
  { id: "DAA6", tone: "normal", state: "Docked", battery: [40, 34, 30, 52, 70, 84, 93, 98, 99, 100, 100, 100] },
  { id: "9E37", tone: "warning", state: "Needs attention", battery: [62, 55, 47, 40, 33, 27, 22, 19, 17, 15, 14, 12] },
  { id: "1715", tone: "active", state: "Patrolling", battery: [88, 85, 82, 79, 76, 73, 70, 67, 64, 61, 58, 55] },
]

const row = "flex min-h-(--h-row) items-center gap-3 border-b border-border px-4 last:border-b-0" // icon-gap-ok: the svg is a sparkline, not an icon beside a label

/** Each robot row with its last 12 hours of battery as a sparkline and the value now. */
export function SparklineRobotList() {
  return (
    <Card className="gap-0 p-0">
      <CardDataHeader title="Battery, last 12 hours" actions={<span className="text-xs text-muted-foreground">Now</span>} className="border-b border-border px-4 py-3" />
      <ul>
        {rows.map((r) => {
          // A robot with no readings yet has no level now, and is not called low.
          const now = r.battery.at(-1)
          const low = now !== undefined && now < 15
          return (
            <li key={r.id} className={row}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">Patrol dog {r.id}</span>
                <InlineStatus status={r.tone}>{r.state}</InlineStatus>
              </span>
              <Sparkline values={r.battery} />
              {/* Low is the warning shape before the number, never the number's colour; the word is read. */}
              <span className={cn("flex w-16 items-center justify-end gap-2 text-sm text-foreground tabular-nums", low && "font-medium")}>
                {low && <StatusGlyph status="warning" />}
                {now} %<span className="sr-only">{low ? ", low" : ""}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
