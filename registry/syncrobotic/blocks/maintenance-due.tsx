// @syncrobotic/maintenance-due v0.28.0 · update: npx shadcn add @syncrobotic/maintenance-due --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

type Due = { robot: string; task: string; hours: number; every: number; due: string; booked?: string }

// Sample data: hours run since the last service, against the interval. Past 90 % is due soon; past 100 % is overdue.
const initial: Due[] = [
  { robot: "Patrol dog 9E37", task: "Leg joints and bearings", hours: 212, every: 200, due: "12 h over" },
  { robot: "Patrol dog 7F3A", task: "Lidar clean and calibrate", hours: 186, every: 200, due: "In about 2 days" },
  { robot: "Patrol dog 1715", task: "Battery health check", hours: 140, every: 250, due: "In about 9 days", booked: "Thu 26 Nov" },
  { robot: "Patrol dog DAA6", task: "Leg joints and bearings", hours: 64, every: 200, due: "In about 3 weeks" },
]

// Past the interval is overdue, past 90 % is due soon: each a shape and a word in its colour. The when stays grey.
const dueState = (pct: number) =>
  pct >= 100
    ? ({ status: "danger", word: "Overdue", text: "text-danger" } as const)
    : pct >= 90
      ? ({ status: "warning", word: "Due soon", text: "text-warning" } as const)
      : undefined

function DueText({ pct, due }: { pct: number; due: string }) {
  const s = dueState(pct)
  return (
    <span className="text-muted-foreground">
      {s && (
        <>
          <span className={cn("inline-flex items-center gap-2 font-medium", s.text)}>
            <StatusGlyph status={s.status} />
            {s.word}
          </span>
          {" · "}
        </>
      )}
      {due}
    </span>
  )
}

/**
 * Service that is coming due, by hours run rather than by date: each robot's meter fills towards its interval and turns
 * to warning near it and danger past it, and the due column says so in a word. Overdue first. Booking a slot is the one
 * action; it takes the robot off missions then.
 */
export function MaintenanceDue() {
  const [rows, setRows] = React.useState(initial)
  const sorted = [...rows].sort((a, b) => b.hours / b.every - a.hours / a.every)
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#maintenance" title="Maintenance" user={sampleUser}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">1 overdue · 1 due this week · intervals from the manufacturer&apos;s service plan</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Robot</TableHead>
              <TableHead className="hidden lg:table-cell">Service</TableHead>
              <TableHead className="hidden sm:table-cell lg:w-56">Hours since last</TableHead>
              <TableHead className="hidden sm:table-cell">Due</TableHead>
              <TableHead className="max-sm:pl-0">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => {
              const pct = (r.hours / r.every) * 100
              const meter = (
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
              )
              return (
                <TableRow key={r.robot + r.task}>
                  <TableCell className="py-3 max-lg:whitespace-normal sm:py-2">
                    <span className="font-medium whitespace-nowrap">{r.robot}</span>
                    {/* On a phone the service, the hours and when it is due stack under the robot, so only the robot and
                        its action share the row; they are columns from wider screens. */}
                    <span className="block text-xs text-muted-foreground lg:hidden">{r.task}</span>
                    <span className="mt-2 flex flex-col gap-1 sm:hidden">
                      {meter}
                      <span className="text-xs">
                        <DueText pct={pct} due={r.due} />
                        {r.booked && <span className="text-muted-foreground"> · booked {r.booked}</span>}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{r.task}</TableCell>
                  <TableCell className="hidden sm:table-cell">{meter}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <DueText pct={pct} due={r.due} />
                  </TableCell>
                  <TableCell className="text-right max-sm:w-0 max-sm:pl-0">
                    {r.booked ? (
                      <span className="text-sm text-muted-foreground max-sm:hidden">Booked {r.booked}</span>
                    ) : (
                      // One style on every row: the urgency is in the meter and the due date, not in the button.
                      <Button
                        size="sm"
                        variant="secondary"
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
    </AppShell>
  )
}
