// @syncrobotic/rollout-overview v0.17.2 · update: npx shadcn add @syncrobotic/rollout-overview --overwrite
"use client"

import * as React from "react"
import { Pause, Play, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Progress } from "@/registry/syncrobotic/ui/progress"
import { Stepper, StepperItem } from "@/registry/syncrobotic/ui/stepper"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

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

function RobotState({ state, progress }: { state: RobotRow["state"]; progress?: number }) {
  return (
    <span className={cn("flex items-center gap-2", state === "failed" && "font-medium text-danger")}>
      <StatusGlyph status={tone[state]} />
      {word[state]}
      {state === "updating" && progress !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{progress} %</span>}
    </span>
  )
}

/**
 * A firmware rollout while it runs: the stage it is in, the gates that pause it on their own, and the robots in this
 * stage, failures first. Updating is the only blue. A failure says what happened and that the robot still works. Pause and
 * roll back are always one click away.
 */
export function RolloutOverview() {
  const [paused, setPaused] = React.useState(false)
  const order = { failed: 0, updating: 1, waiting: 2, updated: 3 }
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#robots"
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
          <h2 id="gates-title" className="text-sm font-medium">
            Gates <span className="font-normal text-muted-foreground">· the rollout pauses itself if one fails</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {gates.map((g) => (
              <li key={g.name} className="flex flex-col gap-1 rounded-md bg-card p-4 ring-1 ring-border">
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
          <h2 id="stage-robots" className="text-sm font-medium">
            Robots in this stage
          </h2>
          <div className="overflow-x-auto rounded-md bg-card ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Robot</TableHead>
                  <TableHead className="hidden sm:table-cell">State</TableHead>
                  <TableHead className="hidden w-40 sm:table-cell">Progress</TableHead>
                  <TableHead className="hidden md:table-cell">Detail</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...robots]
                  .sort((a, b) => order[a.state] - order[b.state])
                  .map((r) => (
                    <TableRow key={r.robot}>
                      <TableCell className="py-2 max-md:whitespace-normal">
                        <span className="font-medium">{r.robot}</span>
                        {/* On a phone the state, progress and detail stack under the robot instead of scrolling off the side. */}
                        <span className="mt-1 flex flex-col gap-1 sm:hidden">
                          <RobotState state={r.state} progress={r.progress} />
                        </span>
                        <span className="block text-xs text-muted-foreground md:hidden">{r.note}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <RobotState state={r.state} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {r.state === "updating" ? (
                          <span className="flex items-center gap-2">
                            <Progress value={r.progress} aria-label={`${r.robot} update progress`} />
                            <span className="text-xs text-muted-foreground tabular-nums">{r.progress} %</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{r.note}</TableCell>
                      <TableCell className="text-right">
                        {r.state === "failed" && (
                          <Button size="sm" variant="secondary" aria-label={`Retry ${r.robot}`}>
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
