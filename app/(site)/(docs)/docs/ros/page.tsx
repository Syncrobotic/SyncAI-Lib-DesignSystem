import type { Metadata } from "next"
import Link from "next/link"
import { readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta } from "@/site/config"
import { Pager } from "@/site/doc"
import { startNeighbours } from "@/site/foundations"
import { H2, Inline, PageTitle, Rules } from "@/site/prose"
import { installed } from "@/site/story-source"
import { RosConsoleDemo } from "@/stories/ros-demo"

const title = "Connect to ROS"
const description =
  "Feed the robotics components from ROS 1 or ROS 2 over rosbridge, with no ROS library: a rosbridge client with reconnect, React hooks for topics, publishers and services, converters for OccupancyGrid, LaserScan, PointCloud2 and JointState, and a drive link that stops safely."

export const metadata: Metadata = {
  ...pageMeta({ title: "Connect to ROS and ROS 2 with rosbridge", description, path: "/docs/ros" }),
  keywords: ["ROS", "ROS 2", "rosbridge", "roslib alternative", "cmd_vel", "teleoperation", "OccupancyGrid", "PointCloud2", "React"],
}

// The example is a real file: the docs show it as it is (with the paths the shadcn CLI installs to) and run it below, so
// the code on the page and what it does cannot drift apart. tsc checks it with the rest of the stories.
const example = readSource("stories/ros-example.tsx")
  .split("\n")
  .map((line) => (line.startsWith("import") || line.startsWith("} from") ? installed(line) : line))
  .join("\n")

const rosbridge = `# On the robot (ROS 2). Listens on ws://<robot>:9090 and starts rosapi beside it.
sudo apt install ros-$ROS_DISTRO-rosbridge-suite
ros2 launch rosbridge_server rosbridge_websocket_launch.xml

# ROS 1
roslaunch rosbridge_server rosbridge_websocket.launch`

const install = "npx shadcn add @syncrobotic/use-ros @syncrobotic/robot-map @syncrobotic/teleop-pad @syncrobotic/joint-state"

// Message, the usual topic, the converter, and where its result goes.
const conversions: [string, string, string, string][] = [
  ["nav_msgs/OccupancyGrid", "/map, /global_costmap/costmap", "occupancyGridToGrid(msg)", "RobotMap grid, costmap"],
  ["sensor_msgs/LaserScan", "/scan", "laserScanToScan(msg, robotId)", "RobotMap scans"],
  ["geometry_msgs/PoseWithCovarianceStamped", "/amcl_pose", "poseToRobotMapPose(msg, gridToPlan(grid))", "RobotMap robots: x, y, heading"],
  ["geometry_msgs/PoseStamped (out)", "/goal_pose", "goalToPoseStamped(goal, frame)", "from RobotMap onGoal"],
  ["sensor_msgs/PointCloud2", "/points", "pointCloud2ToPoints(msg)", "PointCloud points, intensity"],
  ["sensor_msgs/JointState", "/joint_states", "jointStateToJoints(msg, { limits })", "JointState joints"],
  ["sensor_msgs/JointState", "/joint_states", "jointStateToRecord(msg) (robot-model)", "RobotModel joints"],
  ["nav_msgs/Path (out)", "/plan, a route topic", "waypointsToPath(waypoints, frame)", "from WaypointEditor onSave"],
  ["NavigateThroughPoses goal (out)", "/navigate_through_poses", "waypointsToNavigateThroughPoses(waypoints, frame)", "from WaypointEditor onSave"],
  ["nav_msgs/Path, NavigateThroughPoses goal", "a saved route", "pathToWaypoints(msg, frame), navigateThroughPosesToWaypoints(goal, frame)", "WaypointEditor value"],
  ["rcl_interfaces/Log", "/rosout", "rosLogToLogLine(msg)", "LogViewer ref.append, or a createLogBuffer"],
  ["sensor_msgs/Image (not over rosbridge)", "/camera/image_raw", "webVideoServerSrc(server, topic, { quality })", "CameraFeed src, CameraWall getSource"],
  ["vision_msgs/Detection2DArray", "/detections", "detection2DArrayToAnnotations(msg, { classes })", "AnnotatedImage annotations, GroundedText annotations"],
  ["geometry_msgs/Twist (out)", "/cmd_vel", "teleopToTwist(command, { maxLinear, maxAngular })", "from TeleopPad onCommand"],
  ["std_msgs/Header", "any", "stampToMs(msg.header.stamp)", "updatedAt (stale detection)"],
]

const states: [string, string][] = [
  ["connecting", "The blue spinner and Connecting (Reconnecting after a drop): a process being waited on."],
  ["open", "Connected, with the latency when the heartbeat is on. Calm: no colour."],
  ["error", "Connection lost, grey with the offline shape, and Reconnect. Views keep their last message: say they are not live."],
  ["closed", "Disconnected: the app closed it, or has not connected yet."],
]

const api = `// @/lib/ros: no React, no dependencies
createRosConnection({ url, reconnect?, heartbeat?, connectTimeoutMs?, maxQueue?, queueTtlMs?, WebSocket? }): RosConnection
  connection.connect() / close() / reconnectNow()
  connection.getStatus(): { state: "connecting" | "open" | "closed" | "error"; error?; attempt; retryAt?; latencyMs? }
  connection.subscribe(topic, type, listener, { throttleMs?, queueLength? }): () => void
  connection.publisher(topic, type, { stopMessage?, isStop? }): { publish(msg): boolean; stop(); release() }
  connection.call(service, request, { type?, timeoutMs? }): Promise<response>

// @/hooks/use-ros
<RosProvider url="ws://robot:9090" reconnect? heartbeat?>   or   <RosProvider connection={connection}>
useRosStatus(): RosStatus
useRosTopic<T>(name, type, { throttleMs?, queueLength?, enabled? }): T | undefined
useRosPublisher<T>(name, type, { stopMessage? }): (message: T) => boolean
useRosService<Req, Res>(name, type?, { timeoutMs? }): (request: Req) => Promise<Res>`

const safety = [
  "**rosbridge has no watchdog.** If the tab freezes, the laptop sleeps or the network drops mid-drive, the last command the robot received may be a moving one, and nothing in the browser can reach it until the link is back. The robot must stop by itself when commands stop arriving: `cmd_vel_timeout` on ros2_control's diff_drive_controller (0.5 s by default), a `timeout` per input in twist_mux, or your base driver's own. TeleopPad sends ten commands a second while held, so a timeout of three periods (300 ms) never trips while someone is driving.",
  "useRosPublisher on a `geometry_msgs/Twist` or `TwistStamped` topic sends a zero Twist when the component unmounts, when the page is hidden, and when the connection closes, if its last command was not already a stop.",
  "A drive command is never queued: while the link is down it is dropped (publish returns false), so a command cannot arrive late and move a robot nobody is steering any more. The stop sent on a dropped link is queued instead, never expires, and is the first thing the robot hears when the link returns.",
  "After a dropped link or a hidden page, drive commands are refused until the app publishes a stop. TeleopPad publishes one when the finger lifts, so the operator lets go and presses again: a stick still held when the link returns does not drive. Say so on screen when publish returns false.",
  "The heartbeat (`heartbeat: true`, which calls `/rosapi/get_time`) notices a link that died without closing, which a WebSocket can take minutes to report, and shows the latency. Turn it on wherever someone drives.",
  "None of this is an emergency stop. Keep the robot's own stop (a hardware button, a safety PLC) for that; StopButton on screen sends a request, as everything here does.",
]

const limits = [
  "JSON only (`compression: \"none\"`): CBOR, CBOR-RAW and PNG compression are not read. Clouds and maps arrive as base64 or number arrays and are decoded in the browser; throttle large topics.",
  "Topics and services. Actions (`send_action_goal`), services served by the browser (`advertise_service`) and QoS profiles are not covered; `connection.call` and a topic cover Nav2's `/goal_pose` and most robot APIs.",
  "One message type per topic per connection: the first subscriber's type is used.",
]

export default function RosPage() {
  return (
    <>
      <PageTitle
        title={title}
        lead="Feed the robotics components from ROS 1 or ROS 2 through rosbridge, with no ROS library: one connection that reconnects, hooks for topics, publishers and services, converters from each message to a component's props, and a drive link that stops safely."
      />

      <section aria-labelledby="live" className="flex flex-col gap-3">
        <h2 id="live" className="sr-only">
          Live example
        </h2>
        <div className="rounded-md border border-border bg-background p-4 sm:p-6">
          <RosConsoleDemo />
        </div>
        <p className="text-sm text-muted-foreground">
          The code below, running against a rosbridge simulated in this page (no robot, no network). Drive with the pad or the arrow keys,
          set a goal on the map, or drop the link to watch it reconnect and stop.
        </p>
      </section>

      <H2 id="rosbridge">1. Start rosbridge on the robot</H2>
      <p className="max-w-2xl pb-4 text-pretty">
        <Link href="https://github.com/RobotWebTools/rosbridge_suite" className="underline underline-offset-4">
          rosbridge_suite
        </Link>{" "}
        serves ROS topics and services over a WebSocket as JSON, for ROS 1 and ROS 2 alike. From a page served over https, put it behind a
        TLS proxy and use <Inline text="`wss://`" />: browsers block <Inline text="`ws://`" /> from secure pages.
      </p>
      <CodeBlock code={rosbridge} lang="bash" title="Terminal" />

      <H2 id="install">2. Install</H2>
      <p className="max-w-2xl pb-4 text-pretty">
        <Inline text="`use-ros` brings `ros`, the client and the converters. No npm package is added: the protocol is spoken directly over the browser's WebSocket." />
      </p>
      <CodeBlock code={install} lang="bash" title="Terminal" />

      <H2 id="wire">3. Wire the components</H2>
      <p className="max-w-2xl pb-4 text-pretty">
        One <Inline text="`RosProvider`" /> per robot; each hook subscribes while its component is on screen, and two components on one
        topic share one subscription. Convert a message once per message, in a <Inline text="`useMemo`" /> keyed on it.
      </p>
      <CodeBlock code={example} lang="tsx" title="app/robot/robot-page.tsx" />

      <H2 id="messages">From message to component</H2>
      {/* A table that scrolls sideways is a Tab stop, so the keyboard can scroll it too. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region is a Tab stop so the keyboard can scroll it (WCAG 2.1.1) */}
      <div tabIndex={0} role="region" aria-label="From message to component" className="overflow-x-auto rounded-md ring-1 ring-border focus-visible:outline-2 focus-visible:outline-offset-2">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Message</th>
              <th scope="col" className="px-3 py-2 font-medium">Topic</th>
              <th scope="col" className="px-3 py-2 font-medium">Converter</th>
              <th scope="col" className="px-3 py-2 font-medium">Into</th>
            </tr>
          </thead>
          <tbody>
            {conversions.map(([msg, topic, fn, into]) => (
              <tr key={fn} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{msg}</td>
                <td className="px-3 py-2 font-mono text-xs">{topic}</td>
                <td className="px-3 py-2 font-mono text-xs">{fn}</td>
                <td className="px-3 py-2">{into}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="max-w-2xl pt-4 text-sm text-pretty text-muted-foreground">
        <Inline text="rosbridge sends `uint8[]` (PointCloud2 data) as base64 and `int8[]` (OccupancyGrid data) as numbers; NaN and ±Infinity in a LaserScan arrive as null. The converters read all of these. Poses must be in the map frame; a scan is drawn from the robot's centre." />
      </p>

      <H2 id="safety">Driving safely over a browser</H2>
      <Rules rules={safety} />

      <H2 id="status">Connection state</H2>
      <p className="max-w-2xl pb-4 text-pretty">
        <Inline text="`useRosStatus()` gives the state, the last error, the attempt and, with the heartbeat, the latency. Show it in words and shape wherever a robot is driven or watched. After a drop the connection waits up to 0.5 s, then up to 1, 2, 4 and 8 s, never more than 10 s, each wait a random point in its upper half so many tabs do not return together; it subscribes and advertises again on every new socket." />
      </p>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region is a Tab stop so the keyboard can scroll it (WCAG 2.1.1) */}
      <div tabIndex={0} role="region" aria-label="Connection states" className="overflow-x-auto rounded-md ring-1 ring-border focus-visible:outline-2 focus-visible:outline-offset-2">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">State</th>
              <th scope="col" className="px-3 py-2 font-medium">Show</th>
            </tr>
          </thead>
          <tbody>
            {states.map(([s, show]) => (
              <tr key={s} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{s}</td>
                <td className="px-3 py-2">{show}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="api">API</H2>
      <CodeBlock code={api} lang="ts" title="API" />
      <p className="max-w-2xl pt-4 text-pretty">
        Each item&apos;s page has its source:{" "}
        <Link href="/docs/components/use-ros" className="underline underline-offset-4">
          useRos
        </Link>{" "}
        and{" "}
        <Link href="/docs/components/ros" className="underline underline-offset-4">
          ROS
        </Link>
        .
      </p>

      <H2 id="limits">Not covered</H2>
      <Rules rules={limits} />

      <Pager {...startNeighbours("/docs/ros")} />
    </>
  )
}
