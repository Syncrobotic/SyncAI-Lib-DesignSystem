// @syncrobotic/heatmap-week-hours v0.9.0 · update: npx shadcn add @syncrobotic/heatmap-week-hours --overwrite
"use client"

import * as React from "react"
import { Card } from "@/registry/syncrobotic/ui/card"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = Array.from({ length: 12 }, (_, i) => i * 2)
// Sample data: incidents per day and 2-hour slot over the last four weeks.
const count = (d: number, h: number) =>
  Math.max(0, Math.round(3 * Math.sin((h - 14) / 5) + (h >= 20 ? 3 : 0) + (d === 4 ? 2 : 0) - (d >= 5 ? 1 : 0) + ((d * 3 + h) % 4) / 2 - 1))
const grid = days.map((_, d) => hours.map((h) => count(d, h)))
const max = Math.max(...grid.flat())
// One hue from the surface to the text colour: sequential, so darker always means more.
const shade = (v: number) => (v === 0 ? "var(--muted)" : `color-mix(in oklab, var(--foreground) ${Math.round(15 + (v / max) * 75)}%, var(--card))`)

/** When incidents happen: days by 2-hour slots, one sequential hue, the busiest slot named in words. */
export function HeatmapWeekHours() {
  const [view, setView] = React.useState("chart")
  let peak = { d: 0, h: 0, v: -1 }
  grid.forEach((row, d) => row.forEach((v, i) => v > peak.v && (peak = { d, h: hours[i], v })))
  return (
    <TooltipProvider delayDuration={100}>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">Incidents by time of week · last 4 weeks</h3>
            <p className="text-xs text-muted-foreground tabular-nums">
              Busiest: {days[peak.d]} {String(peak.h).padStart(2, "0")}:00–{String(peak.h + 2).padStart(2, "0")}:00, {peak.v} incidents
            </p>
          </div>
          <SegmentedControl value={view} onValueChange={(v) => v && setView(v)} aria-label="Show as" className="w-auto">
            <SegmentedControlItem value="chart">Chart</SegmentedControlItem>
            <SegmentedControlItem value="table">Table</SegmentedControlItem>
          </SegmentedControl>
        </div>
        {view === "chart" ? (
          <>
            <div className="grid grid-cols-[2.5rem_1fr] gap-x-2 gap-y-1 text-xs" aria-hidden="true">
              <span />
              <span className="grid grid-cols-12 text-muted-foreground tabular-nums">
                {hours.map((h) => (
                  <span key={h}>{h % 6 === 0 ? String(h).padStart(2, "0") : ""}</span>
                ))}
              </span>
              {days.map((d, di) => (
                <React.Fragment key={d}>
                  <span className="text-muted-foreground">{d}</span>
                  <span className="grid grid-cols-12 gap-0.5">
                    {grid[di].map((v, hi) => (
                      <Tooltip key={hi}>
                        <TooltipTrigger asChild>
                          <span className="h-6 rounded-xs" style={{ background: shade(v) }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          {d} {String(hours[hi]).padStart(2, "0")}:00 · {v} {v === 1 ? "incident" : "incidents"}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Fewer
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <span key={f} aria-hidden="true" className="h-3 w-5 rounded-xs" style={{ background: shade(f * max) }} />
              ))}
              More
            </span>
          </>
        ) : (
          // Same orientation as the grid: a row per day, a column per 2-hour slot, incidents in each cell.
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                {hours.map((h) => (
                  <TableHead key={h} className="text-right tabular-nums">
                    {String(h).padStart(2, "0")}:00
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((d, di) => (
                <TableRow key={d}>
                  <TableCell className="font-medium">{d}</TableCell>
                  {grid[di].map((v, hi) => (
                    <TableCell key={hi} className="text-right tabular-nums">
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="sr-only">Incidents are most frequent in the evening, especially on Fridays. The busiest slot is listed above.</p>
      </Card>
    </TooltipProvider>
  )
}
