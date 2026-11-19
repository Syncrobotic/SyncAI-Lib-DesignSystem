// @syncrobotic/heatmap-zones v0.17.2 · update: npx shadcn add @syncrobotic/heatmap-zones --overwrite
"use client"

import * as React from "react"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

const zones = ["Gate A", "Hall B", "Dock 2", "Parking", "Perimeter"]
const slots = ["06", "09", "12", "15", "18", "21"]
// Sample data: minutes of robot presence per zone and 3-hour slot today.
const minutes = [
  [22, 40, 18, 25, 44, 60],
  [10, 55, 70, 64, 30, 12],
  [45, 20, 15, 18, 22, 50],
  [5, 12, 30, 28, 40, 20],
  [60, 35, 10, 12, 38, 90],
]
const max = 90
// The kit's sequential heatmap scale (the same in heatmap-week-hours): one hue, darker always means more. It stops at
// 55 % so a number written on a cell keeps 7:1 in both themes.
const shade = (v: number) => `color-mix(in oklab, var(--chart-1) ${Math.round(8 + (v / max) * 47)}%, var(--card))`

/** Where the robots spend their time: zones by time of day, with each cell's minutes written in it, so the colour only groups. */
export function HeatmapZones() {
  return (
    <Card className="@container gap-3">
      <CardDataHeader title="Robot presence by zone">
        <p className="text-xs text-muted-foreground">Today, minutes per 3 hours</p>
      </CardDataHeader>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 pr-2 @md:w-24">Zone</TableHead>
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
          {zones.map((z, zi) => (
            <TableRow key={z} className="hover:bg-transparent">
              <TableCell className="pr-2 font-medium">{z}</TableCell>
              {minutes[zi].map((v, si) => (
                <TableCell key={si} className="p-0.5">
                  <span className="flex h-8 items-center justify-center rounded-xs text-xs text-foreground tabular-nums" style={{ background: shade(v) }}>
                    {v}
                  </span>
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
      </span>
    </Card>
  )
}
