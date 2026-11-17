// @syncrobotic/stats-meters v0.9.0 · update: npx shadcn add @syncrobotic/stats-meters --overwrite
import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Meter } from "@/registry/syncrobotic/ui/meter"

export type LevelStat = {
  label: string
  value: number
  max?: number
  unit?: string
  /** Warning from here; danger from critical. */
  low?: number
  critical?: number
  higherIsWorse?: boolean
  caption: string
}

// Sample data: levels across the fleet now. Storage is past its warning line, so it is the one with colour.
export const sampleLevels: LevelStat[] = [
  { label: "Fleet battery, average", value: 71, low: 30, critical: 15, caption: "Lowest: 9E37 at 14 %" },
  { label: "Charging bays in use", value: 5, max: 8, unit: "of 8", higherIsWorse: true, low: 7, critical: 8, caption: "3 free at Dock 1 and 2" },
  { label: "Recorder storage used", value: 84, higherIsWorse: true, low: 80, critical: 95, caption: "Clears at 02:00 after upload" },
  { label: "Robots with good signal", value: 12, max: 14, unit: "of 14", low: 10, critical: 7, caption: "2 weak at the car park" },
]

/** Levels in a fixed range, one per card: the bar shows how full, the number says exactly, and only a level past its line is coloured. */
export function StatsMeters({ stats = sampleLevels, className }: { stats?: LevelStat[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {stats.map((s) => (
        <Card key={s.label} className="gap-3">
          <Meter label={s.label} value={s.value} max={s.max} unit={s.unit} low={s.low} critical={s.critical} higherIsWorse={s.higherIsWorse} />
          <span className="text-xs text-muted-foreground">{s.caption}</span>
        </Card>
      ))}
    </div>
  )
}
