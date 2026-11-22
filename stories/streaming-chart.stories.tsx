import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { createRosConnection, stampToMs, type RosConnection, type RosJointState } from "@/registry/syncrobotic/lib/ros"
import { StreamingChart, type StreamingChartConfig, type StreamingChartPush, type StreamingChartSample } from "@/registry/syncrobotic/ui/streaming-chart"
import { createMockRosbridge } from "./ros-mock"

const meta: Meta = { title: "Charts/Streaming chart" }
export default meta
type S = StoryObj

/*
  Telemetry played in the browser. Every reading is a function of its index and is stamped on a fixed clock (14:02:00 on
  21 November 2026, plus 20 ms a reading), so a story draws the same picture on every machine: the chart's time axis
  follows the readings' own clock, and the screenshot run's paused page clock decides how many have arrived. The stream
  catches up to the page's clock on each timer tick, so it keeps its rate even when timers run late.
*/
const EPOCH = new Date(2026, 10, 21, 14, 2, 0).getTime()

/** A repeatable noise in −1…1 for reading i. */
const noise = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

/** Plays `make(i)` at `hz`, after `historyS` seconds of history; returns the function that stops it. */
function play(push: StreamingChartPush, make: (i: number) => StreamingChartSample, hz: number, historyS: number, live = true) {
  const dt = 1000 / hz
  let i = -Math.round(historyS * hz)
  const tick = (upTo: number) => {
    for (; i <= upTo; i++) push(make(i), EPOCH + i * dt)
  }
  tick(0)
  if (!live) return () => {}
  const started = performance.now()
  const id = setInterval(() => tick(Math.floor((performance.now() - started) / dt)), 20)
  return () => clearInterval(id)
}

// A patrol robot's two drive motors and its lift, at 50 Hz: the left wheel works harder on each turn.
const motors = {
  left: { label: "Left wheel", color: 1, unit: "A" },
  right: { label: "Right wheel", color: 2, unit: "A" },
  lift: { label: "Lift", color: 3, unit: "A" },
} satisfies StreamingChartConfig
const motorReading = (i: number) => {
  const t = i / 50
  const turn = 5.5 * Math.exp(-(((t % 40) - 30) ** 2) / 3)
  return {
    left: 8 + 2.4 * Math.sin(t * 0.9) + 0.9 * Math.sin(t * 4.1) + 0.12 * noise(i) + turn,
    right: 6.5 + 2 * Math.sin(t * 0.9 + 0.6) + 0.8 * Math.sin(t * 3.3) + 0.12 * noise(i + 7919),
    lift: 2.2 + 2.4 * Math.max(0, Math.sin(t * 0.35)) + 0.08 * noise(i + 104729),
  }
}
// Module-level, so the chart connects once: a new function each render would reconnect each render.
const subscribeMotors = (push: StreamingChartPush) => play(push, motorReading, 50, 600)
const motorLimits = [{ value: 16, label: "Limit 16 A" }]

/** Three motor currents at 50 Hz in one unit, with their limit. The legend writes each value now; hover for the crosshair. */
export const StreamingChartDefault: S = {
  render: () => (
    <StreamingChart
      config={motors}
      label="Drive and lift motor currents, Patrol dog 7F3A"
      subscribe={subscribeMotors}
      limits={motorLimits}
      domain={[0, 20]}
      className="w-full"
    />
  ),
}

/** Paused: the view is frozen at 14:02:00 while readings keep arriving into the buffer. ← and → move it back and forth. */
export const StreamingChartPaused: S = {
  render: () => (
    <StreamingChart
      config={motors}
      label="Drive and lift motor currents, Patrol dog 7F3A"
      subscribe={subscribeMotors}
      limits={motorLimits}
      domain={[0, 20]}
      defaultPaused
      className="w-full"
    />
  ),
}

const speed = { speed: { label: "Speed", color: 1, unit: "m/s", digits: 2 } } satisfies StreamingChartConfig
const temperature = { motor: { label: "Motor", color: 1, unit: "°C" } } satisfies StreamingChartConfig
const battery = { pack: { label: "Pack", color: 1, unit: "V", digits: 2 } } satisfies StreamingChartConfig
const subscribeSpeed = (push: StreamingChartPush) =>
  play(push, (i) => ({ speed: Math.max(0, 1.1 + 0.45 * Math.sin(i / 50 / 3) + 0.05 * noise(i)) }), 20, 600)
const subscribeTemperature = (push: StreamingChartPush) =>
  play(push, (i) => ({ motor: 54 + 3.2 * Math.sin(i / 20 / 9) + 0.25 * noise(i + 31) }), 20, 600)
const subscribeBattery = (push: StreamingChartPush) =>
  play(push, (i) => ({ pack: 47.6 - 0.00004 * (i + 12000) + 0.08 * noise(i + 17) }), 20, 600)

/**
 * Speed, temperature and battery voltage are three units, so three charts: one y axis each, one set of controls on the
 * first driving the window and the pause of all three. The temperature shows a derating band below its limit; the battery
 * limit is a floor (`over: "below"`).
 */
export const StreamingChartSmallMultiples: S = {
  render: function Render() {
    const [span, setSpan] = React.useState(30_000)
    const [paused, setPaused] = React.useState(false)
    return (
      <div className="flex w-full flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Speed</h3>
          <StreamingChart
            config={speed}
            label="Speed, Patrol dog 7F3A"
            subscribe={subscribeSpeed}
            domain={[0, 2]}
            window={span}
            onWindowChange={setSpan}
            paused={paused}
            onPausedChange={setPaused}
            plotClassName="h-40"
          />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Motor temperature</h3>
          <StreamingChart
            config={temperature}
            label="Drive motor temperature, Patrol dog 7F3A"
            subscribe={subscribeTemperature}
            domain={[40, 65]}
            limits={[{ value: 60, label: "Limit 60 °C" }]}
            band={{ from: 55, to: 60, label: "Derating" }}
            window={span}
            paused={paused}
            controls={false}
            plotClassName="h-40"
          />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Battery voltage</h3>
          <StreamingChart
            config={battery}
            label="Battery pack voltage, Patrol dog 7F3A"
            subscribe={subscribeBattery}
            domain={[44, 50]}
            limits={[{ value: 45, label: "Floor 45 V", over: "below" }]}
            window={span}
            paused={paused}
            controls={false}
            plotClassName="h-40"
          />
        </section>
      </div>
    )
  },
}

// A robot that sent ten minutes of readings and then went quiet.
const subscribeSilent = (push: StreamingChartPush) => play(push, motorReading, 50, 600, false)

/** No reading for `staleAfterMs`: the chart says so in words with the time of the last reading, and the line stops there. */
export const StreamingChartStale: S = {
  render: () => (
    // 500 ms so the story reaches Stale within the screenshot's second; keep about three missed readings in an app.
    <StreamingChart config={motors} label="Drive and lift motor currents, Patrol dog 7F3A" subscribe={subscribeSilent} limits={motorLimits} domain={[0, 20]} staleAfterMs={500} className="w-full" />
  ),
}

/** Connected, nothing has arrived yet. */
export const StreamingChartWaiting: S = {
  render: () => <StreamingChart config={motors} label="Drive and lift motor currents, Patrol dog 7F3A" domain={[0, 20]} className="w-full" />,
}

const arm = {
  shoulder: { label: "Shoulder lift", color: 1, unit: "°" },
  elbow: { label: "Elbow", color: 2, unit: "°" },
  wrist: { label: "Wrist 1", color: 3, unit: "°" },
} satisfies StreamingChartConfig
const deg = (rad: number | null | undefined) => (rad == null ? null : (rad * 180) / Math.PI)

/**
 * Wired to ROS: /joint_states (sensor_msgs/JointState, 10 Hz) from a rosbridge played in the browser, pushed straight into
 * the chart with the message's stamp. `ros.subscribe` returns its own unsubscribe, which is what `subscribe` asks for.
 */
export const StreamingChartFromROS: S = {
  render: function Render() {
    const [ros] = React.useState<RosConnection>(() => {
      // The screenshot run (and anyone who asked for reduced motion) gets an arm that holds still.
      const still = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const bridge = createMockRosbridge({ still, connectDelayMs: still ? 0 : 400 })
      return createRosConnection({ url: "ws://robot.local:9090", WebSocket: bridge.WebSocket })
    })
    React.useEffect(() => {
      ros.connect()
      return () => ros.close()
    }, [ros])
    const subscribe = React.useCallback(
      (push: StreamingChartPush) =>
        ros.subscribe<RosJointState>("/joint_states", "sensor_msgs/JointState", (m) => {
          const at = (name: string) => m.position[m.name.indexOf(name)]
          push({ shoulder: deg(at("shoulder_lift_joint")), elbow: deg(at("elbow_joint")), wrist: deg(at("wrist_1_joint")) }, stampToMs(m.header?.stamp))
        }),
      [ros],
    )
    return <StreamingChart config={arm} label="Arm joint positions, AMR-07" subscribe={subscribe} domain={[-150, 120]} className="w-full" />
  },
}
