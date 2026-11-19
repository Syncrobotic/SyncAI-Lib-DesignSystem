// @syncrobotic/timeline-audit v0.13.0 · update: npx shadcn add @syncrobotic/timeline-audit --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Card } from "@/registry/syncrobotic/ui/card"
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
 * Who changed what, as a history: the person (or "System"), the action, the thing, and the value before and after. A
 * filter narrows it to people or to the system. Nothing here is coloured: an audit log records, it does not alarm.
 */
export function TimelineAudit({ className }: { className?: string }) {
  const [who, setWho] = React.useState("all")
  const shown = entries.filter((e) => who === "all" || (who === "people" ? e.who : !e.who))
  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Changes at Taoyuan plant</h3>
        <SegmentedControl aria-label="Show changes by" value={who} onValueChange={(v) => v && setWho(v)}>
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="people">People</SegmentedControlItem>
          <SegmentedControlItem value="system">System</SegmentedControlItem>
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
                <code className="rounded-xs bg-muted px-1 font-mono text-muted-foreground line-through">{e.change.from}</code>
                <span aria-hidden="true">→</span>
                <span className="sr-only">to</span>
                <code className="rounded-xs bg-muted px-1 font-mono text-foreground">{e.change.to}</code>
              </span>
            )}
          </TimelineItem>
        ))}
      </Timeline>
    </Card>
  )
}
