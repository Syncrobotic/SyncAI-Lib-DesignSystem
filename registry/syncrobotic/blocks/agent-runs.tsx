// @syncrobotic/agent-runs v0.17.3 · update: npx shadcn add @syncrobotic/agent-runs --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { TraceStatusIcon, formatDuration, type TraceStatus } from "@/registry/syncrobotic/ui/trace"
import { Button } from "@/registry/syncrobotic/ui/button"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

type Run = {
  id: string
  agent: string
  goal: string
  trigger: string
  status: TraceStatus | "approval"
  started: string
  duration: number
  steps: number
}

// Sample data. An agent that wants to change something in the world waits for a person: that wait is the one call to action.
const runs: Run[] = [
  {
    id: "run_8c21",
    agent: "Route planner",
    goal: "Reroute around door C3",
    trigger: "Incident IN-2041",
    status: "approval",
    started: "21:58",
    duration: 14200,
    steps: 6,
  },
  {
    id: "run_8c1f",
    agent: "Incident writer",
    goal: "Summarise IN-2041 for the morning shift",
    trigger: "Every 30 min",
    status: "running",
    started: "21:59",
    duration: 8100,
    steps: 3,
  },
  {
    id: "run_8c0a",
    agent: "Maintenance planner",
    goal: "Book overdue services",
    trigger: "Daily 08:00",
    status: "error",
    started: "08:00",
    duration: 3900,
    steps: 4,
  },
  {
    id: "run_8bf3",
    agent: "Route planner",
    goal: "Plan tonight's patrols",
    trigger: "Daily 17:30",
    status: "done",
    started: "17:30",
    duration: 22500,
    steps: 9,
  },
  { id: "run_8be0", agent: "Incident writer", goal: "Summarise IN-2039", trigger: "Every 30 min", status: "done", started: "17:00", duration: 6400, steps: 3 },
]
const word: Record<Run["status"], string> = {
  approval: "Needs your approval",
  running: "Running",
  error: "Failed",
  done: "Done",
  warning: "Done with warnings",
  pending: "Queued",
  skipped: "Skipped",
}

type Filter = "all" | "attention" | "running"
const matches: Record<Filter, (r: Run) => boolean> = {
  all: () => true,
  attention: (r) => r.status === "approval" || r.status === "error",
  running: (r) => r.status === "running",
}

function RunState({ status }: { status: Run["status"] }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 whitespace-nowrap",
        status === "approval" && "font-medium text-warning",
        status === "error" && "font-medium text-danger",
      )}
    >
      {status === "approval" ? (
        <TraceStatusIcon status="warning" />
      ) : (
        <TraceStatusIcon status={status} className={status === "running" ? "text-info" : undefined} />
      )}
      {word[status]}
    </span>
  )
}

/**
 * What the AI agents did and are doing: each run's goal in words, what started it, and its state. A run waiting for a
 * person's approval comes first and is the only one with a button; running is blue, a failure says it failed.
 */
export function AgentRuns() {
  const [filter, setFilter] = React.useState<Filter>("all")
  const shown = runs.filter(matches[filter])
  const count = (f: Filter) => runs.filter(matches[f]).length
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#agents" title="Agent runs" user={sampleUser}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl aria-label="Show runs" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} className="sm:w-auto">
            <SegmentedControlItem value="all">All {count("all")}</SegmentedControlItem>
            <SegmentedControlItem value="attention">Needs someone {count("attention")}</SegmentedControlItem>
            <SegmentedControlItem value="running">Running {count("running")}</SegmentedControlItem>
          </SegmentedControl>
          <span className="text-sm text-muted-foreground">Agents only suggest changes to robots; a person approves them.</span>
        </div>
        {/* Table draws its own edge, scroll and fades; a second frame around it clipped or doubled them. */}
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead>Run</TableHead>
              <TableHead className="hidden sm:table-cell">State</TableHead>
              <TableHead className="hidden lg:table-cell">Started by</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Steps</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Time</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="py-2 whitespace-normal">
                  {/* At least the control height (44, 48 in gloves): two short lines alone are a 36 px target. */}
                  <a href={`#${r.id}`} className="flex min-h-(--h-md) flex-col justify-center hover:underline">
                    <span className="font-medium">{r.goal}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.agent} · <span className="font-mono">{r.id}</span>
                    </span>
                  </a>
                  {/* On a phone the state sits under the goal instead of in a column off the screen. */}
                  <span className="mt-1 block sm:hidden">
                    <RunState status={r.status} />
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <RunState status={r.status} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {r.trigger}, {r.started}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{r.steps}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">{formatDuration(r.duration)}</TableCell>
                <TableCell className="text-right">
                  {r.status === "approval" && (
                    <Button size="sm" aria-label={`Review ${r.goal}`}>
                      Review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  )
}
