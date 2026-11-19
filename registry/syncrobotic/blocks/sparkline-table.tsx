// @syncrobotic/sparkline-table v0.15.0 · update: npx shadcn add @syncrobotic/sparkline-table --overwrite
"use client"

import * as React from "react"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

// Mini bars: one per day, the same height scale for every row so rows compare.
function MiniBars({ values, max }: { values: number[]; max: number }) {
  return (
    <span aria-hidden="true" className="flex h-6 items-end gap-0.5">
      {values.map((v, i) => (
        <span key={i} className="w-1.5 rounded-t-xs bg-muted-foreground/60" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </span>
  )
}

// Sample data: events per day for the last 14 days, oldest first.
const sites = [
  { name: "North gate", robots: 3, events: [2, 1, 3, 2, 4, 2, 1, 2, 3, 5, 4, 3, 2, 3] },
  { name: "Hall B", robots: 2, events: [1, 0, 1, 1, 2, 1, 0, 1, 1, 0, 1, 2, 1, 1] },
  { name: "Warehouse 3", robots: 4, events: [5, 6, 4, 7, 6, 8, 9, 7, 6, 8, 9, 10, 8, 9] },
  { name: "Parking lot", robots: 1, events: [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
]

/** A table with a trend column: each site's events over 14 days as mini bars on one shared scale, with the total beside it. */
export function SparklineTable() {
  const max = Math.max(...sites.flatMap((s) => s.events))
  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">Events by site · last 14 days</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Site</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Robots</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead className="text-right">Events</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((s) => (
            <TableRow key={s.name}>
              <TableCell>
                <span className="font-medium">{s.name}</span>
                {/* On a phone the robot count sits under the site, so the trend and its total fit beside it. */}
                <span className="block text-xs text-muted-foreground tabular-nums sm:hidden">
                  {s.robots} {s.robots === 1 ? "robot" : "robots"}
                </span>
              </TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">{s.robots}</TableCell>
              <TableCell>
                <MiniBars values={s.events} max={max} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{s.events.reduce((a, b) => a + b, 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
