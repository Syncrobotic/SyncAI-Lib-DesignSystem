// @syncrobotic/status-tracker-runs v0.9.0 · update: npx shadcn add @syncrobotic/status-tracker-runs --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/registry/syncrobotic/ui/card"

type Run = "ok" | "partial" | "failed"
const cell: Record<Run, string> = { ok: "bg-muted-foreground/50", partial: "bg-warning", failed: "bg-danger" }
// Sample data: the last 20 runs of each route, oldest first.
const seq = (s: string): Run[] => s.split("").map((c) => (c === "x" ? "failed" : c === "~" ? "partial" : "ok"))
const routes = [
  { name: "Night patrol · North", runs: seq("....~.........x....."), last: "Today 22:00" },
  { name: "Dock sweep · Hall B", runs: seq("...................."), last: "Today 18:30" },
  { name: "Perimeter · East fence", runs: seq("..x...~..x.....~x..x"), last: "Today 21:15" },
]

/** Run history per route: the last 20 runs as a strip, newest on the right, with the pass count and the last run in words. */
export function StatusTrackerRuns() {
  return (
    <Card>
      <h3 className="text-sm font-medium">Route runs · last 20</h3>
      <ul className="flex flex-col divide-y divide-border">
        {routes.map((r) => {
          const ok = r.runs.filter((x) => x === "ok").length
          const lastBad = r.runs[r.runs.length - 1] !== "ok"
          return (
            <li key={r.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
              <span className="flex min-w-48 flex-1 flex-col">
                <span className="text-sm font-medium">{r.name}</span>
                <span className={cn("text-xs", lastBad ? "text-danger" : "text-muted-foreground")}>
                  Last run {r.last}
                  {lastBad ? " · failed" : ""}
                </span>
              </span>
              <span className="flex h-5 items-stretch gap-0.5" aria-hidden="true">
                {r.runs.map((x, i) => (
                  <span key={i} className={cn("w-2 rounded-xs", cell[x])} />
                ))}
              </span>
              <span className="w-14 text-right text-sm tabular-nums">{ok}/20</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
