// @syncrobotic/event-log v0.47.0 · update: npx shadcn add @syncrobotic/event-log --overwrite
"use client"

import * as React from "react"
import { ChevronRight, Download, Search, SearchX } from "lucide-react"
import { AppShell, sampleNav, sampleUser } from "@/registry/syncrobotic/blocks/app-shell"
import { alarmPriority, type AlarmPriority } from "@/registry/syncrobotic/ui/alarm"
import { Button } from "@/registry/syncrobotic/ui/button"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Input } from "@/registry/syncrobotic/ui/input"
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/syncrobotic/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/registry/syncrobotic/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"

export type LogEvent = { id: string; time: string; age: "1h" | "24h" | "7d"; priority: AlarmPriority | "info"; source: string; message: string; detail: string }

export const sampleEvents: LogEvent[] = [
  {
    id: "e1",
    time: "14:02:31",
    age: "1h",
    priority: "critical",
    source: "4D21",
    message: "Emergency stop from operator app",
    detail: "Triggered by Pixel 8 (night shift). Robot stopped within 0.4 s. Waiting for release.",
  },
  {
    id: "e2",
    time: "14:01:05",
    age: "1h",
    priority: "high",
    source: "9C44",
    message: "Battery below 15 %",
    detail: "14 % at 14:01. Estimated 12 min left. Return-to-dock suggested.",
  },
  { id: "e3", time: "13:58:12", age: "1h", priority: "info", source: "7F3A", message: "Route Perimeter B started", detail: "6 waypoints, 1.2 km. ETA 14:31." },
  {
    id: "e4",
    time: "13:40:44",
    age: "1h",
    priority: "low",
    source: "2B10",
    message: "Lidar cleaning due",
    detail: "Last cleaned 14 days ago. Schedule at next dock.",
  },
  {
    id: "e5",
    time: "11:20:09",
    age: "24h",
    priority: "high",
    source: "6E77",
    message: "Connection lost",
    detail: "No heartbeat for 60 s. Last position Dock B.",
  },
  {
    id: "e6",
    time: "09:02:50",
    age: "24h",
    priority: "info",
    source: "8F15",
    message: "Firmware 2.5.0 installed",
    detail: "Installed while docked. Self-check passed.",
  },
  {
    id: "e7",
    time: "Mon 18:12",
    age: "7d",
    priority: "low",
    source: "3C62",
    message: "Map out of date · Loading bay",
    detail: "Obstacle layout changed. Re-map recommended.",
  },
]

const ranges = { "1h": "Last hour", "24h": "24 hours", "7d": "7 days" } as const
const order = ["1h", "24h", "7d"] as const

function Level({ priority }: { priority: LogEvent["priority"] }) {
  if (priority === "info") return <span className="text-sm text-muted-foreground">Info</span>
  const p = alarmPriority[priority]
  return (
    <span className={`flex items-center gap-2 text-sm font-medium ${p.text}`}>
      <p.icon aria-hidden="true" className="size-4" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

/** Event log: filter by time, level and text, read the table, open one event in a side sheet by its whole row. */
export function EventLog({ events = sampleEvents }: { events?: LogEvent[] }) {
  const [range, setRange] = React.useState<keyof typeof ranges>("24h")
  const [level, setLevel] = React.useState<string>("all")
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState<LogEvent | null>(null)

  const rows = events.filter(
    (e) =>
      order.indexOf(e.age) <= order.indexOf(range) &&
      (level === "all" || e.priority === level) &&
      `${e.source} ${e.message}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <AppShell
      product="Fleet console"
      nav={sampleNav}
      current="#events"
      title="Event log"
      environment="production"
      user={sampleUser}
      actions={
        <Button variant="secondary" size="sm" className="max-sm:w-(--h-sm) max-sm:px-0">
          <Download aria-hidden="true" />
          <span className="max-sm:sr-only">Export CSV</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SegmentedControl value={range} onValueChange={(v) => v && setRange(v as keyof typeof ranges)} aria-label="Time range" className="lg:w-auto">
            {order.map((r) => (
              <SegmentedControlItem key={r} value={r}>
                {ranges[r]}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger aria-label="Level" className="lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <InputGroup className="lg:ml-auto lg:w-72">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <Input type="search" aria-label="Search events" placeholder="Search source or message" value={query} onChange={(e) => setQuery(e.target.value)} />
          </InputGroup>
        </div>

        {/* The table stays when nothing matches: its header keeps the columns in place and one spanning cell says why. */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Time</TableHead>
              <TableHead className="hidden w-28 sm:table-cell">Level</TableHead>
              <TableHead className="hidden w-24 md:table-cell">Source</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-12 max-sm:pr-2 max-sm:pl-0">
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-auto py-4 whitespace-normal">
                  <EmptyState size="inline" icon={SearchX} title="No events match" description="Widen the time range or clear the filters." />
                </TableCell>
              </TableRow>
            )}
            {rows.map((e) => (
              // The whole row opens the event, as a card opens its site: the message is the button's text, and the button
              // stretches over the row (after:inset-0), so the target is the row's 56 px, not the message's line.
              <TableRow
                key={e.id}
                className="relative hover:bg-accent has-[button:focus-visible]:outline-2 has-[button:focus-visible]:-outline-offset-2 has-[button:focus-visible]:outline-ring"
              >
                <TableCell className="py-2 align-top font-mono text-sm tabular-nums sm:align-middle">
                  {e.time}
                  {/* On a phone the level sits under the time, and the source under the message. */}
                  <span className="mt-1 block font-sans sm:hidden">
                    <Level priority={e.priority} />
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Level priority={e.priority} />
                </TableCell>
                <TableCell className="hidden font-mono text-sm md:table-cell">{e.source}</TableCell>
                <TableCell className="py-2 max-md:whitespace-normal">
                  {/* focus-ring: the row draws the ring (has-[button:focus-visible] on TableRow), since the button covers it. No press:
                      a scale would make the button the box its overlay fills, and shrink the target mid-tap. */}
                  <button data-slot="event-log-open" type="button" onClick={() => setOpen(e)} className="text-left text-sm underline-offset-4 outline-none after:absolute after:inset-0 hover:underline">
                    {e.message}
                  </button>
                  <span className="block font-mono text-xs text-muted-foreground md:hidden">{e.source}</span>
                </TableCell>
                <TableCell className="w-12 text-muted-foreground max-sm:pr-2 max-sm:pl-0">
                  <ChevronRight aria-hidden="true" className="size-5" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="end" className="sm:max-w-md">
          {open && (
            <SheetHeader>
              <SheetTitle>{open.message}</SheetTitle>
              <SheetDescription>
                {open.source} · {open.time}
              </SheetDescription>
              <div className="flex flex-col gap-4 pt-4 text-sm">
                <Level priority={open.priority} />
                <p>{open.detail}</p>
              </div>
            </SheetHeader>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
