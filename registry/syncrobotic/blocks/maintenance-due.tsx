// @syncrobotic/maintenance-due v0.9.0 · update: npx shadcn add @syncrobotic/maintenance-due --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

type Due = { robot: string; task: string; hours: number; every: number; due: string; booked?: string }

// Sample data: hours run since the last service, against the interval. Past 90 % is due soon; past 100 % is overdue.
const initial: Due[] = [
  { robot: "Patrol dog 9E37", task: "Leg joints and bearings", hours: 212, every: 200, due: "Overdue by 12 h" },
  { robot: "Patrol dog 7F3A", task: "Lidar clean and calibrate", hours: 186, every: 200, due: "In about 2 days" },
  { robot: "Patrol dog 1715", task: "Battery health check", hours: 140, every: 250, due: "In about 9 days", booked: "Thu 26 Nov" },
  { robot: "Patrol dog DAA6", task: "Leg joints and bearings", hours: 64, every: 200, due: "In about 3 weeks" },
]

/**
 * Service that is coming due, by hours run rather than by date: each robot's meter fills towards its interval and turns
 * amber near it and red past it. Overdue first. Booking a slot is the one action; it takes the robot off missions then.
 */
export function MaintenanceDue() {
  const [rows, setRows] = React.useState(initial)
  const sorted = [...rows].sort((a, b) => b.hours / b.every - a.hours / a.every)
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#robots" title="Maintenance" user={{ name: "Mei Lin", initials: "ML" }}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">1 overdue · 1 due this week · intervals from the manufacturer&apos;s service plan</p>
        <div className="overflow-x-auto rounded-md bg-card ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Robot</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="w-56">Hours since last</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => {
                const pct = (r.hours / r.every) * 100
                return (
                  <TableRow key={r.robot + r.task}>
                    <TableCell className="font-medium">{r.robot}</TableCell>
                    <TableCell>{r.task}</TableCell>
                    <TableCell>
                      <Meter
                        inline
                        label={`${r.robot}, hours since ${r.task}`}
                        value={r.hours}
                        max={r.every}
                        unit={`of ${r.every} h`}
                        higherIsWorse
                        low={r.every * 0.9}
                        critical={r.every}
                      />
                    </TableCell>
                    <TableCell className={cn(pct >= 100 ? "font-medium text-danger" : pct >= 90 ? "text-warning" : "text-muted-foreground")}>{r.due}</TableCell>
                    <TableCell className="text-right">
                      {r.booked ? (
                        <span className="text-sm text-muted-foreground">Booked {r.booked}</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={pct >= 90 ? "secondary" : "ghost"}
                          aria-label={`Book service for ${r.robot}`}
                          onClick={() => setRows((l) => l.map((x) => (x === r ? { ...x, booked: "tomorrow, 08:00" } : x)))}
                        >
                          Book
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  )
}
