// @syncrobotic/status-tracker-uptime v0.9.0 · update: npx shadcn add @syncrobotic/status-tracker-uptime --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

type Day = "up" | "degraded" | "down" | "none"
// Normal days stay neutral; only degraded and down are coloured. "none" is a day with no data (not yet deployed).
const cell: Record<Day, string> = { up: "bg-muted-foreground/50", degraded: "bg-warning", down: "bg-danger", none: "bg-muted" }
const word: Record<Day, string> = { up: "Up", degraded: "Degraded", down: "Down", none: "No data" }

// Sample data: the last 30 days per robot, oldest first.
const pattern = (seed: number): Day[] =>
  Array.from({ length: 30 }, (_, i) =>
    (i * 7 + seed * 13) % 29 === 0 ? "down" : (i * 5 + seed * 3) % 17 === 0 ? "degraded" : seed === 3 && i < 6 ? "none" : "up",
  )
const robots = ["7F3A", "DAA6", "9E37", "1715"].map((id, s) => ({ id, days: pattern(s) }))

/** Uptime per robot over 30 days, one cell a day: a calm grey strip where everything ran, colour only on the bad days. */
export function StatusTrackerUptime() {
  return (
    <TooltipProvider delayDuration={100}>
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium">Uptime · last 30 days</h3>
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            {(["up", "degraded", "down"] as Day[]).map((d) => (
              <span key={d} className="flex items-center gap-1">
                <span aria-hidden="true" className={cn("size-2.5 rounded-xs", cell[d])} /> {word[d]}
              </span>
            ))}
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {robots.map((r) => {
            const known = r.days.filter((d) => d !== "none")
            const pct = ((known.filter((d) => d === "up").length / known.length) * 100).toFixed(1)
            const bad = r.days.filter((d) => d === "down").length
            return (
              <li key={r.id} className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-foreground">Patrol dog {r.id}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {pct} % up{bad ? ` · ${bad} ${bad === 1 ? "day" : "days"} down` : ""}
                  </span>
                </span>
                <span className="flex h-6 gap-0.5" aria-hidden="true">
                  {r.days.map((d, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <span
                          className={cn("flex-1 rounded-xs transition-opacity duration-(--motion-fast) ease-(--ease-standard) hover:opacity-70", cell[d])}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {30 - i} {30 - i === 1 ? "day" : "days"} ago · {word[d]}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    </TooltipProvider>
  )
}
