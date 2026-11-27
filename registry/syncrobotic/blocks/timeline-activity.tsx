// @syncrobotic/timeline-activity v0.53.0 · update: npx shadcn add @syncrobotic/timeline-activity --overwrite
"use client"

import * as React from "react"
import { BatteryCharging, Flag, MapPin, Play, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Timeline, TimelineHeading, TimelineItem } from "@/registry/syncrobotic/ui/timeline"

// Sample data: one robot's shift, newest first, grouped by day. An icon names the kind of event; only the problem is coloured.
const days = [
  {
    day: "Today",
    events: [
      { time: "21:46", at: "2026-11-17T21:46", icon: TriangleAlert, title: "Stopped at door C3", body: "Door closed. Waiting for an operator.", warn: true },
      { time: "21:41", at: "2026-11-17T21:41", icon: MapPin, title: "Checkpoint 2 of 6", body: "Loading bay A, 1 person seen, badge checked." },
      { time: "21:33", at: "2026-11-17T21:33", icon: Play, title: "Started Loading bay sweep", body: "Started by Mei Lin." },
      { time: "19:02", at: "2026-11-17T19:02", icon: BatteryCharging, title: "Charged to 100 %", body: "At Dock 1, 48 minutes." },
    ],
  },
  {
    day: "Yesterday",
    events: [{ time: "23:58", at: "2026-11-16T23:58", icon: Flag, title: "Finished Night patrol", body: "12 of 12 checkpoints, nothing to report." }],
  },
]

/** A robot's shift, newest first and grouped by day, each event with its kind as an icon. */
export function TimelineActivity({ className }: { className?: string }) {
  return (
    <Card className={cn("w-full max-w-xl", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Activity, Patrol dog 9E37</h3>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </div>
      <Timeline>
        {days.map((d) => (
          <React.Fragment key={d.day}>
            <TimelineHeading>{d.day}</TimelineHeading>
            {d.events.map((e) => (
              <TimelineItem
                key={e.at}
                time={e.time}
                dateTime={e.at}
                // The problem is the timeline's warning status: the item colours its icon, and the title, in the text colour, says what happened.
                status={e.warn ? "warning" : undefined}
                icon={<e.icon />}
                title={e.title}
              >
                {e.body}
              </TimelineItem>
            ))}
          </React.Fragment>
        ))}
      </Timeline>
    </Card>
  )
}
