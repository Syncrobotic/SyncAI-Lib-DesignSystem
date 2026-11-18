// @syncrobotic/mission-schedule v0.10.0 · update: npx shadcn add @syncrobotic/mission-schedule --overwrite
"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav } from "@/registry/syncrobotic/blocks/app-shell"
import { Button } from "@/registry/syncrobotic/ui/button"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"

type Slot = { name: string; start: number; end: number; state: "done" | "running" | "planned" | "conflict"; note?: string }
type Lane = { robot: string; slots: Slot[] }

// Sample data: hours from 18:00 (0) to 06:00 (12). One mission overlaps the robot's charging window, so it is the one in colour.
const nights: Record<"tonight" | "tomorrow", Lane[]> = {
  tonight: [
    {
      robot: "Patrol dog 7F3A",
      slots: [
        { name: "Perimeter", start: 0, end: 2, state: "done" },
        { name: "Night patrol", start: 3, end: 5.5, state: "running" },
        { name: "Perimeter", start: 8, end: 10, state: "planned" },
      ],
    },
    {
      robot: "Patrol dog 9E37",
      slots: [
        { name: "Loading bay", start: 1, end: 3, state: "done" },
        {
          name: "Loading bay",
          start: 6,
          end: 8.5,
          state: "conflict",
          note: "It overlaps its charging time; the round needs 40 % battery and it will have 22 %",
        },
      ],
    },
    {
      robot: "Patrol dog 1715",
      slots: [
        { name: "Car park", start: 0.5, end: 2.5, state: "done" },
        { name: "Car park", start: 4, end: 6, state: "planned" },
        { name: "Car park", start: 9, end: 11, state: "planned" },
      ],
    },
    { robot: "Patrol dog DAA6", slots: [{ name: "Server room", start: 2, end: 3, state: "done" }] },
  ],
  tomorrow: [
    { robot: "Patrol dog 7F3A", slots: [{ name: "Perimeter", start: 1, end: 3, state: "planned" }] },
    { robot: "Patrol dog 9E37", slots: [{ name: "Loading bay", start: 2, end: 4, state: "planned" }] },
    { robot: "Patrol dog 1715", slots: [{ name: "Car park", start: 0, end: 2, state: "planned" }] },
    { robot: "Patrol dog DAA6", slots: [] },
  ],
}

const HOURS = 12
const clock = (h: number) => {
  const t = (18 + h) % 24
  return `${String(Math.floor(t)).padStart(2, "0")}:${t % 1 ? "30" : "00"}`
}
const stateWord = { done: "done", running: "running now", planned: "planned", conflict: "conflict" } as const
const slotStyle = {
  done: "bg-muted text-muted-foreground",
  running: "bg-info-subtle text-foreground ring-1 ring-info ring-inset",
  planned: "bg-card text-foreground ring-1 ring-border ring-inset",
  conflict: "bg-warning-subtle text-foreground ring-1 ring-warning ring-inset",
} as const

/**
 * A night's missions, one lane per robot across the hours. Done missions are muted, the running one is the only blue,
 * planned ones are outlined; a mission that cannot run as planned is the only thing in warning, with the reason written out.
 */
export function MissionSchedule() {
  const [night, setNight] = React.useState<"tonight" | "tomorrow">("tonight")
  const lanes = nights[night]
  const conflicts = lanes.flatMap((l) => l.slots.filter((s) => s.state === "conflict").map((s) => ({ ...s, robot: l.robot })))
  const now = night === "tonight" ? 4.25 : undefined
  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#overview"
      title="Schedule"
      user={{ name: "Mei Lin", initials: "ML" }}
      actions={
        <Button size="sm">
          <Plus aria-hidden="true" />
          Schedule mission
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl aria-label="Night" value={night} onValueChange={(v) => v && setNight(v as typeof night)}>
            <SegmentedControlItem value="tonight">Tonight</SegmentedControlItem>
            <SegmentedControlItem value="tomorrow">Tomorrow night</SegmentedControlItem>
          </SegmentedControl>
          <span className="text-sm text-muted-foreground">18:00 to 06:00 · Taipei HQ</span>
        </div>

        {conflicts.map((c) => (
          <p key={c.robot + c.start} role="status" className="rounded-sm bg-warning-subtle p-3 text-sm text-warning">
            {c.robot}, {c.name} at {clock(c.start)}: {c.note}.
          </p>
        ))}

        <div className="overflow-x-auto rounded-md bg-card ring-1 ring-border">
          <div className="min-w-2xl">
            <div aria-hidden="true" className="grid grid-cols-[10rem_1fr] border-b border-border text-xs text-muted-foreground">
              <span />
              <div className="relative h-8">
                {Array.from({ length: HOURS / 2 + 1 }, (_, i) => i * 2).map((h) => (
                  <span
                    key={h}
                    className="absolute top-2 -translate-x-1/2 tabular-nums first:translate-x-0 last:-translate-x-full"
                    style={{ left: `${(h / HOURS) * 100}%` }}
                  >
                    {clock(h)}
                  </span>
                ))}
              </div>
            </div>
            <ul>
              {lanes.map((l) => (
                <li key={l.robot} className="grid grid-cols-[10rem_1fr] items-center border-b border-border last:border-b-0">
                  <span className="px-4 text-sm font-medium">{l.robot}</span>
                  <div className="relative h-14">
                    {now !== undefined && <span aria-hidden="true" className="absolute inset-y-0 w-px bg-info" style={{ left: `${(now / HOURS) * 100}%` }} />}
                    {l.slots.length === 0 && <span className="absolute inset-y-0 left-2 flex items-center text-xs text-muted-foreground">No missions</span>}
                    <ul aria-label={`${l.robot} missions`}>
                      {l.slots.map((s) => (
                        <li
                          key={s.start}
                          className={cn("absolute inset-y-2 flex items-center overflow-hidden rounded-xs px-2 text-xs", slotStyle[s.state])}
                          style={{ left: `${(s.start / HOURS) * 100}%`, width: `${((s.end - s.start) / HOURS) * 100}%` }}
                        >
                          <span className="truncate">
                            <span className="font-medium">{s.name}</span>{" "}
                            <span className="tabular-nums">
                              {clock(s.start)}–{clock(s.end)}
                            </span>
                            <span className="sr-only">, {stateWord[s.state]}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Muted: done. Blue: running now (the line is the time). Outlined: planned. Amber: cannot run as planned.</p>
      </div>
    </AppShell>
  )
}
