// @syncrobotic/status-tracker-uptime v0.53.0 · update: npx shadcn add @syncrobotic/status-tracker-uptime --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardDataHeader } from "@/registry/syncrobotic/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

type Day = "up" | "degraded" | "down" | "none"
// Normal days stay neutral; only degraded and down are coloured. "none" is a day with no data (not yet deployed): an empty
// outlined cell, not a lighter grey, so it never reads as a calm day. Every mark is opaque and at least 3:1 on the card
// (--input is the field-edge grey, held to 3:1 by tests/unit/rules.test.ts).
const cell: Record<Day, string> = { up: "bg-input", degraded: "bg-warning", down: "bg-danger", none: "bg-transparent ring-1 ring-input ring-inset" }
const word: Record<Day, string> = { up: "Up", degraded: "Degraded", down: "Down", none: "No data" }

// Sample data: the last 30 days per robot, oldest first.
const pattern = (seed: number): Day[] =>
  Array.from({ length: 30 }, (_, i) =>
    (i * 7 + seed * 13) % 29 === 0 ? "down" : (i * 5 + seed * 3) % 17 === 0 ? "degraded" : seed === 3 && i < 6 ? "none" : "up",
  )
const robots = ["7F3A", "DAA6", "9E37", "1715"].map((id, s) => ({ id, days: pattern(s) }))

/**
 * One robot's 30 days. The strip is one Tab stop; ← → (Home, End) move along it and the focused day says itself in its
 * tooltip and its name, so the days can be read without a pointer.
 */
function Strip({ label, days }: { label: string; days: Day[] }) {
  const [active, setActive] = React.useState(days.length - 1)
  const cells = React.useRef<(HTMLSpanElement | null)[]>([])
  const go = (i: number) => {
    const to = Math.max(0, Math.min(days.length - 1, i))
    setActive(to)
    cells.current[to]?.focus()
  }
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- arrow keys bubbled from the roving-tabindex day cells move between them
    <span
      role="group"
      aria-label={label}
      className="flex h-6 gap-0.5"
      onKeyDown={(e) => {
        const keys: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: days.length - 1 }
        const to = keys[e.key]
        if (to === undefined) return
        e.preventDefault()
        go(to)
      }}
    >
      {days.map((d, i) => {
        const text = `${days.length - i} ${days.length - i === 1 ? "day" : "days"} ago · ${word[d]}`
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                ref={(el) => {
                  cells.current[i] = el
                }}
                role="img"
                aria-label={text}
                tabIndex={i === active ? 0 : -1}
                onFocus={() => setActive(i)}
                className={cn("flex-1 rounded-xs transition-opacity duration-(--motion-fast) ease-(--ease-standard) hover:opacity-70", cell[d])}
              />
            </TooltipTrigger>
            <TooltipContent>{text}</TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}

/**
 * One cell a day per robot: grey where it ran, colour only on degraded and down days, with a tooltip per day. Here 30
 * days of uptime per robot.
 */
export function StatusTrackerUptime() {
  return (
    <TooltipProvider delayDuration={100}>
      <Card>
        <CardDataHeader
          title="Uptime · last 30 days"
          actions={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {(["up", "degraded", "down", "none"] as Day[]).map((d) => (
                <span key={d} className="flex items-center gap-1">
                  <span aria-hidden="true" className={cn("size-2.5 rounded-xs", cell[d])} /> {word[d]}
                </span>
              ))}
            </span>
          }
        />
        <ul className="flex flex-col gap-3">
          {robots.map((r) => {
            const known = r.days.filter((d) => d !== "none")
            const pct = ((known.filter((d) => d === "up").length / known.length) * 100).toFixed(1)
            const bad = r.days.filter((d) => d === "down").length
            return (
              <li key={r.id} className="flex flex-col gap-1">
                <span className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className="font-medium text-foreground">Patrol dog {r.id}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {pct} % up{bad ? ` · ${bad} ${bad === 1 ? "day" : "days"} down` : ""}
                  </span>
                </span>
                <Strip label={`Patrol dog ${r.id}, each day`} days={r.days} />
              </li>
            )
          })}
        </ul>
      </Card>
    </TooltipProvider>
  )
}
