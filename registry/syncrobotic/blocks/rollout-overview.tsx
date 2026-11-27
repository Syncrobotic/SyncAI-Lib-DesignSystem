// @syncrobotic/rollout-overview v0.53.0 · update: npx shadcn add @syncrobotic/rollout-overview --overwrite
"use client"

import * as React from "react"
import { Pause, Play, Undo2 } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Progress } from "@/registry/syncrobotic/ui/progress"
import { ResponsiveTable, type ResponsiveTableColumn } from "@/registry/syncrobotic/ui/responsive-table"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"
import { Stepper, StepperItem } from "@/registry/syncrobotic/ui/stepper"

type RobotRow = { robot: string; state: "updated" | "updating" | "failed" | "waiting"; progress?: number; note: string }
const robots: RobotRow[] = [
  { robot: "Patrol dog 4A11", state: "failed", note: "Checksum mismatch after download. Still on 2.4.0, working normally." },
  { robot: "Patrol dog 7F3A", state: "updating", progress: 62, note: "Installing, robot docked" },
  { robot: "Patrol dog 1715", state: "updating", progress: 18, note: "Downloading" },
  { robot: "Patrol dog DAA6", state: "updated", note: "2.4.1, health checks passed" },
  { robot: "Patrol dog B812", state: "waiting", note: "Waits until it docks after its mission (about 22:40)" },
]
const tone: Record<RobotRow["state"], Status> = { updated: "normal", updating: "active", failed: "danger", waiting: "offline" }
const word = { updated: "Updated", updating: "Updating", failed: "Failed", waiting: "Waiting to dock" } as const

const gates = [
  { name: "Failed updates", rule: "at most 2 in this stage", value: "1", ok: true },
  { name: "Robots stopping after update", rule: "none in 30 min", value: "0", ok: true },
  { name: "Mission success", rule: "at least 95 %", value: "98 %", ok: true },
]

const RobotState = ({ state }: { state: RobotRow["state"] }) => <InlineStatus status={tone[state]}>{word[state]}</InlineStatus>

const order = { failed: 0, updating: 1, waiting: 2, updated: 3 }

// One list of columns for the table and the phone rows: the robot is the row's title, its state the trailing shape and
// word, and the progress and detail the line under it.
const columns: ResponsiveTableColumn<RobotRow>[] = [
  { id: "robot", header: "Robot", cell: (r) => <span className="font-medium">{r.robot}</span>, phoneCell: (r) => r.robot },
  { id: "state", header: "State", cell: (r) => <RobotState state={r.state} />, phone: "trailing" },
  {
    id: "progress",
    header: "Progress",
    className: "w-40",
    // Updating is the only blue: the bar of the running work. The state word beside it stays grey.
    cell: (r) =>
      r.state === "updating" ? (
        <span className="flex items-center gap-2">
          <Progress value={r.progress} aria-label={`${r.robot} update progress`} />
          <span className="text-xs text-muted-foreground tabular-nums">{r.progress} %</span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    phoneCell: (r) => (r.state === "updating" ? `${r.progress} %` : undefined),
  },
  { id: "note", header: "Detail", cell: (r) => r.note, className: "whitespace-normal text-muted-foreground" },
]

/**
 * A firmware rollout while it runs: its stage, the gates that pause it, and the robots in the stage, failures first.
 * Updating is the only blue. A failure says what happened and that the robot still works. Pause and roll back are
 * always one click away.
 */
export function RolloutOverview() {
  const [paused, setPaused] = React.useState(false)
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#rollouts"
      title="Firmware 2.4.1"
      user={sampleUser}
      actions={
        <>
          {/* Icon-only on a phone, so the page title keeps its room; the words come back from 640 px. */}
          <Button size="sm" variant="ghost" className="max-sm:w-(--h-sm) max-sm:px-0">
            <Undo2 aria-hidden="true" />
            <span className="max-sm:sr-only">Roll back</span>
          </Button>
          <Button size="sm" variant="secondary" className="max-sm:w-(--h-sm) max-sm:px-0" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            <span className="max-sm:sr-only">{paused ? "Resume rollout" : "Pause rollout"}</span>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-md bg-card p-4 ring-1 ring-border">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{paused ? "Paused at stage 3 by Mei Lin" : "Stage 3 of 4, 50 % of the fleet"}</span>
            <span className="text-sm text-muted-foreground tabular-nums">25 of 56 robots updated · 1 failed</span>
          </div>
          <Stepper value={3} size="sm">
            <StepperItem title="Canary" description="2 robots" />
            <StepperItem title="10 %" description="6 robots" />
            <StepperItem title="50 %" description="28 robots" />
            <StepperItem title="All" description="56 robots" />
          </Stepper>
        </div>

        <section aria-labelledby="gates-title" className="flex flex-col gap-3">
          <SectionHeader id="gates-title" title="Gates" description="The rollout pauses itself if one fails." />
          {/* The cards share their rows (subgrid), so a title on two lines moves every value down with it, never one alone. */}
          <ul className="grid gap-3 sm:grid-cols-3">
            {gates.map((g) => (
              <li key={g.name} className="flex flex-col gap-1 rounded-md bg-card p-4 ring-1 ring-border sm:row-span-3 sm:grid sm:grid-rows-subgrid">
                <span className="text-sm text-muted-foreground">{g.name}</span>
                <span className="text-xl font-bold tabular-nums">{g.value}</span>
                <span className="text-xs text-muted-foreground">
                  {g.ok ? "Passing" : "Failing"}: {g.rule}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="stage-robots" className="flex flex-col gap-3">
          <SectionHeader id="stage-robots" title="Robots in this stage" count={robots.length} />
          <ResponsiveTable
            label="Robots in this stage"
            rows={[...robots].sort((a, b) => order[a.state] - order[b.state])}
            columns={columns}
            rowKey={(r) => r.robot}
            rowActions={(r) =>
              r.state === "failed" ? (
                <Button size="sm" variant="secondary" aria-label={`Retry ${r.robot}`}>
                  Retry
                </Button>
              ) : null
            }
          />
        </section>
      </div>
    </AppShell>
  )
}
