import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bot, Hand, OctagonAlert, Play, Terminal, Wrench } from "lucide-react"
import { Marker, MarkerRow } from "@/registry/syncrobotic/ui/marker"

const meta: Meta = { title: "Display/Marker" }
export default meta
type S = StoryObj

export const MarkerDefault: S = { render: () => <Marker>Today</Marker> }

export const MarkerInLog: S = {
  render: () => (
    <div className="flex flex-col">
      <MarkerRow status="active" title="Patrol started" detail="north-night" time="22:00" />
      <MarkerRow status="normal" title="Gate A checked" time="22:06" />
      <Marker icon={<Hand />} time="22:11">
        Operator took over
      </Marker>
      <MarkerRow icon={<Terminal />} title="Manual drive" detail="12 m · 0.4 m/s" time="22:12" />
      <Marker icon={<Bot />} time="22:14">
        Autonomy resumed
      </Marker>
      <MarkerRow status="normal" title="Gate B checked" time="22:19" />
    </div>
  ),
}

export const MarkerTones: S = {
  render: () => (
    <div className="flex flex-col">
      <Marker>Shift change</Marker>
      <Marker tone="warning">Connection lost for 42 s</Marker>
      <Marker tone="danger" icon={<OctagonAlert />} time="14:02">
        Emergency stop
      </Marker>
    </div>
  ),
}

export const MarkerStartAligned: S = {
  render: () => (
    <div className="flex flex-col">
      <Marker align="start">Monday 17 November</Marker>
      <MarkerRow status="normal" title="Docked" time="06:02" />
      <Marker align="start">Sunday 16 November</Marker>
      <MarkerRow status="warning" title="Battery 12 %" time="21:48" />
    </div>
  ),
}

export const MarkerToolCalls: S = {
  render: () => (
    <div className="flex flex-col font-mono">
      <MarkerRow icon={<Play />} title="search_events" detail={`site="hall-b" since="22:00"`} time="180 ms" />
      <MarkerRow icon={<Play />} title="get_snapshot" detail={`robot="7F3A" camera="front"`} time="940 ms" />
      <MarkerRow status="danger" title="open_door" detail={`door=3 → ETIMEDOUT`} time="5.0 s" />
      <MarkerRow icon={<Wrench />} title="create_work_order" detail={`door="B" priority="normal"`} time="320 ms" />
    </div>
  ),
}

export const MarkerRowStatuses: S = {
  render: () => (
    <div className="flex flex-col">
      <MarkerRow status="active" title="Patrolling" detail="7F3A" time="now" />
      <MarkerRow status="normal" title="Docked" detail="DAA6" time="2 m ago" />
      <MarkerRow status="warning" title="Needs attention" detail="9E37" time="5 m ago" />
      <MarkerRow status="danger" title="Stopped" detail="1715" time="9 m ago" />
      <MarkerRow status="offline" title="Offline" detail="B54C" time="1 h ago" />
    </div>
  ),
}

export const MarkerUnreadDivider: S = {
  render: () => (
    <div className="flex flex-col">
      <MarkerRow status="normal" title="Gate A checked" time="22:06" />
      <Marker>3 new events</Marker>
      <MarkerRow status="warning" title="Door B open" time="22:19" />
      <MarkerRow status="normal" title="Gate C checked" time="22:24" />
      <MarkerRow status="normal" title="Parking lot checked" time="22:31" />
    </div>
  ),
}
