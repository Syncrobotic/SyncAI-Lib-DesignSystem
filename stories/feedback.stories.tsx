import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { Alarm, AlarmList, type AlarmData } from "@/registry/syncrobotic/ui/alarm"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, Toaster, toast } from "@/registry/syncrobotic/ui/toast"

// Feedback, from most to least urgent: alarm (operator must act), alert (a condition on this page), toast (what just happened).
const meta: Meta = { title: "Feedback" }
export default meta
type S = StoryObj

export const AlarmPriorities: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Alarm priority="critical" title="Collision risk · Hall B" source="Patrol dog 7F3A" time="14:02:31" active acknowledged={false} onAcknowledge={fn()} />
      <Alarm priority="high" title="Battery 12 %, 9 min left" source="Patrol dog 7F3A" time="14:01:05" active acknowledged={false} onAcknowledge={fn()} />
      <Alarm priority="low" title="Lidar cleaning due" source="Courier 2B19" time="13:40:12" active acknowledged={false} onAcknowledge={fn()} />
    </div>
  ),
}

export const AlarmStates: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Alarm priority="high" title="Localisation degraded · Floor 3" source="Courier 2B19" time="14:05:44" active acknowledged={false} onAcknowledge={fn()} />
      <Alarm priority="high" title="Localisation degraded · Floor 3" source="Courier 2B19" time="14:05:44" active acknowledged />
      <Alarm
        priority="high"
        title="Localisation degraded · Floor 3"
        source="Courier 2B19"
        time="14:05:44"
        active={false}
        acknowledged={false}
        onAcknowledge={fn()}
      />
    </div>
  ),
}

export const AlarmWithAction: S = {
  render: () => (
    <Alarm
      priority="critical"
      title="Person in restricted zone · Dock 4"
      source="Patrol dog 7F3A"
      time="14:06:02"
      active
      acknowledged={false}
      action={{ label: "Open camera", onClick: fn() }}
      onAcknowledge={fn()}
    />
  ),
}

function AlarmPanel() {
  // From the robot fleet, oldest first. The list sorts: unacknowledged, then priority, then newest.
  const [alarms, setAlarms] = React.useState<AlarmData[]>([
    { id: "a1", priority: "low", title: "Lidar cleaning due", source: "Courier 2B19", time: "13:40", active: true, acknowledged: true },
    { id: "a2", priority: "high", title: "Battery 12 %, 9 min left", source: "Patrol dog 7F3A", time: "14:01", active: true, acknowledged: false },
    { id: "a3", priority: "critical", title: "Collision risk · Hall B", source: "Patrol dog 7F3A", time: "14:02", active: true, acknowledged: false },
  ])
  const acknowledge = (id: string) => setAlarms((list) => list.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  return <AlarmList alarms={alarms} onAcknowledge={acknowledge} />
}

export const AlarmListSorted: S = { render: () => <AlarmPanel /> }

function ShelvingPanel() {
  // Shelve a nuisance alarm for a while (the app asks how long; here, until 15:30). Critical alarms cannot be shelved.
  const [alarms, setAlarms] = React.useState<AlarmData[]>([
    { id: "s1", priority: "critical", title: "Collision risk · Hall B", source: "Patrol dog 7F3A", time: "14:02", active: true, acknowledged: false },
    { id: "s2", priority: "high", title: "Wi-Fi weak · Dock 2", source: "Courier 2B19", time: "13:58", active: true, acknowledged: false },
    { id: "s3", priority: "low", title: "Lidar cleaning due", source: "Courier 2B19", time: "13:40", active: true, acknowledged: false, shelvedUntil: "15:30" },
    { id: "s4", priority: "high", title: "Not moving", source: "Courier 5C01", time: "13:20", active: true, acknowledged: false, suppressed: true },
    { id: "s5", priority: "low", title: "Bumper sensor fault", source: "Tug 0A77", time: "09:12", active: true, acknowledged: true, outOfService: true },
  ])
  const set = (id: string, patch: Partial<AlarmData>) => setAlarms((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  return (
    <AlarmList
      alarms={alarms}
      onAcknowledge={(id) => set(id, { acknowledged: true })}
      onShelve={(id) => set(id, { shelvedUntil: "15:30" })}
      onUnshelve={(id) => set(id, { shelvedUntil: undefined })}
    />
  )
}

/** Shelved alarms leave the live list into their own group, quiet, with the way back. Suppressed and out-of-service ones are counted under it. */
export const AlarmListShelved: S = { render: () => <ShelvingPanel /> }

const NOW = Date.UTC(2026, 10, 18, 14, 10)
const flood: AlarmData[] = [
  { id: "f0", priority: "critical", title: "Network down · Hall B", source: "Site", time: "14:09", active: true, acknowledged: false, raisedAt: NOW - 60_000 },
  { id: "f1", priority: "high", title: "Lost connection", source: "Patrol dog 7F3A", time: "14:09", active: true, acknowledged: false, raisedAt: NOW - 55_000 },
  ...Array.from({ length: 14 }, (_, i): AlarmData => ({
    id: `fl${i}`,
    priority: "low",
    title: "Telemetry delayed",
    source: `Courier ${(0x2b10 + i).toString(16).toUpperCase()}`,
    time: "14:09",
    active: true,
    acknowledged: false,
    raisedAt: NOW - 50_000 + i * 1000,
  })),
]

/** One network fault raises 16 alarms in a minute. Over 10 in 10 minutes is a flood: the list says so, keeps critical and high in view and folds the low ones. */
export const AlarmListFlood: S = { render: () => <AlarmList alarms={flood} now={NOW} feedback={false} onAcknowledge={fn()} /> }

function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toast({ tone: "success", title: "Route saved", description: "Night patrol · 6 waypoints" })}>
        Save route
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Waypoint deleted", action: { label: "Undo", onClick: () => toast({ title: "Waypoint restored" }) } })}
      >
        Delete waypoint
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ tone: "danger", title: "Couldn't upload the map", description: "Check the connection and try again." })}
      >
        Upload map
      </Button>
      <Toaster />
    </div>
  )
}

export const ToastTones: S = { render: () => <ToastDemo /> }

// Visual test: the three tones, open.
export const ToastOpen: S = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <ToastProvider>
      <Toast tone="success" open duration={Infinity}>
        <ToastTitle>Route saved</ToastTitle>
        <ToastDescription>Night patrol · 6 waypoints</ToastDescription>
        <ToastClose className="absolute top-3 right-3" />
      </Toast>
      <Toast open duration={Infinity}>
        <ToastTitle>Waypoint deleted</ToastTitle>
        <ToastAction altText="Undo deleting the waypoint">Undo</ToastAction>
        <ToastClose className="absolute top-3 right-3" />
      </Toast>
      <Toast tone="danger" open duration={Infinity}>
        <ToastTitle>Couldn&apos;t upload the map</ToastTitle>
        <ToastDescription>Check the connection and try again.</ToastDescription>
        <ToastClose className="absolute top-3 right-3" />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
}

// Toasts drawn in place, for reading their anatomy; in an app they come from toast() and the Toaster.
function InPlace({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <ToastProvider label={label}>
      {children}
      <ToastViewport className="static max-w-none p-0" />
    </ToastProvider>
  )
}

/** An action keeps the toast 8 s instead of 4. */
export const ToastWithUndo: S = {
  render: () => (
    <InPlace label="Undo example">
      <Toast open duration={Infinity}>
        <ToastTitle>3 waypoints deleted</ToastTitle>
        <ToastDescription>Night patrol now has 4 stops.</ToastDescription>
        <ToastAction altText="Undo deleting 3 waypoints">Undo</ToastAction>
        <ToastClose className="absolute top-3 right-3" />
      </Toast>
    </InPlace>
  ),
}

/** Failures stay until dismissed and say what to do next. */
export const ToastFailureWithRetry: S = {
  render: () => (
    <InPlace label="Failure example">
      <Toast tone="danger" open duration={Infinity}>
        <ToastTitle>Couldn&apos;t send the route to 2 robots</ToastTitle>
        <ToastDescription>Courier 9E37 and Courier 1715 are offline. It will be sent when they reconnect.</ToastDescription>
        <ToastAction altText="Retry sending the route">Retry now</ToastAction>
        <ToastClose className="absolute top-3 right-3" />
      </Toast>
    </InPlace>
  ),
}

/** Title only: the shortest toast. */
export const ToastTitleOnly: S = {
  render: () => (
    <InPlace label="Short example">
      <Toast tone="success" open duration={Infinity}>
        <ToastTitle>Copied</ToastTitle>
        <ToastClose className="absolute top-3 right-3" />
      </Toast>
    </InPlace>
  ),
}

function QueueDemo() {
  let n = 0
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          for (const name of ["North gate", "Hall B", "Perimeter", "Parking lot"])
            toast({ tone: "success", title: `${name} patrol done`, description: `Run ${++n}` })
        }}
      >
        Finish 4 patrols at once
      </Button>
      <p className="text-xs text-muted-foreground">At most three show; the oldest makes room.</p>
      <Toaster />
    </div>
  )
}

export const ToastQueue: S = { render: () => <QueueDemo /> }
