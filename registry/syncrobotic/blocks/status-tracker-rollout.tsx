// @syncrobotic/status-tracker-rollout v0.17.4 · update: npx shadcn add @syncrobotic/status-tracker-rollout --overwrite
"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { Progress } from "@/registry/syncrobotic/ui/progress"

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
            {/* The running stage's bar is blue, a finished one grey; the stage's word under it stays grey. */}
            <Progress value={(s.done / s.robots) * 100} tone={s.state === "running" ? "info" : "neutral"} aria-label={`${s.name} stage`} />
            <span className="text-xs text-muted-foreground">{s.state === "done" ? "Done" : s.state === "running" ? "Updating now" : "Waiting"}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
