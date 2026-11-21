import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"
import { RobotModel } from "@/registry/syncrobotic/ui/robot-model"
import { demoArmPose, demoArmUrdf } from "./robot-model-arm"

const meta: Meta = { title: "Display/Robot model" }
export default meta
type S = StoryObj

// Every story draws the same six-joint arm, made of primitives (stories/robot-model-arm.ts), so nothing is fetched.

/** The arm's pose from its last JointState, seen from the front right. Drag to turn it, right-drag to move, wheel to zoom once focused. */
export const RobotModelDefault: S = {
  render: () => <RobotModel urdf={demoArmUrdf} joints={demoArmPose} />,
}

const reduced = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const subscribeMotion = (onChange: () => void) => {
  const q = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
  q?.addEventListener?.("change", onChange)
  return () => q?.removeEventListener?.("change", onChange)
}

/**
 * Joint values streaming in at 20 Hz, as /joint_states would: the view draws a frame for each message and none in
 * between. Under reduced motion (and in the screenshot run) the stream pauses on one pose.
 */
export const RobotModelAnimated: S = {
  render: function Render() {
    const still = React.useSyncExternalStore(subscribeMotion, reduced, () => true)
    const [t, setT] = React.useState(0)
    React.useEffect(() => {
      if (still) return
      const start = performance.now()
      const id = setInterval(() => setT((performance.now() - start) / 1000), 50)
      return () => clearInterval(id)
    }, [still])
    const joints = {
      shoulder_pan: demoArmPose.shoulder_pan! + 0.9 * Math.sin(t * 0.6),
      shoulder_lift: demoArmPose.shoulder_lift! + 0.25 * Math.sin(t * 0.9),
      elbow: demoArmPose.elbow! + 0.35 * Math.sin(t * 0.8 + 1),
      wrist_1: demoArmPose.wrist_1! + 0.4 * Math.sin(t * 1.1),
      wrist_2: demoArmPose.wrist_2! + 1.2 * Math.sin(t * 0.7),
      wrist_3: 1.5 * Math.sin(t * 0.5),
    }
    // Stale is watched only while the stream runs: the paused still is a choice, not a robot gone quiet.
    return <RobotModel urdf={demoArmUrdf} joints={joints} staleAfterMs={still ? undefined : 1000} />
  },
}

/** wrist_2 is 5° from its limit: the link it turns is drawn in the warning colour, and the callout names it with its value and limits. */
export const RobotModelHighlightedJoint: S = {
  render: () => <RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose, wrist_2: 2.71 }} highlight={["wrist_2"]} />,
}

/** The URDF is still on its way (from a parameter server); with meshes, the line counts them in. */
export const RobotModelLoading: S = {
  render: () => <RobotModel loading label="Demo arm" />,
}

/** A mesh whose package has no path: the failing file in words, and Load again. Nothing is fetched. */
export const RobotModelError: S = {
  render: () => (
    <RobotModel
      urdf={demoArmUrdf.replace(
        '<geometry><cylinder radius="0.11" length="0.06"/></geometry>',
        '<geometry><mesh filename="package://arm_description/meshes/base.stl"/></geometry>',
      )}
      label="Demo arm"
      joints={demoArmPose}
    />
  ),
}

// A fixed clock time, so the screenshot says the same thing every run.
const lastMessage = new Date(2026, 0, 15, 14, 2, 31)

/** No JointState for longer than staleAfterMs: the last pose stays, dimmed, with when it arrived. Never a silent freeze. */
export const RobotModelStale: S = {
  render: () => <RobotModel urdf={demoArmUrdf} joints={demoArmPose} updatedAt={lastMessage} staleAfterMs={1000} />,
}

/** A browser that cannot draw 3D: it says so, and lists each joint's position in words, the highlighted one marked. */
export const RobotModelTextFallback: S = {
  render: () => <RobotModel urdf={demoArmUrdf} joints={{ ...demoArmPose, wrist_2: 2.71 }} highlight={["wrist_2"]} webgl={false} />,
}

/** Nothing to show yet: no URDF was given. */
export const RobotModelEmpty: S = {
  render: () => <RobotModel label="Demo arm" />,
}
