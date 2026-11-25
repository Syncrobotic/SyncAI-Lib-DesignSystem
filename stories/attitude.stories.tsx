import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { imuToAttitude, odometryToSpeed, stampToMs, type RosHeader, type RosImu, type RosOdometry } from "@/registry/syncrobotic/lib/ros"
import { attitudeIndicatorLabels, gaugeLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { AttitudeIndicator, Gauge, type AttitudeHandle, type AttitudeLimits, type GaugeHandle } from "@/registry/syncrobotic/ui/attitude"
import { useLiveStamp } from "./live-stamp"

const meta: Meta = { title: "Display/Attitude" }
export default meta
type S = StoryObj

/*
  Every story but the two live ones draws fixed values, so a screenshot is the same on every machine. The live ones move
  only for a person: under a test (navigator.webdriver) or reduced motion they hold the first reading.
  An instrument goes stale when nothing new arrives (1 s for the attitude, 3 s for a gauge, by default), so a fixed
  reading is re-stamped every 200 ms (`updatedAt={stamp}`), as a robot standing still keeps publishing.
*/
const EPOCH = new Date(2026, 10, 21, 14, 2, 0).getTime()
const animate = () =>
  typeof window !== "undefined" && navigator.webdriver !== true && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches !== true

// A patrol dog's limits: it warns at 25° of roll (tip-over margin) and is critical from 35°; pitch at 20° and 30°.
const dogLimits: AttitudeLimits = { roll: { warning: 25, critical: 35 }, pitch: { warning: 20, critical: 30 } }

/** Level enough: 12° to the left, nose 3° down, heading west. Every value is written beside the drawing. */
export const AttitudeDefault: StoryObj<{ roll: number; pitch: number; heading: number; size: "md" | "lg" }> = {
  // Args, so any pose can be opened from the URL (…&args=roll:-27;pitch:15;size:lg) to check the drawing at it.
  args: { roll: -12, pitch: 3, heading: 271, size: "md" },
  render: function Render({ roll, pitch, heading, size }) {
    const stamp = useLiveStamp()
    return (
      <AttitudeIndicator
        label="Attitude, Patrol dog 7F3A"
        roll={Number(roll)}
        pitch={Number(pitch)}
        heading={Number(heading)}
        updatedAt={stamp}
        size={size}
        limits={dogLimits}
      />
    )
  },
}

/** Past the 25° roll warning: the value, the bank pointer, the robot's symbol and the limit's triangle turn warning, and say so. */
export const AttitudeOverLimit: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return <AttitudeIndicator updatedAt={stamp} label="Attitude, Patrol dog 7F3A" roll={27} pitch={-4} heading={88} limits={dogLimits} />
  },
}

/** Past the 35° critical roll: danger, with the octagon and the word. Pitch stays calm: only the axis past its limit is coloured. */
export const AttitudeCritical: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return <AttitudeIndicator updatedAt={stamp} label="Attitude, Patrol dog 7F3A" roll={-38} pitch={12} heading={164} limits={dogLimits} />
  },
}

/** Climbing a ramp nose up, past the pitch warning: the dashed limit line on the ladder and its triangle turn warning. */
export const AttitudePitchWarning: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return <AttitudeIndicator updatedAt={stamp} label="Attitude, Patrol dog 7F3A" roll={2} pitch={-22} heading={12} limits={dogLimits} />
  },
}

/** An IMU without a magnetometer has no heading: no compass on the ring and no Heading row. */
export const AttitudeNoCompass: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return <AttitudeIndicator updatedAt={stamp} label="Attitude, AMR-07" roll={4} pitch={-2} limits={{ roll: { warning: 10, critical: 15 } }} />
  },
}

/** The large size, for a robot's own page. */
export const AttitudeLarge: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return <AttitudeIndicator updatedAt={stamp} label="Attitude, Patrol dog 7F3A" roll={-12} pitch={3} heading={271} limits={dogLimits} size="lg" />
  },
}

// One reading at 14:02:00 and then silence.
const subscribeSilent = (push: AttitudeHandle["push"]) => {
  push({ roll: 6, pitch: -3, heading: 302 }, EPOCH)
}

/** No reading for `staleAfterMs`: the drawing dims, the values grey, and it says Stale with the last update's time. */
export const AttitudeStale: S = {
  // 500 ms so the story reaches Stale within the screenshot's second; keep about three missed readings in an app.
  render: () => <AttitudeIndicator label="Attitude, Patrol dog 7F3A" subscribe={subscribeSilent} staleAfterMs={500} limits={dogLimits} />,
}

/** Connected, nothing has arrived yet. */
export const AttitudeWaiting: S = {
  render: () => <AttitudeIndicator label="Attitude, Patrol dog 7F3A" limits={dogLimits} />,
}

/** The same message again every 200 ms with a new header stamp, as a robot re-publishes a reading that has not changed. */
function useRepublished<M extends { header?: RosHeader }>(msg: M): M {
  const stamp = useLiveStamp()
  return { ...msg, header: { ...msg.header, stamp: { sec: Math.floor(stamp / 1000), nanosec: (stamp % 1000) * 1e6 } } }
}

// A sensor_msgs/Imu as rosbridge sends it: the orientation in ENU, 9° of roll to the right and 4° nose up, facing NE.
const imu: RosImu = {
  header: { stamp: { sec: EPOCH / 1000, nanosec: 0 }, frame_id: "imu_link" },
  orientation: { x: 0.0858, y: -0.0021, z: 0.3838, w: 0.9194 },
  orientation_covariance: [0.0025, 0, 0, 0, 0.0025, 0, 0, 0, 0.0025],
}

/** From ROS: `imuToAttitude(msg)` turns a sensor_msgs/Imu into roll, pitch and a compass heading (REP 103 and 145). */
export const AttitudeFromIMU: S = {
  render: function Render() {
    const msg = useRepublished(imu)
    const a = imuToAttitude(msg)
    return (
      <AttitudeIndicator
        label="Attitude, AMR-07"
        roll={a.roll}
        pitch={a.pitch}
        heading={a.heading}
        updatedAt={stampToMs(msg.header?.stamp)}
        limits={dogLimits}
      />
    )
  },
}

/** Traditional Chinese: `attitudeIndicatorLabels` from labels-zh-tw, with `locale`. */
export const AttitudeZhTw: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return (
      <AttitudeIndicator label="姿態，巡檢犬 7F3A" roll={27} pitch={3} heading={271} updatedAt={stamp} limits={dogLimits} labels={attitudeIndicatorLabels} locale="zh-TW" />
    )
  },
}

/**
 * Live at 50 Hz through the ref's `push`: a robot walking over rough ground and leaning into a turn. The drawing follows
 * every frame and the numbers are written four times a second; nothing renders React per reading.
 */
export const AttitudeLive: S = {
  render: function Render() {
    const ref = React.useRef<AttitudeHandle>(null)
    // Under a test it holds its first reading, so it never goes stale on the page clock either.
    const [live] = React.useState(animate)
    React.useEffect(() => {
      const at = (t: number) => ({
        roll: 14 * Math.sin((t + 4) / 3.1) + 2.5 * Math.sin(t * 4.3) + 13 * Math.exp(-(((t % 24) - 18) ** 2) / 2),
        pitch: 5 * Math.sin(t / 2.3) + 1.5 * Math.sin(t * 5.1),
        heading: (271 + 40 * Math.sin(t / 7)) % 360,
      })
      ref.current?.push(at(0), EPOCH)
      if (!live) return
      const start = performance.now()
      const id = setInterval(() => ref.current?.push(at((performance.now() - start) / 1000)), 20)
      return () => clearInterval(id)
    }, [live])
    return <AttitudeIndicator ref={ref} label="Attitude, Patrol dog 7F3A" limits={dogLimits} staleAfterMs={live ? 1000 : null} />
  },
}

// ---------- Gauge ----------

/** Three sizes: sm 96 px for a tile or a table row, md 144 px (the default), lg 192 px for the one value a screen is about. */
export const AttitudeGaugeSizes: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return (
      <div className="flex flex-wrap items-end gap-6">
        <Gauge updatedAt={stamp} size="sm" label="Speed" value={1.2} max={2} unit="m/s" digits={2} low={1.5} critical={1.8} higherIsWorse />
        <Gauge updatedAt={stamp} size="md" label="Left motor" value={54.3} min={20} max={90} unit="°C" low={70} critical={80} higherIsWorse />
        <Gauge updatedAt={stamp} size="lg" label="Right wheel current" value={8.4} max={20} unit="A" low={14} critical={16} higherIsWorse />
      </div>
    )
  },
}

/**
 * Meter's thresholds and words: graphite while normal; past `low` (here 70 °C, higher is worse) warning with "High"; past
 * `critical` danger with "Critical". The marks on the arc are the kit's triangle and square.
 */
export const AttitudeGaugeThresholds: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return (
      <div className="flex flex-wrap items-end gap-6">
        <Gauge updatedAt={stamp} label="Left motor" value={54.3} min={20} max={90} unit="°C" low={70} critical={80} higherIsWorse />
        <Gauge updatedAt={stamp} label="Right motor" value={73.8} min={20} max={90} unit="°C" low={70} critical={80} higherIsWorse />
        <Gauge updatedAt={stamp} label="Lift motor" value={84.1} min={20} max={90} unit="°C" low={70} critical={80} higherIsWorse />
      </div>
    )
  },
}

/** A level that runs out is worse low: a pack's voltage under its 46 V warning reads "Low". */
export const AttitudeGaugeLow: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return <Gauge updatedAt={stamp} label="Pack voltage" value={45.2} min={42} max={54} unit="V" low={46} critical={44} />
  },
}

// nav_msgs/Odometry from /odom: a holonomic base moving forward and a little to the left.
const odom: RosOdometry = {
  header: { stamp: { sec: EPOCH / 1000, nanosec: 0 }, frame_id: "odom" },
  child_frame_id: "base_link",
  pose: { pose: { position: { x: 12.1, y: 3.4, z: 0 }, orientation: { x: 0, y: 0, z: 0.38, w: 0.92 } } },
  twist: { twist: { linear: { x: 1.14, y: 0.21, z: 0 }, angular: { x: 0, y: 0, z: 0.05 } } },
}

/** From ROS: `odometryToSpeed(msg)` turns nav_msgs/Odometry's twist into a speed in m/s. */
export const AttitudeGaugeFromOdometry: S = {
  render: function Render() {
    const msg = useRepublished(odom)
    return <Gauge label="Speed" value={odometryToSpeed(msg)} updatedAt={stampToMs(msg.header?.stamp)} max={2} unit="m/s" digits={2} low={1.5} critical={1.8} higherIsWorse />
  },
}

const subscribeSilentSpeed = (push: GaugeHandle["push"]) => {
  push(0.82, EPOCH)
}

/** Stale: the arc dims, the number greys, and the time of the last update is written under it. */
export const AttitudeGaugeStale: S = {
  render: () => <Gauge label="Speed" subscribe={subscribeSilentSpeed} staleAfterMs={500} max={2} unit="m/s" digits={2} low={1.5} critical={1.8} higherIsWorse />,
}

/** Traditional Chinese: `gaugeLabels` from labels-zh-tw. */
export const AttitudeGaugeZhTw: S = {
  render: function Render() {
    const stamp = useLiveStamp()
    return <Gauge updatedAt={stamp} label="左馬達溫度" value={73.8} min={20} max={90} unit="°C" low={70} critical={80} higherIsWorse labels={gaugeLabels} locale="zh-TW" />
  },
}

/** Live at 20 Hz through `push`: a robot's speed on patrol, crossing its 1.5 m/s warning on the long straight. */
export const AttitudeGaugeLive: S = {
  render: function Render() {
    const ref = React.useRef<GaugeHandle>(null)
    const [live] = React.useState(animate)
    React.useEffect(() => {
      const at = (t: number) => Math.max(0, 1.05 + 0.6 * Math.sin(t / 2.7) + 0.04 * Math.sin(t * 7.3))
      ref.current?.push(at(0), EPOCH)
      if (!live) return
      const start = performance.now()
      const id = setInterval(() => ref.current?.push(at((performance.now() - start) / 1000)), 50)
      return () => clearInterval(id)
    }, [live])
    return <Gauge ref={ref} label="Speed" max={2} unit="m/s" digits={2} low={1.5} critical={1.8} higherIsWorse staleAfterMs={live ? 1000 : null} />
  },
}
