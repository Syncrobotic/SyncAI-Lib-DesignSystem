// @syncrobotic/maintenance-due v0.40.0 · update: npx shadcn add @syncrobotic/maintenance-due --overwrite
"use client"

import * as React from "react"
import { CircleCheck } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"

export type Due = { robot: string; task: string; hours: number; every: number; due: string; booked?: string }

// Sample data: hours run since the last service, against the interval. Past 90 % is due soon; past 100 % is overdue.
const initial: Due[] = [
  { robot: "Patrol dog 9E37", task: "Leg joints and bearings", hours: 212, every: 200, due: "12 h over" },
  { robot: "Patrol dog 7F3A", task: "Lidar clean and calibrate", hours: 186, every: 200, due: "In about 2 days" },
  { robot: "Patrol dog 1715", task: "Battery health check", hours: 140, every: 250, due: "In about 9 days", booked: "Thu 26 Nov" },
  { robot: "Patrol dog DAA6", task: "Leg joints and bearings", hours: 64, every: 200, due: "In about 3 weeks" },
]

// Past the interval is overdue, past 90 % is due soon: each an InlineStatus, its shape and word. The when stays grey.
const dueState = (pct: number) =>
  pct >= 100 ? ({ status: "danger", word: "Overdue" } as const) : pct >= 90 ? ({ status: "warning", word: "Due soon" } as const) : undefined

const pctOf = (r: Due) => (r.hours / r.every) * 100

// One list of columns for the table and the phone rows: the robot is the row's title, the service and the hours the line
// under it, and a due state, when there is one, its trailing shape and word.
const columns: ResponsiveTableColumn<Due>[] = [
  { id: "robot", header: "Robot", cell: (r) => <span className="font-medium">{r.robot}</span>, phoneCell: (r) => r.robot },
  { id: "task", header: "Service", cell: (r) => r.task, className: "hidden lg:table-cell" },
  {
    id: "hours",
    header: "Hours since last",
    cell: (r) => (
      <Meter inline label={`${r.robot}, hours since ${r.task}`} value={r.hours} max={r.every} unit={`of ${r.every} h`} higherIsWorse low={r.every * 0.9} critical={r.every} />
    ),
    phoneCell: (r) => `${formatCount(r.hours)} of ${formatCount(r.every)} h`,
    className: "lg:w-56",
  },
  {
    id: "due",
    header: "Due",
    phone: "trailing",
    cell: (r) => {
      const s = dueState(pctOf(r))
      return (
        <span className="flex flex-wrap items-center gap-x-2">
          {s && <InlineStatus status={s.status}>{s.word}</InlineStatus>}
          <span className="text-muted-foreground">{r.due}</span>
        </span>
      )
    },
    phoneCell: (r) => {
      const s = dueState(pctOf(r))
      return s ? <InlineStatus status={s.status}>{s.word}</InlineStatus> : undefined
    },
  },
]

/**
 * Service that is coming due, by hours run rather than by date: each robot's meter fills towards its interval and turns
 * to warning near it and danger past it, and the due column says so in a word. Overdue first. Booking a slot is the one
 * action; it takes the robot off missions then. The same rows are a table where there is room and a list on a phone.
 */
export function MaintenanceDue({ rows: initialRows = initial }: { rows?: Due[] } = {}) {
  const [rows, setRows] = React.useState(initialRows)
  const sorted = [...rows].sort((a, b) => b.hours / b.every - a.hours / a.every)
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#maintenance" title="Maintenance" user={sampleUser}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">1 overdue · 1 due this week · intervals from the manufacturer&apos;s service plan</p>
        <ResponsiveTable
          label="Service coming due"
          rows={sorted}
          columns={columns}
          rowKey={(r) => r.robot + r.task}
          rowActions={(r) =>
            r.booked ? (
              <span className="text-sm whitespace-nowrap text-muted-foreground">Booked {r.booked}</span>
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
            )
          }
          empty={<EmptyState size="inline" icon={CircleCheck} title="Nothing coming due" description="Every robot is inside its service interval." />}
        />
      </div>
    </AppShell>
  )
}
