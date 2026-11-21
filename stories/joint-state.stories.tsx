import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { JointState, type JointStateJoint } from "@/registry/syncrobotic/ui/joint-state"

const meta: Meta = { title: "Display/Joint state" }
export default meta
type S = StoryObj

const deg = (d: number) => (d * Math.PI) / 180

// A UR10e-like 6-DOF arm: limits are ±360° on most joints and ±180° on the elbow, effort limits from its datasheet.
const arm: JointStateJoint[] = [
  { name: "shoulder_pan_joint", position: deg(42), lower: deg(-360), upper: deg(360), velocity: deg(12.5), effort: 41.2, effortLimit: 330 },
  { name: "shoulder_lift_joint", position: deg(-87.3), lower: deg(-360), upper: deg(360), velocity: deg(-4), effort: 152.6, effortLimit: 330 },
  { name: "elbow_joint", position: deg(91.4), lower: deg(-180), upper: deg(180), velocity: deg(3.2), effort: 63.8, effortLimit: 150 },
  { name: "wrist_1_joint", position: deg(-94.1), lower: deg(-360), upper: deg(360), velocity: 0, effort: 9.1, effortLimit: 56 },
  { name: "wrist_2_joint", position: deg(-90), lower: deg(-360), upper: deg(360), velocity: 0, effort: 3.4, effortLimit: 56 },
  { name: "wrist_3_joint", position: deg(0.4), lower: deg(-360), upper: deg(360), velocity: deg(30), effort: 0.8, effortLimit: 56 },
]

/**
 * Publishes the same joint state again every 200 ms, as a robot does, so the panel stays live (not stale) in the docs.
 * The values never change, so every screenshot is the same.
 */
function useLive(joints: JointStateJoint[]) {
  const [live, setLive] = React.useState(joints)
  React.useEffect(() => {
    const id = setInterval(() => setLive([...joints]), 200)
    return () => clearInterval(id)
  }, [joints])
  return live
}

/** A 6-DOF arm in a normal pose: every joint well inside its limits, so nothing is coloured. */
export const JointStateDefault: S = {
  render: function Render() {
    const joints = useLive(arm)
    return <JointState label="Arm 2 · UR10e" joints={joints} className="w-3xl max-w-full" />
  },
}

const nearLimit: JointStateJoint[] = arm.map((j) =>
  j.name === "elbow_joint" ? { ...j, position: deg(168.5), velocity: deg(6) } : j.name === "wrist_3_joint" ? { ...j, position: deg(-349) } : j,
)

/** The elbow and the last wrist joint inside the 5 % margin: each says which limit, in words, beside a warning triangle. */
export const JointStateNearLimit: S = {
  render: function Render() {
    const joints = useLive(nearLimit)
    return <JointState label="Arm 2 · UR10e" joints={joints} className="w-3xl max-w-full" />
  },
}

const atLimit: JointStateJoint[] = arm.map((j) =>
  j.name === "elbow_joint"
    ? { ...j, position: deg(180), velocity: 0, effort: 141, effortLimit: 150 }
    : j.name === "shoulder_lift_joint"
      ? { ...j, position: deg(-362.5), velocity: 0 }
      : j,
)

/** On a limit and past one: the danger octagon and the words; the marker stays pinned to the end it reached. */
export const JointStateAtLimit: S = {
  render: function Render() {
    const joints = useLive(atLimit)
    return <JointState label="Arm 2 · UR10e" joints={joints} className="w-3xl max-w-full" />
  },
}

// A gantry: a linear axis and a lift (prismatic, metres), a rotating wrist (revolute) and a gripper finger, plus a
// continuous joint (no limits) for the tool spindle.
const gantry: JointStateJoint[] = [
  { name: "rail_x", unit: "m", position: 1.2405, lower: 0, upper: 3.2, velocity: 0.25, effort: 120, effortLimit: 800 },
  { name: "lift_z", unit: "m", position: 0.3125, lower: 0, upper: 0.9, velocity: -0.02, effort: 310, effortLimit: 1200 },
  { name: "wrist_yaw", position: deg(-35), lower: deg(-170), upper: deg(170), velocity: 0, effort: 2.4, effortLimit: 28 },
  { name: "gripper_finger", unit: "m", position: 0.0398, lower: 0, upper: 0.04, velocity: 0, effort: 38 },
  { name: "tool_spindle", position: deg(1250), velocity: deg(720) },
]

/** Prismatic axes in millimetres beside revolute joints in degrees; a continuous joint has no track; raw effort without a limit. */
export const JointStateMixed: S = {
  render: function Render() {
    const joints = useLive(gantry)
    return <JointState label="Gantry 1" joints={joints} className="w-3xl max-w-full" />
  },
}

/** Updates stopped: the panel says Stale with the last update's time, and the values are dimmed. Never a silent freeze. */
export const JointStateStale: S = {
  render: () => (
    // The robot's stamp never moves, so after a second the panel is stale, and it reads 14:02:31 in any time zone.
    <JointState label="Arm 2 · UR10e" joints={arm} updatedAt={new Date(2026, 10, 21, 14, 2, 31).getTime()} className="w-3xl max-w-full" />
  ),
}

/** Waiting for the first joint state: the line says what for, and the skeleton keeps six rows' height. */
export const JointStateLoading: S = {
  render: () => <JointState label="Arm 2 · UR10e" joints={[]} loading className="w-3xl max-w-full" />,
}

/** Connected, but the robot has published no joint state yet. */
export const JointStateEmpty: S = {
  render: () => <JointState label="Arm 2 · UR10e" joints={[]} className="w-3xl max-w-full" />,
}
