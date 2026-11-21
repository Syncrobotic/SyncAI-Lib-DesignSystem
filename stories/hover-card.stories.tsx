import type { Meta, StoryObj } from "@storybook/react-vite"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/syncrobotic/ui/hover-card"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { StatusGlyph, type Status } from "@/registry/syncrobotic/shell/status-glyph"

// The overlay has a closed story (point at the link; used on the docs site) and an *Open story for visual tests.
const meta: Meta = { title: "Overlays/Hover card" }
export default meta
type S = StoryObj

type Robot = { id: string; name: string; site: string; state: string; status: Status; battery: number; lastSeen: string }
const robots: Record<string, Robot> = {
  "7F3A": { id: "7F3A", name: "Patrol dog 7F3A", site: "Warehouse 2", state: "Patrolling", status: "active", battery: 82, lastSeen: "Now" },
  "9C44": { id: "9C44", name: "Patrol dog 9C44", site: "Warehouse 2", state: "Returning to dock", status: "warning", battery: 12, lastSeen: "Now" },
  "2B10": { id: "2B10", name: "Patrol dog 2B10", site: "Loading bay", state: "Offline", status: "offline", battery: 64, lastSeen: "2 h ago, 14:02" },
}

/** The robot's ID as a link to its page, with a preview of what that page says. Everything on the card is on the page too. */
function RobotLink({ id, open }: { id: string; open?: boolean }) {
  const r = robots[id]
  return (
    <HoverCard defaultOpen={open}>
      <HoverCardTrigger asChild>
        <a href={`#robots/${r.id}`} className="font-medium underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
          {r.id}
        </a>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-medium">{r.name}</p>
          <p className="flex items-center gap-2 text-pretty text-muted-foreground">
            <StatusGlyph status={r.status} /> {r.state} · {r.site}
          </p>
        </div>
        <Meter label="Battery" value={r.battery} low={15} />
        <p className="text-xs text-muted-foreground">Last seen: {r.lastSeen}</p>
      </HoverCardContent>
    </HoverCard>
  )
}

const events = [
  { time: "14:32", what: "Door 4 left open", robot: "7F3A" },
  { time: "14:18", what: "Battery under 15 %", robot: "9C44" },
  { time: "14:02", what: "Lost connection", robot: "2B10" },
]

/** An event list whose robot IDs preview the robot. Point at an ID, or Tab to it; click it to open the robot's page. */
export const HoverCardDefault: S = {
  render: () => (
    <ul className="flex max-w-md flex-col divide-y divide-border rounded-md bg-card text-sm ring-1 ring-border">
      {events.map((e) => (
        <li key={e.time} className="flex min-h-(--h-md) items-center gap-3 px-4 py-2">
          <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{e.time}</span>
          <span className="min-w-0 flex-1">{e.what}</span>
          <RobotLink id={e.robot} />
        </li>
      ))}
    </ul>
  ),
}

/** In a sentence: the link still reads as a link, and the card adds nothing the robot's page does not have. */
export const HoverCardInText: S = {
  render: () => (
    <p className="max-w-md text-sm text-pretty">
      <RobotLink id="9C44" /> is returning to its dock with 12 % battery; <RobotLink id="7F3A" /> takes over the perimeter patrol until it is charged.
    </p>
  ),
}

export const HoverCardOpen: S = {
  render: () => (
    <div className="min-h-72 p-4 text-sm">
      Robot <RobotLink id="9C44" open />
    </div>
  ),
}
