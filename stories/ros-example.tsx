"use client"

import * as React from "react"
import { Crosshair, RotateCw } from "lucide-react"
import { RosProvider, useRosConnection, useRosPublisher, useRosStatus, useRosTopic } from "@/registry/syncrobotic/hooks/use-ros"
import {
  goalToPoseStamped,
  jointStateToJoints,
  laserScanToScan,
  occupancyGridToGrid,
  poseToRobotMapPose,
  stampToMs,
  teleopToTwist,
  type RosJointLimits,
  type RosJointState,
  type RosLaserScan,
  type RosOccupancyGrid,
  type RosPoseLike,
  type RosPoseStamped,
  type RosTwist,
} from "@/registry/syncrobotic/lib/ros"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { TeleopPad, type TeleopCommand } from "@/registry/syncrobotic/shell/teleop-pad"
import { Button } from "@/registry/syncrobotic/ui/button"
import { JointState } from "@/registry/syncrobotic/ui/joint-state"
import { gridToPlan, RobotMap, RobotMapList, type RobotMapPose, type RobotMapRobot } from "@/registry/syncrobotic/ui/robot-map"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

// A robot's page fed from its rosbridge: the map, its pose and its laser scan on RobotMap, a goal sent from the map, the
// pad driving /cmd_vel, and the arm's /joint_states. The docs page shows this file as it is and runs it against a
// rosbridge played in the browser.

/** The connection in words and shape: the blue spinner only while connecting, grey when lost, and a way to try now. */
export function RosConnectionLine() {
  const status = useRosStatus()
  const ros = useRosConnection()
  const word = {
    open: "Connected",
    connecting: status.attempt > 0 ? "Reconnecting" : "Connecting",
    error: "Connection lost",
    closed: "Disconnected",
  }[status.state]
  return (
    <div className="flex min-h-(--h-sm) flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <p role="status" className="flex items-center gap-2">
        {status.state === "connecting" ? (
          <span aria-hidden="true" className="flex">
            <Spinner className="size-4 text-info" delay={0} />
          </span>
        ) : (
          <StatusGlyph status={status.state === "open" ? "normal" : "offline"} />
        )}
        <span className={status.state === "open" ? "font-medium" : "text-muted-foreground"}>{word}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {ros.url}
          {status.state === "open" && status.latencyMs !== undefined && ` · ${status.latencyMs} ms`}
        </span>
      </p>
      {(status.state === "error" || status.state === "closed") && (
        <Button variant="outline" size="sm" onClick={ros.reconnectNow}>
          <RotateCw aria-hidden="true" />
          Reconnect
        </Button>
      )}
    </div>
  )
}

/** The map, where the robot is and what its laser sees; in goal mode a click sends it a Nav2 goal on /goal_pose. */
export function SiteMap({ robotId = "amr-7", name = "AMR-07" }: { robotId?: string; name?: string }) {
  const map = useRosTopic<RosOccupancyGrid>("/map", "nav_msgs/OccupancyGrid")
  const amcl = useRosTopic<RosPoseLike>("/amcl_pose", "geometry_msgs/PoseWithCovarianceStamped")
  // People read a scan; nobody steers by it at 40 Hz. Five a second is plenty and spares the link.
  const scan = useRosTopic<RosLaserScan>("/scan", "sensor_msgs/LaserScan", { throttleMs: 200 })
  const sendGoal = useRosPublisher<RosPoseStamped>("/goal_pose", "geometry_msgs/PoseStamped")
  const [selected, setSelected] = React.useState<string | null>(null)
  const [picking, setPicking] = React.useState(false)
  const [goal, setGoal] = React.useState<RobotMapPose | null>(null)

  // Each conversion runs once per message: robot-map draws the grid again for every new array.
  const grid = React.useMemo(() => (map ? occupancyGridToGrid(map) : undefined), [map])
  const frame = React.useMemo(() => (grid ? gridToPlan(grid) : undefined), [grid])
  const scans = React.useMemo(() => (scan ? [laserScanToScan(scan, robotId)] : []), [scan, robotId])
  const robots = React.useMemo<RobotMapRobot[]>(
    () => (frame && amcl ? [{ id: robotId, name, status: "normal", statusLabel: "Ready", ...poseToRobotMapPose(amcl, frame) }] : []),
    [frame, amcl, robotId, name],
  )

  const onGoal = (g: RobotMapPose) => {
    if (!frame) return
    setGoal(g)
    setPicking(false)
    sendGoal(goalToPoseStamped(g, frame))
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setPicking((p) => !p)} disabled={!frame}>
          <Crosshair aria-hidden="true" />
          {picking ? "Cancel goal" : "Set a goal"}
        </Button>
      </div>
      <RobotMap
        label="Map of the warehouse"
        grid={grid}
        scans={scans}
        robots={robots}
        loading={!grid}
        selectedId={selected}
        onSelect={setSelected}
        mode={picking ? "goal" : "view"}
        goal={goal}
        onGoal={onGoal}
      />
      <RobotMapList label="Robots in the warehouse" robots={robots} loading={!grid} selectedId={selected} onSelect={setSelected} />
    </div>
  )
}

/** The pad on /cmd_vel. The publisher sends a zero Twist on unmount, on a hidden page and when the link drops. */
export function Drive({ name = "AMR-07" }: { name?: string }) {
  const publish = useRosPublisher<RosTwist>("/cmd_vel", "geometry_msgs/Twist")
  const [refused, setRefused] = React.useState(false)
  const onCommand = (c: TeleopCommand) => {
    // Your robot's top speeds. Clamp on the robot too: never trust the client alone.
    const sent = publish(teleopToTwist(c, { maxLinear: 0.8, maxAngular: 1.5 }))
    // Not sent: the link is down, or it came back while the stick was still held. Lifting the finger sends a stop and
    // re-arms the pad, so a drive never resumes by itself.
    setRefused(!sent)
  }
  return (
    <div className="flex flex-col gap-2">
      <TeleopPad onCommand={onCommand} labels={{ name: `Drive ${name}` }} />
      <p className="flex min-h-5 items-center gap-2 text-sm" aria-live="polite">
        {refused && (
          <>
            <StatusGlyph status="warning" />
            Not sent: let go and hold again to drive
          </>
        )}
      </p>
    </div>
  )
}

// The URDF's limits for each joint, which /joint_states does not carry.
const limits: RosJointLimits = {
  shoulder_pan_joint: { lower: -6.28, upper: 6.28 },
  shoulder_lift_joint: { lower: -6.28, upper: 6.28 },
  elbow_joint: { lower: -3.14, upper: 3.14 },
  wrist_1_joint: { lower: -6.28, upper: 6.28 },
  wrist_2_joint: { lower: -6.28, upper: 6.28 },
  wrist_3_joint: { lower: -6.28, upper: 6.28 },
}

/** The arm's joints against their limits; the message's stamp tells a still arm from a silent one. */
export function Arm() {
  const msg = useRosTopic<RosJointState>("/joint_states", "sensor_msgs/JointState")
  const joints = React.useMemo(() => (msg ? jointStateToJoints(msg, { limits }) : []), [msg])
  return <JointState label="Arm · UR10e" joints={joints} loading={!msg} updatedAt={stampToMs(msg?.header?.stamp)} />
}

/** The page: one connection for everything on it. */
export function RobotPage() {
  return (
    <RosProvider url="ws://robot.local:9090">
      <div className="@container flex flex-col gap-4">
        <RosConnectionLine />
        <div className="grid gap-6 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SiteMap />
          <Drive />
        </div>
        <Arm />
      </div>
    </RosProvider>
  )
}
