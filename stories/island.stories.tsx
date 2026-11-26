import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import * as React from "react"
import { BatteryLow, Bluetooth, Check, CircleAlert, MapPin, Square, Zap } from "lucide-react"
import {
  Island,
  IslandAlarm,
  IslandNotice,
  IslandNotifications,
  IslandRobots,
  IslandStatus,
  type IslandNotification,
  type IslandRobot,
  type IslandZone,
} from "@/registry/syncrobotic/shell/island"
import { alarmEdge, topAlarm, type AlarmData } from "@/registry/syncrobotic/ui/alarm"

const meta: Meta<typeof Island> = {
  title: "Shell/Dynamic island",
  component: Island,
  // Static in the example frame (in the app it is fixed under the status bar) and as wide as the frame, as it is on a phone.
  args: { name: "Patrol dog 7F3A", status: "active", battery: 72, unread: 2, className: "static w-full" },
}
export default meta
type S = StoryObj<typeof Island>

export const Default: S = {}
export const AnotherDogNeedsAttention: S = { args: { attention: true } }
export const LowBattery: S = { args: { battery: 12 } }
/** No reading yet: the level is unknown, never a made-up number. */
export const BatteryUnknown: S = { args: { battery: undefined } }
export const Loading: S = { args: { loading: true, status: "offline", unread: 0 } }
export const Notice: S = {
  args: { children: <IslandNotice tone="success" icon={Check} title="Parking lot patrol saved" meta="Next run 16 Nov 02:00" onDismiss={fn()} /> },
}
export const Reversible: S = {
  args: {
    children: (
      <IslandNotice
        tone="info"
        icon={Zap}
        title="Returning to the charging dock"
        meta="7F3A · just now"
        action={{ label: "Cancel", onClick: fn() }}
        onDismiss={fn()}
      />
    ),
  },
}
export const FailureStaysUntilHandled: S = {
  args: {
    children: (
      <IslandNotice
        tone="danger"
        icon={CircleAlert}
        title="Not dispatched: connection lost"
        meta="2B10 did not receive the command"
        action={{ label: "Retry", onClick: fn() }}
        emphasis
        onDismiss={fn()}
      />
    ),
  },
}
export const BluetoothOnlyPersistent: S = {
  args: {
    status: "offline",
    online: false,
    edge: "warning",
    children: (
      <IslandNotice
        tone="warning"
        icon={Bluetooth}
        title="Bluetooth only"
        meta="Emergency stop and device status still work"
        action={{ label: "Retry", onClick: fn() }}
        persistent
      />
    ),
  },
}
export const StoppedPersistent: S = {
  args: {
    status: "danger",
    edge: "danger",
    children: <IslandNotice tone="danger" icon={Square} title="Night shift · Pixel 8 triggered an emergency stop" meta="7F3A · 21:08" persistent />,
  },
}

const fleetAlarms: AlarmData[] = [
  { id: "a1", priority: "high", title: "Battery 12 %", source: "7F3A", time: "14:01", active: true, acknowledged: false },
  { id: "a2", priority: "critical", title: "Collision risk · Hall B", source: "7F3A", time: "14:02", active: true, acknowledged: false },
]
// The most urgent unacknowledged alarm sits in the island, above notices; the edge takes its colour.
export const AlarmInIsland: S = {
  args: {
    status: "danger",
    edge: alarmEdge(topAlarm(fleetAlarms)),
    children: <IslandAlarm alarms={fleetAlarms} onAcknowledge={fn()} onShowAll={fn()} />,
  },
}

// ---------- Each zone opens its own panel ----------

const robots: IslandRobot[] = [
  { id: "7F3A", name: "Patrol dog 7F3A", status: "active", state: "Patrolling · North gate", battery: 72 },
  { id: "9E37", name: "Patrol dog 9E37", status: "warning", state: "Stuck at the loading bay", battery: 12, attention: true },
  { id: "DAA6", name: "Patrol dog DAA6", status: "normal", state: "Docked · Dock 2", battery: 100 },
  { id: "C2B0", name: "Patrol dog C2B0", status: "offline", state: "Offline · last seen 21:40" },
]
const notifications: IslandNotification[] = [
  { id: "n1", title: "9E37 is stuck at the loading bay", meta: "Needs someone to clear the path", time: "14:06", unread: true, tone: "warning", icon: CircleAlert },
  { id: "n2", title: "Battery 12 % on 9E37", meta: "Returning to the dock after this round", time: "14:01", unread: true, icon: BatteryLow },
  { id: "n3", title: "Night patrol finished", meta: "7F3A · 3 rounds, no incidents", time: "06:02", icon: Check },
  { id: "n4", title: "Route changed: North gate", meta: "By Mei Lin", time: "Yesterday", icon: MapPin },
]

/** The name opens the robots this phone controls: switch to another; the one that needs attention carries the triangle. */
export const NameOpen: S = {
  args: { attention: true, defaultOpen: "name", panels: { name: <IslandRobots robots={robots} current="7F3A" onSelect={fn()} /> } },
}
/** The device status opens how the phone reaches the robot, its battery and when it last reported. */
export const StatusOpen: S = {
  args: { defaultOpen: "status", panels: { status: <IslandStatus link="wifi" battery={72} updated="14:06:31" /> } },
}
/** Bluetooth only: the connection says what still works, in words; the battery is unknown, not made up. */
export const StatusOpenBluetoothOnly: S = {
  args: {
    status: "offline",
    online: false,
    battery: undefined,
    edge: "warning",
    defaultOpen: "status",
    panels: { status: <IslandStatus link="bluetooth" updated="2 min ago" /> },
  },
}
/** The bell opens the latest notifications, unread ones first in bold with a dot; "Mark all read" clears the count. */
export const BellOpen: S = {
  args: { defaultOpen: "bell", panels: { bell: <IslandNotifications items={notifications} onOpen={fn()} onMarkAllRead={fn()} /> } },
}
export const BellOpenEmpty: S = {
  args: { unread: 0, defaultOpen: "bell", panels: { bell: <IslandNotifications items={[]} /> } },
}

/** All three, working: tap a zone to open its panel, tap it again, press Esc or tap outside to close. */
export const EveryZone: S = {
  render: function EveryZone(args) {
    const [current, setCurrent] = React.useState("7F3A")
    const [items, setItems] = React.useState(notifications)
    const [open, setOpen] = React.useState<IslandZone | null>(null)
    const robot = robots.find((r) => r.id === current)!
    return (
      <Island
        {...args}
        name={robot.name}
        status={robot.status}
        battery={robot.battery}
        attention={robots.some((r) => r.attention && r.id !== current)}
        unread={items.filter((n) => n.unread).length}
        open={open}
        onOpenChange={setOpen}
        panels={{
          name: (
            <IslandRobots
              robots={robots}
              current={current}
              onSelect={(id) => {
                setCurrent(id)
                setOpen(null)
              }}
            />
          ),
          status: <IslandStatus link={robot.status === "offline" ? "offline" : "wifi"} battery={robot.battery} updated="14:06:31" />,
          bell: <IslandNotifications items={items} onOpen={(id) => setItems((l) => l.map((n) => (n.id === id ? { ...n, unread: false } : n)))} onMarkAllRead={() => setItems((l) => l.map((n) => ({ ...n, unread: false })))} />,
        }}
      />
    )
  },
}
