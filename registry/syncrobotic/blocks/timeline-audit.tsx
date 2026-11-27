// @syncrobotic/timeline-audit v0.53.0 · update: npx shadcn add @syncrobotic/timeline-audit --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/registry/syncrobotic/lib/format-number"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Code } from "@/registry/syncrobotic/ui/code"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Timeline, TimelineItem } from "@/registry/syncrobotic/ui/timeline"

type Entry = {
  at: string
  time: string
  who: { name: string; initials: string } | null
  action: string
  target: string
  change?: { field: string; from: string; to: string }
}

// Sample data: a site's change history. A system entry has no person, and says so.
const entries: Entry[] = [
  {
    at: "2026-11-17T14:02",
    time: "Today, 14:02",
    who: { name: "Mei Lin", initials: "ML" },
    action: "changed the role of",
    target: "Chen Wei",
    change: { field: "Role", from: "Viewer", to: "Operator" },
  },
  {
    at: "2026-11-17T11:30",
    time: "Today, 11:30",
    who: null,
    action: "updated firmware on",
    target: "Patrol dog 7F3A",
    change: { field: "Firmware", from: "2.4.0", to: "2.4.1" },
  },
  {
    at: "2026-11-17T09:15",
    time: "Today, 09:15",
    who: { name: "Chen Wei", initials: "CW" },
    action: "edited the route",
    target: "Perimeter",
    change: { field: "Checkpoints", from: "11", to: "12" },
  },
  { at: "2026-11-16T18:47", time: "Yesterday, 18:47", who: { name: "Mei Lin", initials: "ML" }, action: "revoked the API key", target: "Old test script" },
]

/**
 * Who changed what, with the value before and after, filtered to people or the system. Nothing here is coloured: an
 * audit log records, it does not alarm.
 */
export function TimelineAudit({ className }: { className?: string }) {
  const [who, setWho] = React.useState("all")
  const by = (w: string) => entries.filter((e) => w === "all" || (w === "people" ? e.who : !e.who))
  const shown = by(who)
  // Slices that cover the log, one always on: a SegmentedControl, each count after its word (compact, as on a tab).
  const count = (w: string) => formatCount(by(w).length, { compact: true })
  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Changes at Taoyuan plant</h3>
        <SegmentedControl aria-label="Show changes by" value={who} onValueChange={(v) => v && setWho(v)} className="w-auto">
          <SegmentedControlItem value="all">All {count("all")}</SegmentedControlItem>
          <SegmentedControlItem value="people">People {count("people")}</SegmentedControlItem>
          <SegmentedControlItem value="system">System {count("system")}</SegmentedControlItem>
        </SegmentedControl>
      </div>
      <Timeline size="sm">
        {shown.map((e) => (
          <TimelineItem
            key={e.at}
            time={e.time}
            dateTime={e.at}
            icon={
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{e.who?.initials ?? "SY"}</AvatarFallback>
              </Avatar>
            }
            title={
              <span className="font-normal">
                <span className="font-medium">{e.who?.name ?? "System"}</span> {e.action} <span className="font-medium">{e.target}</span>
              </span>
            }
          >
            {e.change && (
              <span className="inline-flex flex-wrap items-center gap-2 text-xs">
                {e.change.field}
                <Code className="text-muted-foreground line-through">{e.change.from}</Code>
                <span aria-hidden="true">→</span>
                <span className="sr-only">to</span>
                <Code>{e.change.to}</Code>
              </span>
            )}
          </TimelineItem>
        ))}
      </Timeline>
    </Card>
  )
}
