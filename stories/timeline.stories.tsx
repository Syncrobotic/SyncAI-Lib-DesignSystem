import type { Meta, StoryObj } from "@storybook/react-vite"
import { BatteryCharging, GitCommitVertical, MapPin, Rocket, Wrench } from "lucide-react"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Timeline, TimelineHeading, TimelineItem } from "@/registry/syncrobotic/ui/timeline"

const meta: Meta = { title: "Display/Timeline" }
export default meta
type S = StoryObj

export const TimelineDefault: S = {
  render: () => (
    <Timeline>
      <TimelineItem time="08:00" dateTime="2026-11-17T08:00" title="Shift started">
        Patrol dog 7F3A left the dock with 98 % battery.
      </TimelineItem>
      <TimelineItem time="09:12" dateTime="2026-11-17T09:12" title="North gate patrol done" />
      <TimelineItem time="10:40" dateTime="2026-11-17T10:40" title="Returned to dock" />
    </Timeline>
  ),
}

export const TimelineIncident: S = {
  render: () => (
    <Timeline>
      <TimelineItem time="14:02:31" tone="danger" title="Emergency stop pressed">
        Operator Lin stopped Patrol dog 7F3A from the console.
      </TimelineItem>
      <TimelineItem time="14:01:58" tone="warning" title="Obstacle in path">
        Pallet blocking corridor B-4. Robot slowed to 0.3 m/s.
      </TimelineItem>
      <TimelineItem time="14:00:10" tone="info" title="Patrol started" />
      <TimelineItem time="13:58:00" tone="success" title="Docked, charged" />
    </Timeline>
  ),
}

export const TimelineWithIcons: S = {
  render: () => (
    <Timeline>
      <TimelineItem time="Today" icon={<Wrench />} title="Lidar cleaned">
        By Chen, 6 min
      </TimelineItem>
      <TimelineItem time="Yesterday" icon={<BatteryCharging />} title="Battery replaced" />
      <TimelineItem time="Nov 12" icon={<MapPin />} title="Moved to Hall B" />
      <TimelineItem time="Oct 30" icon={<Rocket />} title="Commissioned" />
    </Timeline>
  ),
}

export const TimelineGroupedByDay: S = {
  render: () => (
    <Timeline size="sm">
      <TimelineHeading>Today</TimelineHeading>
      <TimelineItem time="10:40" title="Returned to dock" />
      <TimelineItem time="09:12" title="North gate patrol done" />
      <TimelineHeading>Yesterday</TimelineHeading>
      <TimelineItem time="17:55" tone="warning" title="Battery 18 %" />
      <TimelineItem time="16:20" title="Hall B patrol done" />
    </Timeline>
  ),
}

export const TimelineAlternate: S = {
  render: () => (
    <Timeline align="alternate">
      <TimelineItem time="v2.4.1 · Nov 14" title="Smoother docking">
        Approach speed drops near the charger.
      </TimelineItem>
      <TimelineItem time="v2.4.0 · Oct 28" title="Thermal camera support" />
      <TimelineItem time="v2.3.0 · Sep 30" title="Night patrol mode" />
    </Timeline>
  ),
}

export const TimelineHorizontal: S = {
  render: () => (
    <Timeline orientation="horizontal">
      <TimelineItem time="Oct 30" title="Ordered" />
      <TimelineItem time="Nov 4" title="Shipped" />
      <TimelineItem time="Nov 10" title="On site" />
      <TimelineItem time="Nov 12" tone="info" title="Commissioning" />
    </Timeline>
  ),
}

export const TimelineReleaseNotes: S = {
  render: () => (
    <Timeline>
      {[
        { v: "0.9.0", d: "Nov 17", notes: ["Data grid", "Stepper", "Timeline"] },
        { v: "0.8.0", d: "Nov 17", notes: ["MCP server", "Meter", "Pagination"] },
        { v: "0.7.0", d: "Nov 3", notes: ["Command palette", "Chart"] },
      ].map((r) => (
        <TimelineItem key={r.v} icon={<GitCommitVertical />} time={r.d} title={`Version ${r.v}`}>
          <span className="flex flex-wrap gap-2 pt-1">
            {r.notes.map((n) => (
              <Badge key={n} tone="outline">
                {n}
              </Badge>
            ))}
          </span>
        </TimelineItem>
      ))}
    </Timeline>
  ),
}
