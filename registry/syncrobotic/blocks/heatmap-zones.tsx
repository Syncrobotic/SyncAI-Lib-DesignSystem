// @syncrobotic/heatmap-zones v0.15.0 · update: npx shadcn add @syncrobotic/heatmap-zones --overwrite
"use client"

import * as React from "react"
import { Card } from "@/registry/syncrobotic/ui/card"
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
// The ramp stops at 45 % so the number on top keeps text contrast in both themes; one hue, darker always means more.
const shade = (v: number) => `color-mix(in oklab, var(--chart-1) ${Math.round(6 + (v / max) * 39)}%, var(--card))`

/** Where the robots spend their time: zones by time of day, with each cell's minutes written in it, so the colour only groups. */
export function HeatmapZones() {
  return (
    <Card className="gap-3">
      <h3 className="text-sm font-medium">Robot presence by zone · today, minutes per 3 hours</h3>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 pr-2">Zone</TableHead>
            {slots.map((s) => (
              <TableHead key={s} className="px-0 text-center tabular-nums">
                {/* On a phone the hour alone, so six headings fit over six cells instead of running together. */}
                {s}
                <span className="max-sm:sr-only">:00</span>
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
    </Card>
  )
}
