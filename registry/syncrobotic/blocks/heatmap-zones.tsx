// @syncrobotic/heatmap-zones v0.22.3 · update: npx shadcn add @syncrobotic/heatmap-zones --overwrite
"use client"

import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

const slots = ["06", "09", "12", "15", "18", "21"]
// Sample data: minutes of robot presence per zone and 3-hour slot today. null is no data (the parking camera was down at 06:00).
// Each zone carries its own row, so a row is never looked up by position.
const zones: { zone: string; minutes: (number | null)[] }[] = [
  { zone: "Gate A", minutes: [22, 40, 18, 25, 44, 60] },
  { zone: "Hall B", minutes: [10, 55, 70, 64, 30, 12] },
  { zone: "Dock 2", minutes: [45, 20, 15, 18, 22, 50] },
  { zone: "Parking", minutes: [null, 12, 30, 28, 40, 20] },
  { zone: "Perimeter", minutes: [60, 35, 10, 12, 38, 90] },
]
const max = 90
// The kit's sequential heatmap scale (as in heatmap-week-hours): the accent's ramp mixed into the track colour, from the
// bare track at none (a grey cell that still reads as a cell on the card, 1.5:1 and more) up to --heat-max: 60 %, so the
// number written on a cell keeps 4.5:1 in light and dark; 36 % in high contrast, where the number keeps 4.5:1 against the
// darker accent too. The step from none to a little is a change of hue, not only of lightness.
// No data (null) is not none: the theme's no-data hatch (3:1 outline and lines), in place of the number.
const shade = (v: number) => `color-mix(in oklab, var(--chart-1) calc(var(--heat-max) * ${(v / max).toFixed(3)}), var(--track))`

/** Where the robots spend their time: zones by time of day, with each cell's minutes written in it, so the colour only groups. */
export function HeatmapZones() {
  return (
    <Card className="@container gap-3 [--heat-max:60%] in-data-[contrast=more]:[--heat-max:36%]">
      <CardDataHeader title="Robot presence by zone">
        <p className="text-xs text-muted-foreground">Today, minutes per 3 hours</p>
      </CardDataHeader>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 pr-2">Zone</TableHead>
            {slots.map((s) => (
              <TableHead key={s} className="px-0 text-center tabular-nums">
                {s}
                {/* A narrow card writes the hour only ("06"), so the six columns never run into each other. */}
                <span className="sr-only @md:not-sr-only">:00</span>
              </TableHead>
            ))}
            {/* An empty column as wide as the gap after the last cell, so the last column keeps its width and the cells
                stop 8 px short of the edge, like the zone names start. */}
            <TableHead aria-hidden="true" className="w-2 p-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {zones.map(({ zone, minutes }) => (
            <TableRow key={zone} className="hover:bg-transparent">
              <TableCell className="pr-2 font-medium">{zone}</TableCell>
              {minutes.map((v, si) => (
                <TableCell key={si} className="p-0.5">
                  {v === null ? (
                    <span className="no-data flex h-8 rounded-xs">
                      <span className="sr-only">No data</span>
                    </span>
                  ) : (
                    <span className="flex h-8 items-center justify-center rounded-xs text-xs text-foreground tabular-nums" style={{ background: shade(v) }}>
                      {v}
                    </span>
                  )}
                </TableCell>
              ))}
              <TableCell aria-hidden="true" className="p-0" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        Fewer
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <span key={f} aria-hidden="true" className="h-3 w-5 rounded-xs" style={{ background: shade(f * max) }} />
        ))}
        More
        <span aria-hidden="true" className="no-data ml-2 h-3 w-5 rounded-xs" />
        No data
      </span>
    </Card>
  )
}
