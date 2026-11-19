// @syncrobotic/card-mission v0.13.0 · update: npx shadcn add @syncrobotic/card-mission --overwrite
"use client"

import * as React from "react"
import { Bot, Clock, Route } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Status } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Progress } from "@/registry/syncrobotic/ui/progress"

export type Mission = {
  name: string
  route: string
  robot: string
  state: { tone: Status; label: string }
  /** Checkpoints passed and in total. */
  checkpoints: { done: number; total: number }
  time: string
  /** Blocked missions say why. */
  reason?: string
}

export const sampleMissions: Mission[] = [
  {
    name: "Night patrol",
    route: "Perimeter, 12 checkpoints",
    robot: "Patrol dog 7F3A",
    state: { tone: "active", label: "Running" },
    checkpoints: { done: 7, total: 12 },
    time: "14 min left",
  },
  {
    name: "Loading bay sweep",
    route: "Bay A to C, 6 checkpoints",
    robot: "Patrol dog 9E37",
    state: { tone: "warning", label: "Paused" },
    checkpoints: { done: 2, total: 6 },
    time: "Paused 6 min ago",
    reason: "Door C3 closed. Open it or skip the checkpoint.",
  },
]

/**
 * A mission on a card: its state, the route and the robot on it, how far it is, then what to do next. A running mission
 * shows blue progress, the only in-progress colour; a paused one says why and offers the fix as its one primary action.
 */
export function CardMission({ missions = sampleMissions, className }: { missions?: Mission[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {missions.map((m) => {
        const pct = Math.round((m.checkpoints.done / m.checkpoints.total) * 100)
        const paused = !!m.reason
        return (
          <Card key={m.name} className="gap-4">
            <div className="flex flex-col gap-1">
              <StatusEyebrow status={m.state.tone}>{m.state.label}</StatusEyebrow>
              <h3 className="text-lg font-bold">{m.name}</h3>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Route aria-hidden="true" className="size-4 shrink-0" />
                {m.route}
              </li>
              <li className="flex items-center gap-2">
                <Bot aria-hidden="true" className="size-4 shrink-0" />
                {m.robot}
              </li>
            </ul>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium tabular-nums">
                  {m.checkpoints.done} of {m.checkpoints.total} checkpoints
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock aria-hidden="true" className="size-4" />
                  {m.time}
                </span>
              </div>
              <Progress value={pct} tone={paused ? "neutral" : "info"} aria-label={`${m.name} progress`} />
            </div>
            {m.reason && <p className="rounded-sm bg-warning-subtle p-3 text-sm text-warning">{m.reason}</p>}
            <div className="flex flex-wrap gap-2">
              {paused ? (
                <>
                  <Button size="sm">Skip checkpoint</Button>
                  <Button size="sm" variant="ghost">
                    Open map
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary">
                    Open map
                  </Button>
                  <Button size="sm" variant="ghost">
                    Pause
                  </Button>
                </>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
