import type { RosSocket, RosSocketConstructor, RosTwist } from "@/registry/syncrobotic/lib/ros"

/*
  A rosbridge server in the browser, for the docs and the stories: no network, no ROS. It plays one mobile robot with an
  arm in a small warehouse and answers the rosbridge v2 JSON protocol the way rosbridge_server does:
  - /map (nav_msgs/OccupancyGrid, once per subscribe, `data` as numbers like rosbridge sends int8[]);
  - /amcl_pose (PoseWithCovarianceStamped) while the robot moves, /scan (LaserScan, ray-cast against the map) at 5 Hz;
  - /joint_states (JointState) at 10 Hz, a slow wave unless `still`;
  - /cmd_vel (Twist) drives the robot, and like a real base it stops 500 ms after the last command;
  - /dock (std_srvs/Trigger) answers after 400 ms; /rosapi/get_time answers after 15 ms, for the heartbeat.
  `drop()` cuts every link and refuses connections for a while, to show the reconnect and the stop on a dropped link.
*/

const RES = 0.1
const W = 240
const H = 140
const ORIGIN = { x: -4, y: -2 }
const MAX_LINEAR = 0.8
const MAX_ANGULAR = 1.5
const COMMAND_TIMEOUT_MS = 500
const TICK_MS = 100

/** The warehouse: walls round the edge, three rows of shelves, a pillar, and an unmapped bay in the top-right corner. */
function warehouse(): number[] {
  const cells = new Array<number>(W * H).fill(0)
  const fill = (x0: number, y0: number, x1: number, y1: number, v: number) => {
    for (let y = Math.round(y0 / RES); y < Math.round(y1 / RES); y++)
      for (let x = Math.round(x0 / RES); x < Math.round(x1 / RES); x++) if (x >= 0 && x < W && y >= 0 && y < H) cells[y * W + x] = v
  }
  fill(18, 9, 24, 14, -1)
  fill(0, 0, 24, 0.2, 100)
  fill(0, 13.8, 18, 14, 100)
  fill(0, 0, 0.2, 14, 100)
  fill(23.8, 0, 24, 9, 100)
  fill(18, 9, 24, 9.2, 100)
  fill(17.8, 9, 18, 14, 100)
  for (const y of [3, 6.5, 10]) fill(7, y, 15, y + 0.8, 100)
  fill(20, 4, 20.6, 4.6, 100)
  // A trolley the map is not sure about.
  fill(3, 10, 3.6, 10.6, 60)
  return cells
}

const JOINTS = ["shoulder_pan_joint", "shoulder_lift_joint", "elbow_joint", "wrist_1_joint", "wrist_2_joint", "wrist_3_joint"]
const REST = [0.4, -1.2, 1.6, -1.9, -1.57, 0.2]

type Pose = { x: number; y: number; yaw: number }

export type MockRosbridge = {
  /** Pass as `WebSocket` to createRosConnection. */
  WebSocket: RosSocketConstructor
  /** Cuts every link now, and refuses new ones for `downMs`. */
  drop: (downMs?: number) => void
}

export function createMockRosbridge(options: { still?: boolean; connectDelayMs?: number } = {}): MockRosbridge {
  const { still = false, connectDelayMs = 300 } = options
  const grid = warehouse()
  const pose: Pose = { x: 0.5, y: 1, yaw: 0 }
  let command: { linear: number; angular: number; at: number } | null = null
  let downUntil = 0
  let tick: ReturnType<typeof setInterval> | undefined
  let ticks = 0
  const sockets = new Set<MockSocket>()

  const stamp = () => {
    const ms = Date.now()
    return { sec: Math.floor(ms / 1000), nanosec: (ms % 1000) * 1e6 }
  }
  const occupied = (x: number, y: number) => {
    const cx = Math.floor((x - ORIGIN.x) / RES)
    const cy = Math.floor((y - ORIGIN.y) / RES)
    if (cx < 0 || cy < 0 || cx >= W || cy >= H) return true
    return (grid[cy * W + cx] ?? 0) > 50
  }

  const messages = {
    "/map": () => ({
      header: { stamp: stamp(), frame_id: "map" },
      info: { resolution: RES, width: W, height: H, origin: { position: { x: ORIGIN.x, y: ORIGIN.y, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } } },
      data: grid,
    }),
    "/amcl_pose": () => ({
      header: { stamp: stamp(), frame_id: "map" },
      pose: {
        pose: { position: { x: pose.x, y: pose.y, z: 0 }, orientation: { x: 0, y: 0, z: Math.sin(pose.yaw / 2), w: Math.cos(pose.yaw / 2) } },
        covariance: new Array<number>(36).fill(0),
      },
    }),
    "/scan": () => {
      const n = 240
      const ranges: (number | null)[] = []
      for (let i = 0; i < n; i++) {
        const a = pose.yaw - Math.PI + (i * 2 * Math.PI) / n
        let r = 0.15
        while (r < 8 && !occupied(pose.x + r * Math.cos(a), pose.y + r * Math.sin(a))) r += 0.05
        // No return within range: rosbridge sends Infinity, which JSON carries as null.
        ranges.push(r >= 8 ? null : Math.round(r * 1000) / 1000)
      }
      return { header: { stamp: stamp(), frame_id: "base_link" }, angle_min: -Math.PI, angle_max: Math.PI, angle_increment: (2 * Math.PI) / n, range_min: 0.12, range_max: 8, ranges }
    },
    "/joint_states": () => {
      const t = still ? 0 : Date.now() / 1000
      return {
        header: { stamp: stamp(), frame_id: "" },
        name: JOINTS,
        position: REST.map((p, i) => Math.round((p + 0.25 * Math.sin(t * 0.6 + i)) * 1000) / 1000),
        velocity: REST.map((_, i) => (still ? 0 : Math.round(0.15 * Math.cos(t * 0.6 + i) * 1000) / 1000)),
        effort: [12.4, 48.1, 21.7, 4.2, 3.9, 1.1],
      }
    },
  } as const
  type Topic = keyof typeof messages

  const send = (topic: Topic) => {
    const subscribed = [...sockets].filter((s) => s.topics.has(topic))
    if (subscribed.length === 0) return
    const frame = JSON.stringify({ op: "publish", topic, msg: messages[topic]() })
    for (const s of subscribed) s.deliver(frame)
  }

  const step = () => {
    ticks++
    let moved = false
    if (command && Date.now() - command.at > COMMAND_TIMEOUT_MS) command = null
    if (command && (command.linear !== 0 || command.angular !== 0)) {
      const dt = TICK_MS / 1000
      const yaw = pose.yaw + command.angular * dt
      const x = pose.x + command.linear * Math.cos(yaw) * dt
      const y = pose.y + command.linear * Math.sin(yaw) * dt
      pose.yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw))
      // The base will not drive into a wall: it turns in place instead.
      if (!occupied(x + 0.3 * Math.cos(yaw), y + 0.3 * Math.sin(yaw))) {
        pose.x = x
        pose.y = y
      }
      moved = true
    }
    if (moved) send("/amcl_pose")
    if (moved && ticks % 2 === 0) send("/scan")
    send("/joint_states")
  }

  const running = () => {
    const open = [...sockets].some((s) => s.readyState === 1)
    if (open && !tick) tick = setInterval(step, TICK_MS)
    if (!open && tick) {
      clearInterval(tick)
      tick = undefined
    }
  }

  class MockSocket implements RosSocket {
    readyState = 0
    topics = new Set<Topic>()
    onopen: RosSocket["onopen"] = null
    onclose: RosSocket["onclose"] = null
    onerror: RosSocket["onerror"] = null
    onmessage: RosSocket["onmessage"] = null

    constructor(readonly url: string) {
      sockets.add(this)
      const refused = Date.now() < downUntil
      setTimeout(() => {
        if (this.readyState !== 0) return
        if (refused) return this.end(1006)
        this.readyState = 1
        this.onopen?.({})
        running()
      }, refused ? 600 : connectDelayMs)
    }

    deliver(frame: string) {
      if (this.readyState === 1) this.onmessage?.({ data: frame })
    }

    end(code: number) {
      this.readyState = 3
      sockets.delete(this)
      running()
      this.onclose?.({ code, reason: "" })
    }

    close() {
      if (this.readyState === 3) return
      setTimeout(() => this.end(1000))
      this.readyState = 2
    }

    send(data: string) {
      if (this.readyState !== 1) throw new Error("InvalidStateError: the socket is not open")
      const m = JSON.parse(data) as { op: string; topic?: string; id?: string; service?: string; msg?: unknown }
      if (m.op === "subscribe" && m.topic && m.topic in messages) {
        const topic = m.topic as Topic
        this.topics.add(topic)
        const frame = JSON.stringify({ op: "publish", topic, msg: messages[topic]() })
        setTimeout(() => this.deliver(frame))
      } else if (m.op === "unsubscribe" && m.topic) {
        this.topics.delete(m.topic as Topic)
      } else if (m.op === "publish" && m.topic === "/cmd_vel") {
        const t = m.msg as RosTwist
        const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, Number.isFinite(v) ? v : 0))
        command = { linear: clamp(t.linear?.x ?? 0, MAX_LINEAR), angular: clamp(t.angular?.z ?? 0, MAX_ANGULAR), at: Date.now() }
      } else if (m.op === "call_service") {
        const reply = (values: unknown, after: number) =>
          setTimeout(() => this.deliver(JSON.stringify({ op: "service_response", id: m.id, service: m.service, result: true, values })), after)
        if (m.service === "/rosapi/get_time") reply({ time: stamp() }, 15)
        else if (m.service === "/dock") reply({ success: true, message: "Docked at charger 2" }, 400)
        else
          setTimeout(() =>
            this.deliver(JSON.stringify({ op: "service_response", id: m.id, service: m.service, result: false, values: `Service ${m.service} does not exist` })),
          )
      }
    }
  }

  return {
    WebSocket: MockSocket,
    drop: (downMs = 2500) => {
      downUntil = Date.now() + downMs
      command = null
      for (const s of [...sockets]) if (s.readyState === 1) s.end(1006)
    },
  }
}
