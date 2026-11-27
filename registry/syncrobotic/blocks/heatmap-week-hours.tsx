// @syncrobotic/heatmap-week-hours v0.47.0 · update: npx shadcn add @syncrobotic/heatmap-week-hours --overwrite
"use client"

import * as React from "react"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { ChartViewSwitch } from "@/registry/syncrobotic/ui/segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = Array.from({ length: 12 }, (_, i) => i * 2)
// Sample data: incidents per day and 2-hour slot over the last four weeks.
const count = (d: number, h: number) =>
  Math.max(0, Math.round(3 * Math.sin((h - 14) / 5) + (h >= 20 ? 3 : 0) + (d === 4 ? 2 : 0) - (d >= 5 ? 1 : 0) + ((d * 3 + h) % 4) / 2 - 1))
// null is no data (here: the fleet server was down early on Sunday), never drawn as none.
// Each row carries its day and each cell its hour, so drawing a cell never has to look its labels up by position.
type Cell = { h: number; v: number | null }
const grid: { day: string; cells: Cell[] }[] = days.map((day, d) => ({
  day,
  cells: hours.map((h) => ({ h, v: d === 6 && h >= 2 && h <= 4 ? null : count(d, h) })),
}))
const max = Math.max(...grid.flatMap((row) => row.cells.map((c) => c.v ?? 0)))
// The kit's sequential heatmap scale: the accent's ramp, mixed into the track colour, from the bare track at none (a grey
// cell that still reads as a cell on the card, 1.5:1 and more) to the full accent at the most: light to dark in light,
// dark to light in dark, so more is always further from the card. No number is written on a cell here, so the ramp runs
// to the end; heatmap-zones, whose cells carry their number, stops at 60 %.
const shade = (v: number) => `color-mix(in oklab, var(--chart-1) ${Math.round((v / max) * 100)}%, var(--track))`
// No data (null) is not none: the theme's no-data hatch (3:1 outline and lines), so a gap never passes for a quiet hour.
const fmt = (v: number | null) => (v === null ? "no data" : `${v} ${v === 1 ? "incident" : "incidents"}`)

/** When incidents happen: days by 2-hour slots, one sequential hue, the busiest slot named in words. */
export function HeatmapWeekHours() {
  const [view, setView] = React.useState("chart")
  let peak = { day: days[0], h: 0, v: -1 }
  for (const { day, cells } of grid) {
    for (const { h, v } of cells) if (v !== null && v > peak.v) peak = { day, h, v }
  }
  return (
    <TooltipProvider delayDuration={100}>
      <Card>
        <CardDataHeader
          title="Incidents by time of week · last 4 weeks"
          actions={
            <ChartViewSwitch value={view} onValueChange={setView} />
          }
        >
          <p className="text-xs text-muted-foreground tabular-nums">
            Busiest: {peak.day} {String(peak.h).padStart(2, "0")}:00–{String(peak.h + 2).padStart(2, "0")}:00, {peak.v} incidents
          </p>
        </CardDataHeader>
        {view === "chart" ? (
          <>
            <div className="grid grid-cols-[2.5rem_1fr] gap-x-2 gap-y-1 text-xs" aria-hidden="true">
              <span />
              <span className="grid grid-cols-12 text-muted-foreground tabular-nums">
                {hours.map((h) => (
                  <span key={h}>{h % 6 === 0 ? String(h).padStart(2, "0") : ""}</span>
                ))}
              </span>
              {grid.map(({ day, cells }) => (
                <React.Fragment key={day}>
                  <span className="text-muted-foreground">{day}</span>
                  <span className="grid grid-cols-12 gap-0.5">
                    {cells.map(({ h, v }) => (
                      <Tooltip key={h}>
                        <TooltipTrigger asChild>
                          <span className={v === null ? "no-data h-6 rounded-xs" : "h-6 rounded-xs"} style={v === null ? undefined : { background: shade(v) }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          {day} {String(h).padStart(2, "0")}:00 · {fmt(v)}
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
              <span aria-hidden="true" className="no-data ml-2 h-3 w-5 rounded-xs" />
              No data
            </span>
          </>
        ) : (
          // Same orientation as the grid: a row per day, a column per 2-hour slot, incidents in each cell.
          <Table bare>
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
              {grid.map(({ day, cells }) => (
                <TableRow key={day}>
                  <TableCell className="font-medium">{day}</TableCell>
                  {cells.map(({ h, v }) => (
                    <TableCell key={h} className="text-right tabular-nums">
                      {v === null ? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">No data</span>
                        </>
                      ) : (
                        v
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="sr-only">Incidents are most frequent in the evening, especially on Fridays. The busiest slot is listed above. Sunday 02:00 to 06:00 has no data.</p>
      </Card>
    </TooltipProvider>
  )
}
