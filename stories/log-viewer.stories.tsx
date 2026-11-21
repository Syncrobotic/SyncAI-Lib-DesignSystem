import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { logViewerLabels, locale as zhTW } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { LogViewer, type LogLevel, type LogLine, type LogViewerHandle } from "@/registry/syncrobotic/ui/log-viewer"

const meta: Meta = { title: "Display/Log viewer" }
export default meta
type S = StoryObj

// A patrol robot's /rosout, made up but shaped as ROS 2 writes it: node names, levels, the file and line each came from.
// A seeded generator makes every load (and every screenshot) the same log; times are fixed and shown in UTC, so the page
// reads the same on any machine and in any time zone.
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const start = Date.UTC(2026, 10, 21, 14, 2, 0)
type Template = { source: string; level: LogLevel; file: string; fn: string; line: number; text: (r: () => number) => string; weight: number }
const templates: Template[] = [
  { source: "/controller_server", level: "debug", file: "controller_server.cpp", fn: "computeControl", line: 412, weight: 6, text: (r) => `Passing new path to controller, ${Math.round(40 + r() * 80)} poses` },
  { source: "/amcl", level: "debug", file: "amcl_node.cpp", fn: "laserReceived", line: 788, weight: 5, text: (r) => `Pose update: x ${(r() * 40).toFixed(2)} y ${(r() * 12).toFixed(2)} yaw ${(r() * 3.14).toFixed(3)}` },
  { source: "/bt_navigator", level: "info", file: "bt_navigator.cpp", fn: "onGoalPoseReceived", line: 233, weight: 3, text: (r) => `Begin navigating from current location to waypoint ${Math.ceil(r() * 6)} of 6` },
  { source: "/planner_server", level: "info", file: "planner_server.cpp", fn: "computePlan", line: 380, weight: 3, text: (r) => `Planned path in ${(8 + r() * 30).toFixed(1)} ms, ${(5 + r() * 40).toFixed(1)} m` },
  { source: "/battery_monitor", level: "info", file: "battery_monitor.py", fn: "on_state", line: 58, weight: 2, text: (r) => `Battery ${Math.round(62 - r() * 4)} %, ${(47.8 + r()).toFixed(2)} V, discharging` },
  { source: "/lidar_driver", level: "warn", file: "driver.cpp", fn: "poll", line: 156, weight: 1, text: (r) => `Dropped ${Math.ceil(r() * 4)} packets; scan rate ${(9.2 + r() * 0.6).toFixed(1)} Hz below 10 Hz` },
  { source: "/controller_server", level: "warn", file: "controller_server.cpp", fn: "isGoalReached", line: 519, weight: 1, text: () => "Control loop missed its desired rate of 20.0 Hz" },
  { source: "/camera/front", level: "info", file: "camera_node.cpp", fn: "publishImage", line: 97, weight: 1, text: (r) => `Exposure ${Math.round(8 + r() * 12)} ms, gain ${(1 + r() * 3).toFixed(1)} dB` },
]
const pickers = templates.flatMap((t) => Array.from({ length: t.weight }, () => t))

// The errors that make this log worth reading: a planner that cannot reach a goal, a costmap that timed out.
const incidents: Omit<LogLine, "time">[] = [
  {
    id: "plan-failed",
    level: "error",
    source: "/planner_server",
    message: "Failed to create a plan from (12.40, 3.05) to (18.20, 7.75): goal is inside an obstacle\n  costmap: global_costmap\n  tolerance: 0.25 m\n  attempts: 3",
    file: "planner_server.cpp",
    function: "computePlanThroughPoses",
    line: 466,
    fields: { robot: "Patrol dog 7F3A", goal_id: "8c2e…41b0" },
  },
  {
    id: "costmap-timeout",
    level: "warn",
    source: "/global_costmap",
    message: "Costmap update timed out: transform from base_link to map is 0.42 s old (timeout 0.30 s)",
    file: "costmap_2d_ros.cpp",
    function: "updateMap",
    line: 579,
  },
  {
    id: "recovery",
    level: "error",
    source: "/bt_navigator",
    message: "Navigation failed: recovery behaviours (clear costmaps, spin, back up) did not free the robot",
    file: "navigate_to_pose.cpp",
    function: "onCompletion",
    line: 188,
  },
]

function makeLog(count: number, seed = 3): LogLine[] {
  const r = seeded(seed)
  const out: LogLine[] = []
  let t = start
  for (let i = 0; i < count; i++) {
    t += Math.round(40 + r() * 260)
    // The incidents fall near the end, where the log opens.
    const incident = count >= 60 ? incidents[[count - 31, count - 18, count - 6].indexOf(i)] : undefined
    if (incident) {
      out.push({ ...incident, time: t })
      continue
    }
    const p = pickers[Math.floor(r() * pickers.length)]!
    out.push({ id: i, time: t, level: p.level, source: p.source, message: p.text(r), file: p.file, function: p.fn, line: p.line })
  }
  return out
}

const log = makeLog(240)

/** A robot's /rosout, following the newest line. Scroll up and it pauses; "Jump to latest" brings it back. */
export const LogViewerRosout: S = {
  render: () => <LogViewer lines={log} timeZone="UTC" labels={{ sources: "Nodes", allSources: "All nodes", sourceCount: (n) => `${n} nodes` }} />,
}

/** Searching: every match is marked; Enter or ↓ goes to the next one, Shift+Enter or ↑ to the previous. */
export const LogViewerSearch: S = {
  render: () => <LogViewer lines={log} timeZone="UTC" defaultQuery="scan rate" />,
}

/** A line opened: the whole message, its node, where it was written and the fields it carries, with Copy line. */
export const LogViewerExpanded: S = {
  render: () => <LogViewer lines={log} timeZone="UTC" defaultExpanded={["plan-failed"]} defaultLevels={["warn", "error", "fatal"]} />,
}

/** Only warnings and worse, from two nodes. */
export const LogViewerFiltered: S = {
  render: () => <LogViewer lines={log} timeZone="UTC" defaultLevels={["warn", "error", "fatal"]} defaultSources={["/planner_server", "/bt_navigator"]} />,
}

/** Long lines wrapped, and time shown as time ago. */
export const LogViewerWrappedRelative: S = {
  render: () => <LogViewer lines={log} timeZone="UTC" defaultWrap defaultTimeMode="relative" now={log.at(-1)!.time + 4_000} />,
}

/** 100,000 lines: only the lines in view are drawn, so it scrolls as smoothly as 100. */
export const LogViewerHundredThousand: S = {
  render: function Render() {
    const [lines] = React.useState(() => makeLog(100_000, 11))
    return <LogViewer lines={lines} maxLines={100_000} timeZone="UTC" />
  },
}

/**
 * A live stream through the imperative handle, about 100 lines a second, kept to the last 2,000. Appends never go
 * through React state; the viewer draws ten times a second. In the screenshot run (reduced motion) it holds still.
 */
export const LogViewerLive: S = {
  render: function Render() {
    const viewer = React.useRef<LogViewerHandle>(null)
    const still = React.useSyncExternalStore(subscribeMotion, reduced, () => true)
    React.useEffect(() => {
      if (still) return
      const r = seeded(29)
      let t = log.at(-1)!.time
      const id = window.setInterval(() => {
        const batch: LogLine[] = []
        for (let i = 0; i < 10; i++) {
          const p = pickers[Math.floor(r() * pickers.length)]!
          t += 10
          batch.push({ time: t, level: p.level, source: p.source, message: p.text(r), file: p.file, function: p.fn, line: p.line })
        }
        viewer.current?.append(batch)
      }, 100)
      return () => window.clearInterval(id)
    }, [still])
    return <LogViewer ref={viewer} lines={log} maxLines={2_000} timeZone="UTC" />
  },
}

/** Before the first line arrives. */
export const LogViewerEmpty: S = {
  render: () => <LogViewer lines={[]} height={240} />,
}

/** In Traditional Chinese, from the zh-TW label pack. */
export const LogViewerZhTw: S = {
  render: () => <LogViewer lines={log} timeZone="UTC" locale={zhTW} labels={logViewerLabels} defaultLevels={["info", "warn", "error", "fatal"]} />,
}

function subscribeMotion(onChange: () => void) {
  const q = typeof window === "undefined" ? undefined : window.matchMedia?.("(prefers-reduced-motion: reduce)")
  q?.addEventListener?.("change", onChange)
  return () => q?.removeEventListener?.("change", onChange)
}
const reduced = () => typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true || navigator.webdriver === true
