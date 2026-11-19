// @syncrobotic/status-tracker-rollout v0.17.3 · update: npx shadcn add @syncrobotic/status-tracker-rollout --overwrite
"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"

// Sample data: a firmware rollout through its stages. Blue marks the stage that is running now, the only in-progress state.
const stages = [
  { name: "Canary", robots: 2, done: 2, state: "done" },
  { name: "10 %", robots: 6, done: 6, state: "done" },
  { name: "50 %", robots: 28, done: 17, state: "running" },
  { name: "All", robots: 56, done: 0, state: "waiting" },
] as const

/** A rollout as stage lanes: finished stages checked and neutral, the running one in progress (blue), later ones waiting. */
export function StatusTrackerRollout() {
  return (
    <Card>
      <CardDataHeader title="Firmware 2.4.1 rollout">
        <p className="text-xs text-muted-foreground tabular-nums">25 of 56 robots updated · no failures</p>
      </CardDataHeader>
      <ol className="grid gap-3 sm:grid-cols-4">
        {stages.map((s) => (
          <li key={s.name} className="flex flex-col gap-2">
            <span className="flex items-center justify-between gap-2 text-xs">
              <span className={cn("flex items-center gap-2 font-medium", s.state === "waiting" && "text-muted-foreground")}>
                {s.state === "done" && <Check aria-hidden="true" className="size-4" />}
                {s.name}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {s.done}/{s.robots}
              </span>
            </span>
            <span
              role="progressbar"
              aria-label={`${s.name} stage`}
              aria-valuemin={0}
              aria-valuemax={s.robots}
              aria-valuenow={s.done}
              className="h-2 overflow-hidden rounded-full bg-track"
            >
              <span
                className={cn("block h-full rounded-full", s.state === "running" ? "bg-info" : "bg-foreground/70")}
                style={{ width: `${(s.done / s.robots) * 100}%` }}
              />
            </span>
            <span className="text-xs text-muted-foreground">{s.state === "done" ? "Done" : s.state === "running" ? "Updating now" : "Waiting"}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
