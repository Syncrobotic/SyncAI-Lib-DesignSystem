// @syncrobotic/status-tracker-runs v0.17.3 · update: npx shadcn add @syncrobotic/status-tracker-runs --overwrite
"use client"

import { cn } from "@/lib/utils"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"

type Run = "ok" | "partial" | "failed"
// A run that passed is calm grey, opaque and 3:1 on the card (--input, the field-edge grey); only the others take colour.
const cell: Record<Run, string> = { ok: "bg-input", partial: "bg-warning", failed: "bg-danger" }
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
      <CardDataHeader title="Route runs · last 20" />
      <ul className="flex flex-col divide-y divide-border">
        {routes.map((r) => {
          const ok = r.runs.filter((x) => x === "ok").length
          const lastBad = r.runs[r.runs.length - 1] !== "ok"
          return (
            <li key={r.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
              <span className="flex w-48 min-w-0 flex-col">
                <span className="text-sm font-medium">{r.name}</span>
                <span className={cn("text-xs", lastBad ? "text-danger" : "text-muted-foreground")}>
                  Last run {r.last}
                  {lastBad ? " · failed" : ""}
                </span>
              </span>
              {/* The strip takes the rest of the row, its count right after it; on a phone the two wrap together. */}
              <span className="flex min-w-56 flex-1 items-center gap-3">
                <span className="flex h-5 flex-1 items-stretch gap-0.5" aria-hidden="true">
                  {r.runs.map((x, i) => (
                    <span key={i} className={cn("flex-1 rounded-xs", cell[x])} />
                  ))}
                </span>
                <span className="text-sm tabular-nums">
                  {ok}/20<span className="sr-only"> runs passed</span>
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
