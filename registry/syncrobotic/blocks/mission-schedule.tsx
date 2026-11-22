// @syncrobotic/mission-schedule v0.28.0 · update: npx shadcn add @syncrobotic/mission-schedule --overwrite
"use client"

import * as React from "react"
import { Plus, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
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
        { name: "Car park", start: 4, end: 6, state: "running" },
        { name: "Car park", start: 9, end: 11, state: "planned" },
      ],
    },
    { robot: "Patrol dog DAA6", slots: [{ name: "Server room", start: 1.5, end: 3.5, state: "done" }] },
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
const stateWord = { done: "Done", running: "Running now", planned: "Planned", conflict: "Cannot run as planned" } as const
// The word inside a timeline bar, where a 2-hour bar holds about 12 characters.
const shortWord = { done: "Done", running: "Running", planned: "Planned", conflict: "Cannot run" } as const
const slotStyle = {
  done: "bg-muted text-muted-foreground",
  running: "bg-info-subtle text-foreground ring-1 ring-info ring-inset",
  planned: "bg-card text-foreground ring-1 ring-border ring-inset",
  conflict: "bg-warning-subtle text-foreground ring-1 ring-warning ring-inset",
} as const

/**
 * A night's missions, one lane per robot across the hours. Every mission says its state in a word; done missions are
 * muted, running ones are the only blue, planned ones are outlined; a mission that cannot run as planned is the only
 * thing in warning, with the reason written out above the schedule.
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
      current="#schedule"
      title="Schedule"
      user={sampleUser}
      actions={
        <Button size="sm">
          <Plus aria-hidden="true" />
          Schedule mission
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl aria-label="Night" value={night} onValueChange={(v) => v && setNight(v as typeof night)} className="w-auto">
            <SegmentedControlItem value="tonight">Tonight</SegmentedControlItem>
            <SegmentedControlItem value="tomorrow">Tomorrow night</SegmentedControlItem>
          </SegmentedControl>
          <span className="text-sm text-muted-foreground">18:00 to 06:00 · Taipei HQ</span>
        </div>

        {conflicts.map((c) => (
          <Alert key={c.robot + c.start} tone="warning">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>
              {c.robot}, {c.name} at {clock(c.start)} cannot run as planned
            </AlertTitle>
            <AlertDescription>{c.note}.</AlertDescription>
          </Alert>
        ))}

        {/*
          Phones and tablets (below 1024 px, beside a shell's sidebar): one list per robot, every mission in words, instead of
          a timeline that would show a few hours of twelve or cut its blocks at the edge.
        */}
        <ul aria-label="Missions by robot" className="flex flex-col rounded-md bg-card ring-1 ring-border lg:hidden">
          {lanes.map((l) => (
            <li key={l.robot} className="flex flex-col gap-2 border-b border-border p-4 last:border-b-0">
              <span className="text-sm font-medium">{l.robot}</span>
              {l.slots.length === 0 ? (
                <span className="text-xs text-muted-foreground">No missions</span>
              ) : (
                <ul aria-label={`${l.robot} missions`} className="flex flex-col gap-2">
                  {l.slots.map((s) => (
                    <li key={s.start} className={cn("flex min-h-(--h-md) items-center justify-between gap-3 rounded-xs px-3 py-2 text-sm", slotStyle[s.state])}>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{stateWord[s.state]}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {clock(s.start)}–{clock(s.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-md bg-card ring-1 ring-border lg:block">
          <div className="min-w-3xl">
            {/* The track stops 16 px short of the card's edge, so the last hour and a mission that runs to it are whole. */}
            <div aria-hidden="true" className="grid grid-cols-[10rem_1fr] border-b border-border pr-4 text-xs text-muted-foreground">
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
                <li key={l.robot} className="grid grid-cols-[10rem_1fr] items-center border-b border-border pr-4 last:border-b-0">
                  <span className="px-4 text-sm font-medium">{l.robot}</span>
                  <div className="relative h-20">
                    {now !== undefined && <span aria-hidden="true" className="absolute inset-y-0 w-px bg-foreground" style={{ left: `${(now / HOURS) * 100}%` }} />}
                    {l.slots.length === 0 && <span className="absolute inset-y-0 left-2 flex items-center text-xs text-muted-foreground">No missions</span>}
                    <ul aria-label={`${l.robot} missions`}>
                      {l.slots.map((s) => {
                        // Name, state word and time, three lines inside the bar they name, so a state never rests on its
                        // fill alone. A mission is at least two hours wide in the sample, which holds its name; a shorter
                        // one in your data is cut with an ellipsis and keeps its full name, state and time in the tooltip:
                        // a label beside the bar read as a label for the empty space next to it.
                        const short = s.end - s.start < 1.5
                        return (
                          <li
                            key={s.start}
                            title={`${s.name}, ${stateWord[s.state].toLowerCase()}, ${clock(s.start)}–${clock(s.end)}`}
                            className={cn("absolute inset-y-2 flex flex-col justify-center rounded-xs text-xs leading-4", short ? "px-1" : "px-2", slotStyle[s.state])}
                            style={{ left: `${(s.start / HOURS) * 100}%`, width: `${((s.end - s.start) / HOURS) * 100}%` }}
                          >
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">{s.name}</span>
                              <span className="truncate">
                                <span className="sr-only">, </span>
                                {shortWord[s.state]}
                                <span className="sr-only">, </span>
                              </span>
                              <span className="truncate text-muted-foreground tabular-nums">
                                {clock(s.start)}–{clock(s.end)}
                              </span>
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* The key names states, never colours: each swatch is drawn as its bars are, and the word is the one in them. */}
        <ul aria-label="Key" className="hidden flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground lg:flex">
          {(["done", "running", "planned", "conflict"] as const).map((k) => (
            <li key={k} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn("h-3 w-6 rounded-2xs", slotStyle[k])} />
              {stateWord[k]}
            </li>
          ))}
          {now !== undefined && (
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-px bg-foreground" />
              Now
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  )
}
