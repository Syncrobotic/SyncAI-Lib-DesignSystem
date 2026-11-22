import type { Meta, StoryObj } from "@storybook/react-vite"
import { Diagnostics, type DiagnosticStatus } from "@/registry/syncrobotic/ui/diagnostics"

const meta: Meta = { title: "Display/Diagnostics" }
export default meta
type S = StoryObj

// Every story measures from one fixed moment, so "updated 12 s ago" and Stale read the same in every screenshot.
const now = new Date(2026, 10, 21, 14, 2, 31).getTime()
const at = (secondsAgo: number) => now - secondsAgo * 1000

// An AMR's /diagnostics_agg, as the aggregator names it: one group per subsystem, one status per device.
const amr: DiagnosticStatus[] = [
  {
    name: "/Power/Battery",
    level: "ok",
    message: "Discharging, 64 %",
    hardwareId: "bms-7f21",
    receivedAt: at(1),
    values: [
      { key: "Voltage", value: "51.2 V" },
      { key: "Current", value: "-8.4 A" },
      { key: "State of charge", value: "64 %" },
      { key: "Temperature", value: "31 °C" },
      { key: "Cycles", value: "412" },
    ],
  },
  { name: "/Power/Charging contacts", level: "ok", message: "Not docked", hardwareId: "dock-io", receivedAt: at(1) },
  {
    name: "/Motors/Left wheel",
    level: "error",
    message: "Overcurrent: 18.6 A, limit 15.0 A",
    hardwareId: "can0:0x21",
    receivedAt: at(1),
    values: [
      { key: "Current", value: "18.6 A" },
      { key: "Current limit", value: "15.0 A" },
      { key: "Temperature", value: "71 °C" },
      { key: "Encoder", value: "1204553 ticks" },
      { key: "Fault flags", value: "OVERCURRENT" },
      { key: "Firmware", value: "2.4.1" },
    ],
  },
  { name: "/Motors/Right wheel", level: "ok", message: "Running", hardwareId: "can0:0x22", receivedAt: at(1), values: [{ key: "Current", value: "6.1 A" }, { key: "Temperature", value: "44 °C" }] },
  { name: "/Motors/Lift", level: "warn", message: "Temperature high: 68 °C", hardwareId: "can0:0x30", receivedAt: at(2), values: [{ key: "Temperature", value: "68 °C" }, { key: "Warning above", value: "65 °C" }] },
  { name: "/Sensors/Front lidar", level: "ok", message: "Publishing at 15.0 Hz", hardwareId: "tim781-2231", receivedAt: at(1) },
  // Its last status arrived 12 s ago: stale by time, whatever level it last said.
  { name: "/Sensors/Rear lidar", level: "ok", message: "Publishing at 15.0 Hz", hardwareId: "tim781-2232", receivedAt: at(12) },
  { name: "/Sensors/IMU", level: "ok", message: "Calibrated", hardwareId: "imu0", receivedAt: at(1) },
  { name: "/Sensors/Front camera", level: "warn", message: "Frame rate 9.8 Hz, expected 15 Hz", hardwareId: "cam-front", receivedAt: at(1) },
  { name: "/Computers/Main/CPU", level: "ok", message: "Load 38 %", hardwareId: "amr07-main", receivedAt: at(1) },
  { name: "/Computers/Main/Disk", level: "warn", message: "91 % full", hardwareId: "amr07-main", receivedAt: at(3), values: [{ key: "Used", value: "218 GB" }, { key: "Size", value: "240 GB" }] },
  { name: "/Computers/Main/Network", level: "ok", message: "Wi-Fi, −58 dBm", hardwareId: "amr07-main", receivedAt: at(1) },
  { name: "/Software/Navigation", level: "ok", message: "Active", receivedAt: at(1) },
  { name: "/Software/Localization", level: "ok", message: "Covariance within bounds", receivedAt: at(1) },
  { name: "/Software/Safety controller", level: "ok", message: "Armed", hardwareId: "safety-plc", receivedAt: at(1) },
]

/**
 * An AMR with a motor in error, three warnings and a lidar gone quiet: the worst level and the counts first, then the tree
 * with the groups that hold a problem open. Power and Software are fine, so they stay closed.
 */
export const DiagnosticsDefault: S = {
  render: () => <Diagnostics label="AMR-07" statuses={amr} now={now} className="w-3xl max-w-full" />,
}

/**
 * A status opened: its whole message, hardware ID, when it arrived and its values. A plain number is grouped in the
 * locale ("1,204,553 ticks"); a version, an ID or a flag is shown as the robot sent it.
 */
export const DiagnosticsDetails: S = {
  render: () => <Diagnostics label="AMR-07" statuses={amr} now={now} locale="en" defaultExpanded={["/Motors/Left wheel"]} className="w-3xl max-w-full" />,
}

/** Problems only: what is not OK, under the groups that hold it. */
export const DiagnosticsProblems: S = {
  render: () => <Diagnostics label="AMR-07" statuses={amr} now={now} defaultFilter="problems" className="w-3xl max-w-full" />,
}

/** Search by name or hardware ID: the matches, with the groups above them. */
export const DiagnosticsSearch: S = {
  render: () => <Diagnostics label="AMR-07" statuses={amr} now={now} defaultQuery="lidar" className="w-3xl max-w-full" />,
}

const healthy: DiagnosticStatus[] = amr.map((s) => ({ ...s, level: "ok", receivedAt: at(1) }))

/** Everything OK: the summary says so in grey, and every group starts closed. */
export const DiagnosticsAllOk: S = {
  render: () => <Diagnostics label="AMR-07" statuses={healthy} now={now} className="w-3xl max-w-full" />,
}

/** The robot stopped publishing 40 s ago: every status reads Stale, with how long ago it arrived. */
export const DiagnosticsStale: S = {
  render: () => <Diagnostics label="AMR-07" statuses={amr.map((s) => ({ ...s, receivedAt: at(40) }))} now={now} className="w-3xl max-w-full" />,
}

// Straight from /diagnostics, before an aggregator: each node names its own statuses, with no "/" hierarchy.
const raw: DiagnosticStatus[] = [
  { name: "motor_driver: Left wheel", level: "error", message: "Overcurrent", hardwareId: "can0:0x21", receivedAt: at(1) },
  { name: "motor_driver: Right wheel", level: "ok", message: "Running", hardwareId: "can0:0x22", receivedAt: at(1) },
  { name: "sick_tim: Front lidar", level: "ok", message: "Publishing at 15.0 Hz", receivedAt: at(1) },
  { name: "battery_node: Battery", level: "warn", message: "Below 20 %", hardwareId: "bms-7f21", receivedAt: at(2) },
]

/** Raw /diagnostics, without the aggregator: a flat list, in the same language. */
export const DiagnosticsFlat: S = {
  render: () => <Diagnostics label="AMR-07" statuses={raw} now={now} className="w-3xl max-w-full" />,
}

/** Waiting for the first diagnostics. */
export const DiagnosticsLoading: S = {
  render: () => <Diagnostics label="AMR-07" statuses={[]} loading className="w-3xl max-w-full" />,
}

/** Connected, but nothing published yet. */
export const DiagnosticsEmpty: S = {
  render: () => <Diagnostics label="AMR-07" statuses={[]} className="w-3xl max-w-full" />,
}
