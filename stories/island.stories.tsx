import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Bluetooth, Check, CircleAlert, Square, Zap } from "lucide-react"
import { Island, IslandAlarm, IslandNotice } from "@/registry/syncrobotic/shell/island"
import { alarmEdge, topAlarm, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

const meta: Meta<typeof Island> = {
  title: "Shell/Dynamic island",
  component: Island,
  args: { name: "Patrol dog 7F3A", tone: "info", unread: 2, className: "static" },
}
export default meta
type S = StoryObj<typeof Island>

export const Default: S = {}
export const AnotherDogNeedsAttention: S = { args: { attention: true } }
export const LowBattery: S = { args: { battery: 18 } }
export const Loading: S = { args: { loading: true, tone: "neutral", unread: 0 } }
export const Notice: S = {
  args: { children: <IslandNotice tone="success" icon={Check} title="Parking lot patrol saved" meta="Next run 11/16 02:00" onDismiss={fn()} /> },
}
export const Reversible: S = {
  args: {
    children: <IslandNotice tone="info" icon={Zap} title="Returning to the charging dock" meta="7F3A · just now" action={{ label: "Cancel", onClick: fn() }} onDismiss={fn()} />,
  },
}
export const FailureStaysUntilHandled: S = {
  args: {
    children: (
      <IslandNotice tone="danger" icon={CircleAlert} title="Not dispatched: connection lost" meta="2B10 did not receive the command" action={{ label: "Retry", onClick: fn() }} emphasis onDismiss={fn()} />
    ),
  },
}
export const BluetoothOnlyPersistent: S = {
  args: {
    tone: "neutral",
    online: false,
    edge: "warning",
    children: <IslandNotice tone="warning" icon={Bluetooth} title="Bluetooth only" meta="Emergency stop and device status still work" action={{ label: "Retry", onClick: fn() }} persistent />,
  },
}
export const StoppedPersistent: S = {
  args: { tone: "danger", edge: "danger", children: <IslandNotice tone="danger" icon={Square} title="Night shift · Pixel 8 triggered an emergency stop" meta="7F3A · 21:08" persistent /> },
}

const fleetAlarms: AlarmData[] = [
  { id: "a1", priority: "high", title: "Battery 12 %", source: "7F3A", time: "14:01", active: true, acknowledged: false },
  { id: "a2", priority: "critical", title: "Collision risk · Hall B", source: "7F3A", time: "14:02", active: true, acknowledged: false },
]
// The most urgent unacknowledged alarm sits in the island, above notices; the edge takes its colour.
export const AlarmInIsland: S = {
  args: {
    tone: "danger",
    edge: alarmEdge(topAlarm(fleetAlarms)),
    children: <IslandAlarm alarms={fleetAlarms} onAcknowledge={fn()} onShowAll={fn()} />,
  },
}
