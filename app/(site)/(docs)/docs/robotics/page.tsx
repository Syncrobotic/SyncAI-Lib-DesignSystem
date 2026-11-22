import type { Metadata } from "next"
import Link from "next/link"
import { getItem } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta, site } from "@/site/config"
import { Pager } from "@/site/doc"
import { startNeighbours } from "@/site/foundations"
import { overviews } from "@/site/overview"
import { H2, Inline, PageTitle } from "@/site/prose"

const title = "Robotics UI kit"
const description =
  "A robotics UI kit for React: emergency stop, teleoperation pad, robot map with occupancy grids and laser scans, camera feed, LiDAR point cloud, URDF robot model, joint states, diagnostics and alarms, as shadcn/ui components for Tailwind CSS v4."

export const metadata: Metadata = { ...pageMeta({ title: `${title} for React`, description, path: "/docs/robotics" }), keywords: ["robotics UI kit", "robot UI", "robot dashboard", "ROS", "ROS 2", "teleoperation", "fleet management"] }

// What an operator does with a robot, in that order: stop it first, then drive it, see what it sees, read its state.
const sections: { id: string; title: string; lead: string; items: string[] }[] = [
  { id: "safety", title: "Safety", lead: "Stopping comes first: the stop is always on screen, and a dangerous action needs a deliberate gesture.", items: ["stop-button", "slide-to-release", "alarm"] },
  { id: "driving", title: "Driving and missions", lead: "Manual driving that stops the robot the moment the finger lifts, and a map to send it somewhere.", items: ["teleop-pad", "robot-map", "waypoint-editor"] },
  { id: "seeing", title: "What the robot sees", lead: "The camera, the LiDAR and the map it built, each saying in words whether the picture is live.", items: ["camera-feed", "point-cloud", "annotated-image"] },
  { id: "state", title: "The robot's state", lead: "Pose, joints, live telemetry, health, battery and status, in shapes and words rather than colour alone.", items: ["robot-model", "joint-state", "streaming-chart", "diagnostics", "status-glyph", "meter", "metric-card"] },
  { id: "shell", title: "App shell for robot apps", lead: "The frame of a control app held outdoors: a dynamic island for the one thing that matters now, a dock and trays.", items: ["island", "dock", "tray", "list"] },
]

// The ROS messages the components take as they arrive, so a bridge (rosbridge, Foxglove, your own) passes them through.
const ros: [string, string, string][] = [
  ["nav_msgs/OccupancyGrid", "robot-map", "grid, costmap"],
  ["sensor_msgs/LaserScan", "robot-map", "scans"],
  ["geometry_msgs/PoseStamped (goal)", "robot-map", "mode=\"goal\", onGoal"],
  ["nav_msgs/Path, NavigateThroughPoses goal", "waypoint-editor", "onSave (waypointsToPath, waypointsToNavigateThroughPoses), value (pathToWaypoints)"],
  ["sensor_msgs/PointCloud2 (decoded)", "point-cloud", "points, intensity"],
  ["sensor_msgs/JointState", "joint-state, robot-model", "joints"],
  ["std_msgs/Float64, BatteryState, any topic of numbers", "streaming-chart", "push, subscribe"],
  ["diagnostic_msgs/DiagnosticArray", "diagnostics", "statuses"],
  ["URDF (robot_description)", "robot-model", "urdf, urdfUrl"],
  ["geometry_msgs/Twist", "teleop-pad", "onCommand: { linear, angular }"],
  ["rcl_interfaces/Log (/rosout)", "log-viewer", "lines, ref.append (rosLogToLogLine)"],
  ["Video (WebRTC or a URL)", "camera-feed", "stream, src"],
]

export default function RoboticsPage() {
  return (
    <>
      <PageTitle
        title={title}
        lead={`The ${site.name} is a UI kit for the people who run robots: React components for robot control apps, fleet consoles and teleoperation, built on shadcn/ui and Tailwind CSS v4. Each one installs into your project as source.`}
      />
      <p className="max-w-2xl text-pretty">
        Most UI kits stop at buttons, forms and charts. A robot app also needs an emergency stop that is never hidden, a drive control
        that fails safe, a map in metres, a camera that says when it froze, and alarms an operator can trust at 3 a.m. Those are here,
        with the same tokens, dark and light themes, a high-contrast mode for sunlight and glove-sized targets for the field.
      </p>

      {sections.map((s) => (
        <section key={s.id} aria-labelledby={s.id}>
          <H2 id={s.id}>{s.title}</H2>
          <p className="max-w-2xl pb-4 text-pretty text-muted-foreground">{s.lead}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.items.map((name) => {
              const item = getItem(name)
              const what = overviews[name]?.what
              if (!item) return null
              return (
                <li key={name}>
                  <Link
                    href={`/docs/components/${name}`}
                    className="press flex h-full flex-col gap-1 rounded-md bg-card p-4 ring-1 ring-border transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent"
                  >
                    <span className="font-medium">{item.title}</span>
                    {what && <span className="text-sm text-pretty text-muted-foreground">{what}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <H2 id="ros">Works with ROS and ROS 2</H2>
      <p className="max-w-2xl pb-4 text-pretty">
        No ROS library inside: the components take plain props in the shape the messages arrive in (REP 103 axes, metres and radians), so
        whatever bridge your app uses passes them straight through.
      </p>
      <div className="overflow-x-auto rounded-md ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Message</th>
              <th scope="col" className="px-3 py-2 font-medium">Component</th>
              <th scope="col" className="px-3 py-2 font-medium">Props</th>
            </tr>
          </thead>
          <tbody>
            {ros.map(([msg, comp, props]) => (
              <tr key={msg} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{msg}</td>
                <td className="px-3 py-2">{comp}</td>
                <td className="px-3 py-2 font-mono text-xs">{props}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="max-w-2xl pt-4 text-pretty">
        To get them there from a robot, <Inline text="`use-ros`" /> connects over rosbridge with no ROS library and converts each message
        on the way: see{" "}
        <Link href="/docs/ros" className="underline underline-offset-4">
          Connect to ROS
        </Link>
        , with a live example and the safety notes for driving over a browser.
      </p>

      <H2 id="install">Install</H2>
      <p className="max-w-2xl pb-4 text-pretty">
        Add the registry once (see <Link href="/docs/installation" className="underline underline-offset-4">Installation</Link>), then any
        component by name. <Inline text="robot-model" /> is the only one that brings three.js; the rest add no 3D or map library.
      </p>
      <CodeBlock code="npx shadcn add @syncrobotic/stop-button @syncrobotic/teleop-pad @syncrobotic/robot-map @syncrobotic/camera-feed" lang="bash" />

      <Pager {...startNeighbours("/docs/robotics")} />
    </>
  )
}
