// @syncrobotic/agent-runs v0.40.0 · update: npx shadcn add @syncrobotic/agent-runs --overwrite
"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { formatDuration, type TraceStatus } from "@/registry/syncrobotic/ui/trace"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

export type Run = {
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

// Each state is a shape and a word; only the two that need someone (an approval, a failure) are coloured.
const runStatus: Record<Run["status"], Status> = {
  approval: "warning",
  running: "active",
  error: "danger",
  done: "normal",
  warning: "warning",
  pending: "normal",
  skipped: "normal",
}

const RunState = ({ status }: { status: Run["status"] }) => <InlineStatus status={runStatus[status]}>{word[status]}</InlineStatus>

// One list of columns for the table and the phone rows: the goal is the row's title, the agent the line under it, the
// state the trailing shape and word; what started it, the steps and the time stay in the table.
const columns: ResponsiveTableColumn<Run>[] = [
  {
    id: "run",
    header: "Run",
    phone: "title",
    cell: (r) => (
      <span className="flex flex-col whitespace-normal">
        <span>{r.goal}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {r.agent} · <span className="font-mono">{r.id}</span>
        </span>
      </span>
    ),
    phoneCell: (r) => r.goal,
  },
  { id: "agent", header: "Agent", cell: (r) => r.agent, className: "hidden" },
  { id: "state", header: "State", cell: (r) => <RunState status={r.status} />, phone: "trailing" },
  { id: "trigger", header: "Started by", cell: (r) => `${r.trigger}, ${r.started}`, phone: "hidden", className: "hidden text-muted-foreground lg:table-cell" },
  { id: "steps", header: "Steps", cell: (r) => formatCount(r.steps), align: "end", phone: "hidden", className: "hidden tabular-nums lg:table-cell" },
  { id: "time", header: "Time", cell: (r) => formatDuration(r.duration), align: "end", phone: "hidden", className: "hidden text-muted-foreground tabular-nums lg:table-cell" },
]

/**
 * What the AI agents did and are doing: each run's goal in words, what started it, and its state. A run waiting for a
 * person's approval comes first and is the only one with a button; a failure says it failed. The same rows are a table
 * where there is room and a list on a phone.
 */
export function AgentRuns({ onOpen }: { onOpen?: (run: Run) => void } = {}) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const shown = runs.filter(matches[filter])
  const count = (f: Filter) => formatCount(runs.filter(matches[f]).length, { compact: true })
  return (
    <AppShell product="Fleet console" nav={sampleNav} current="#agents" title="Agent runs" user={sampleUser}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* A few slices of one list, one always on: a SegmentedControl, each count after its word. */}
          <SegmentedControl aria-label="Show runs" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} className="sm:w-auto">
            <SegmentedControlItem value="all">All {count("all")}</SegmentedControlItem>
            <SegmentedControlItem value="attention">Needs someone {count("attention")}</SegmentedControlItem>
            <SegmentedControlItem value="running">Running {count("running")}</SegmentedControlItem>
          </SegmentedControl>
          <span className="text-sm text-muted-foreground">Agents only suggest changes to robots; a person approves them.</span>
        </div>
        <ResponsiveTable
          label="Agent runs"
          rows={shown}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => onOpen?.(r)}
          rowActions={(r) =>
            r.status === "approval" ? (
              <Button size="sm" aria-label={`Review ${r.goal}`}>
                Review
              </Button>
            ) : null
          }
          empty={<EmptyState size="inline" icon={Sparkles} title="No runs here" description="Runs show up here as soon as an agent starts one." />}
        />
      </div>
    </AppShell>
  )
}
