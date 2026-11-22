import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createRosConnection,
  diagnosticArrayToStatuses,
  goalToPoseStamped,
  isZeroTwist,
  jointStateToJoints,
  laserScanToScan,
  mergeDiagnostics,
  occupancyGridToGrid,
  parseRosJson,
  pointCloud2ToPoints,
  poseToRobotMapPose,
  quaternionToYaw,
  rosLogToLogLine,
  RosConnectionError,
  RosServiceError,
  RosTimeoutError,
  stampToMs,
  teleopToTwist,
  webVideoServerSrc,
  yawToQuaternion,
  zeroTwist,
  type RosConnectionOptions,
  type RosPointCloud2,
  type RosTwist,
} from "@/registry/syncrobotic/lib/ros"
import { gridToPlan, rasteriseGrid, rosToPlan, scanToPoints, type RobotMapGrid, type RobotMapPose, type RobotMapScan } from "@/registry/syncrobotic/ui/robot-map"
import type { JointStateJoint } from "@/registry/syncrobotic/ui/joint-state"
import type { DiagnosticStatus } from "@/registry/syncrobotic/ui/diagnostics"
import type { LogLine } from "@/registry/syncrobotic/ui/log-viewer"
import { fakeRosbridge } from "./fake-rosbridge"

// The rosbridge client against a fake socket (the server is played by the test), and the converters against messages
// shaped as rosbridge sends them.

const flush = () => Promise.resolve()

function setup(options: Partial<RosConnectionOptions> = {}) {
  const bridge = fakeRosbridge()
  const ros = createRosConnection({ url: "ws://robot:9090", WebSocket: bridge.WebSocket, random: () => 1, ...options })
  return { bridge, ros }
}

function opened(options: Partial<RosConnectionOptions> = {}) {
  const s = setup(options)
  s.ros.connect()
  s.bridge.last.open()
  return s
}

const drive: RosTwist = { linear: { x: 0.5, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0.2 } }

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe("connection state", () => {
  it("is closed until connect, connecting while the socket opens, then open", () => {
    const { bridge, ros } = setup()
    expect(ros.getStatus().state).toBe("closed")
    expect(bridge.sockets).toHaveLength(0)
    ros.connect()
    expect(ros.getStatus().state).toBe("connecting")
    expect(bridge.last.url).toBe("ws://robot:9090")
    bridge.last.open()
    expect(ros.getStatus()).toMatchObject({ state: "open", attempt: 0 })
  })

  it("tells status listeners each change and keeps the same snapshot between changes", () => {
    const { bridge, ros } = setup()
    const seen: string[] = []
    ros.subscribeStatus(() => seen.push(ros.getStatus().state))
    ros.connect()
    const snap = ros.getStatus()
    expect(ros.getStatus()).toBe(snap)
    bridge.last.open()
    expect(seen).toEqual(["connecting", "open"])
  })

  it("gives up on a socket that stays connecting past connectTimeoutMs, and tries again", () => {
    const { bridge, ros } = setup({ connectTimeoutMs: 1000 })
    ros.connect()
    vi.advanceTimersByTime(1000)
    expect(bridge.sockets[0]!.closedByClient).toBe(true)
    expect(ros.getStatus().state).toBe("error")
    expect(ros.getStatus().error?.message).toMatch(/within 1000 ms/)
  })

  it("closes on close(), stays closed and does not reconnect", () => {
    const { bridge, ros } = opened()
    ros.close()
    expect(bridge.last.closedByClient).toBe(true)
    expect(ros.getStatus().state).toBe("closed")
    vi.advanceTimersByTime(60_000)
    expect(bridge.sockets).toHaveLength(1)
  })
})

describe("reconnect", () => {
  it("backs off exponentially, capped, with jitter, and resets after it opens", () => {
    const { bridge, ros } = setup({ reconnect: { minDelayMs: 500, maxDelayMs: 2000, factor: 2 }, random: () => 1 })
    ros.connect()
    const waits: number[] = []
    for (let i = 0; i < 5; i++) {
      const before = bridge.sockets.length
      bridge.last.drop()
      expect(ros.getStatus().state).toBe("error")
      expect(ros.getStatus().attempt).toBe(i + 1)
      let waited = 0
      while (bridge.sockets.length === before) {
        vi.advanceTimersByTime(50)
        waited += 50
      }
      waits.push(waited)
    }
    expect(waits).toEqual([500, 1000, 2000, 2000, 2000])
    bridge.last.open()
    expect(ros.getStatus()).toMatchObject({ state: "open", attempt: 0, retryAt: undefined, error: undefined })
  })

  it("jitters each wait between half and all of it", () => {
    const { bridge, ros } = setup({ reconnect: { minDelayMs: 1000 }, random: () => 0 })
    ros.connect()
    bridge.last.drop()
    vi.advanceTimersByTime(499)
    expect(bridge.sockets).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(bridge.sockets).toHaveLength(2)
  })

  it("says when the next attempt starts, and reconnectNow skips the wait", () => {
    const { bridge, ros } = opened({ reconnect: { minDelayMs: 5000 } })
    bridge.last.drop()
    expect(ros.getStatus().retryAt).toBeGreaterThan(Date.now())
    expect(ros.getStatus().error?.message).toMatch(/lost/)
    ros.reconnectNow()
    expect(bridge.sockets).toHaveLength(2)
    expect(ros.getStatus().state).toBe("connecting")
  })

  it("stays in error after a drop with reconnect: false", () => {
    const { bridge, ros } = opened({ reconnect: false })
    bridge.last.drop()
    vi.advanceTimersByTime(60_000)
    expect(bridge.sockets).toHaveLength(1)
    expect(ros.getStatus()).toMatchObject({ state: "error", retryAt: undefined })
  })

  it("resubscribes and re-advertises on the new socket", () => {
    const { bridge, ros } = opened()
    ros.subscribe("/scan", "sensor_msgs/LaserScan", () => {}, { throttleMs: 100 })
    ros.publisher("/goal_pose", "geometry_msgs/PoseStamped").publish({ pose: {} })
    const first = bridge.last
    first.drop()
    vi.advanceTimersByTime(10_000)
    const second = bridge.last
    expect(second).not.toBe(first)
    second.open()
    const sub = first.sent.find((f) => f.op === "subscribe")!
    expect(second.sent.map((f) => f.op)).toEqual(["subscribe", "advertise"])
    expect(second.sent[0]).toEqual(sub)
    expect(second.sent[0]).toMatchObject({ topic: "/scan", throttle_rate: 100 })
  })

  it("ignores events from a socket it has replaced", () => {
    const { bridge, ros } = opened()
    const old = bridge.last
    old.drop()
    vi.advanceTimersByTime(10_000)
    bridge.last.open()
    old.onclose?.({ code: 1006 })
    expect(ros.getStatus().state).toBe("open")
  })
})

describe("subscriptions", () => {
  it("sends one subscribe for two listeners on a topic, and unsubscribes when the last one leaves", async () => {
    const { bridge, ros } = opened()
    const a = vi.fn()
    const b = vi.fn()
    const offA = ros.subscribe("/odom", "nav_msgs/Odometry", a)
    const offB = ros.subscribe("/odom", "nav_msgs/Odometry", b)
    expect(bridge.ops("subscribe")).toHaveLength(1)
    const id = bridge.ops("subscribe")[0]!.id
    bridge.last.emit({ op: "publish", topic: "/odom", msg: { n: 1 } })
    expect(a).toHaveBeenCalledWith({ n: 1 })
    expect(b).toHaveBeenCalledWith({ n: 1 })
    expect(ros.latest("/odom")).toEqual({ n: 1 })
    offA()
    await flush()
    expect(bridge.ops("unsubscribe")).toHaveLength(0)
    offB()
    offB()
    await flush()
    expect(bridge.ops("unsubscribe")).toEqual([{ op: "unsubscribe", id, topic: "/odom" }])
    expect(ros.latest("/odom")).toBeUndefined()
  })

  it("keeps the wire subscription when a listener leaves and one comes back in the same tick (StrictMode)", async () => {
    const { bridge, ros } = opened()
    const off = ros.subscribe("/odom", "nav_msgs/Odometry", () => {})
    off()
    ros.subscribe("/odom", "nav_msgs/Odometry", () => {})
    await flush()
    expect(bridge.ops("subscribe")).toHaveLength(1)
    expect(bridge.ops("unsubscribe")).toHaveLength(0)
  })

  it("asks for the fastest rate any listener wants, under the same id, and relaxes when it leaves", async () => {
    const { bridge, ros } = opened()
    ros.subscribe("/map", "nav_msgs/OccupancyGrid", () => {}, { throttleMs: 1000 })
    const off = ros.subscribe("/map", "nav_msgs/OccupancyGrid", () => {}, { throttleMs: 200, queueLength: 1 })
    const subs = bridge.ops("subscribe")
    expect(subs.map((s) => s.throttle_rate)).toEqual([1000, 200])
    expect(subs[1]).toMatchObject({ id: subs[0]!.id, queue_length: 1, compression: "none" })
    off()
    await flush()
    expect(bridge.ops("subscribe").at(-1)).toMatchObject({ throttle_rate: 1000 })
    expect(bridge.ops("subscribe").at(-1)!.queue_length).toBeUndefined()
  })

  it("subscribes on open when it was asked while connecting, without sending on a closed socket", () => {
    const { bridge, ros } = setup()
    ros.connect()
    ros.subscribe("/joint_states", "sensor_msgs/JointState", () => {})
    expect(bridge.last.sent).toHaveLength(0)
    bridge.last.open()
    expect(bridge.ops("subscribe")).toHaveLength(1)
  })

  it("keeps delivering to other listeners when one throws", () => {
    const { bridge, ros } = opened()
    const report = vi.fn()
    vi.stubGlobal("reportError", report)
    const ok = vi.fn()
    ros.subscribe("/t", "std_msgs/String", () => {
      throw new Error("boom")
    })
    ros.subscribe("/t", "std_msgs/String", ok)
    bridge.last.emit({ op: "publish", topic: "/t", msg: { data: "x" } })
    expect(ok).toHaveBeenCalled()
    expect(report).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it("reassembles fragments, reads bare NaN and Infinity, and records rosbridge's status errors", () => {
    const { bridge, ros } = opened()
    const got = vi.fn()
    ros.subscribe("/scan", "sensor_msgs/LaserScan", got)
    const whole = '{"op":"publish","topic":"/scan","msg":{"ranges":[1.5,NaN,Infinity,-Infinity]}}'
    bridge.last.emit({ op: "fragment", id: "f1", num: 1, total: 2, data: whole.slice(20) })
    expect(got).not.toHaveBeenCalled()
    bridge.last.emit({ op: "fragment", id: "f1", num: 0, total: 2, data: whole.slice(0, 20) })
    expect(got).toHaveBeenCalledWith({ ranges: [1.5, null, null, null] })
    bridge.last.emit({ op: "status", level: "error", msg: "Unable to load the manifest for package foo_msgs" })
    expect(ros.getStatus()).toMatchObject({ state: "open" })
    expect(ros.getStatus().error?.message).toMatch(/foo_msgs/)
  })

  it("parseRosJson leaves strings alone and only rewrites when plain JSON fails", () => {
    expect(parseRosJson('{"a":"NaN, b"}')).toEqual({ a: "NaN, b" })
    expect(parseRosJson('{"a":[NaN, 2]}')).toEqual({ a: [null, 2] })
    expect(() => parseRosJson("{oops")).toThrow()
  })
})

describe("publishing and the send queue", () => {
  it("advertises on the first publish, once per topic, and holds messages until the socket opens", () => {
    const { bridge, ros } = setup()
    ros.connect()
    const a = ros.publisher("/initialpose", "geometry_msgs/PoseWithCovarianceStamped")
    const b = ros.publisher("/initialpose", "geometry_msgs/PoseWithCovarianceStamped")
    expect(a.publish({ n: 1 })).toBe(true)
    expect(b.publish({ n: 2 })).toBe(true)
    expect(bridge.last.sent).toHaveLength(0)
    bridge.last.open()
    // A topic is state: only the newest held message on it goes out.
    expect(bridge.last.sent.map((f) => f.op)).toEqual(["advertise", "publish"])
    expect(bridge.last.sent[1]).toMatchObject({ topic: "/initialpose", msg: { n: 2 } })
  })

  it("drops held messages older than queueTtlMs", () => {
    const { bridge, ros } = setup({ queueTtlMs: 1000 })
    ros.connect()
    ros.publisher("/a", "std_msgs/String").publish({ data: "old" })
    vi.advanceTimersByTime(1500)
    ros.publisher("/b", "std_msgs/String").publish({ data: "new" })
    bridge.last.open()
    expect(bridge.ops("publish").map((f) => f.topic)).toEqual(["/b"])
  })

  it("holds at most maxQueue messages, oldest dropped first", () => {
    const { bridge, ros } = setup({ maxQueue: 2 })
    ros.connect()
    for (const t of ["/a", "/b", "/c"]) ros.publisher(t, "std_msgs/String").publish({ data: t })
    bridge.last.open()
    expect(bridge.ops("publish").map((f) => f.topic)).toEqual(["/b", "/c"])
  })

  it("unadvertises 500 ms after the last publisher releases, unless one takes the topic back", () => {
    const { bridge, ros } = opened()
    const p = ros.publisher("/goal_pose", "geometry_msgs/PoseStamped")
    p.publish({})
    p.release()
    vi.advanceTimersByTime(499)
    p.publish({})
    vi.advanceTimersByTime(1000)
    expect(bridge.ops("unadvertise")).toHaveLength(0)
    expect(bridge.ops("advertise")).toHaveLength(1)
    p.release()
    vi.advanceTimersByTime(500)
    expect(bridge.ops("unadvertise")).toEqual([{ op: "unadvertise", id: bridge.ops("advertise")[0]!.id, topic: "/goal_pose" }])
  })
})

describe("services", () => {
  it("resolves with the response values, matched by id", async () => {
    const { bridge, ros } = opened()
    const done = ros.call("/rosapi/topics", {}, { type: "rosapi/Topics" })
    const req = bridge.ops("call_service")[0]!
    expect(req).toMatchObject({ service: "/rosapi/topics", type: "rosapi/Topics", args: {} })
    bridge.last.emit({ op: "service_response", id: "someone-else", service: "/rosapi/topics", result: true, values: {} })
    bridge.last.emit({ op: "service_response", id: req.id, service: "/rosapi/topics", result: true, values: { topics: ["/map"] } })
    await expect(done).resolves.toEqual({ topics: ["/map"] })
  })

  it("rejects with RosServiceError when the service fails", async () => {
    const { bridge, ros } = opened()
    const done = ros.call("/reset", {})
    bridge.last.emit({ op: "service_response", id: bridge.ops("call_service")[0]!.id, service: "/reset", result: false, values: "Service /reset does not exist" })
    await expect(done).rejects.toBeInstanceOf(RosServiceError)
    await expect(done).rejects.toThrow(/does not exist/)
  })

  it("rejects with RosTimeoutError after timeoutMs, and ignores a late answer", async () => {
    const { bridge, ros } = opened()
    const done = ros.call("/slow", {}, { timeoutMs: 2000 })
    const caught = done.catch((e: unknown) => e)
    vi.advanceTimersByTime(2000)
    expect(await caught).toBeInstanceOf(RosTimeoutError)
    bridge.last.emit({ op: "service_response", id: bridge.ops("call_service")[0]!.id, service: "/slow", result: true, values: {} })
  })

  it("holds a call made while connecting and sends it on open; its clock runs meanwhile", async () => {
    const { bridge, ros } = setup()
    ros.connect()
    const done = ros.call("/get", { a: 1 }, { timeoutMs: 1000 })
    bridge.last.open()
    expect(bridge.ops("call_service")).toHaveLength(1)
    bridge.last.emit({ op: "service_response", id: bridge.ops("call_service")[0]!.id, service: "/get", result: true, values: { ok: true } })
    await expect(done).resolves.toEqual({ ok: true })

    const late = ros.call("/never", {}, { timeoutMs: 1000 })
    const caught = late.catch((e: unknown) => e)
    bridge.last.drop()
    expect(await caught).toBeInstanceOf(RosConnectionError)
  })

  it("times out a call held for a connection that never comes", async () => {
    const { bridge, ros } = setup()
    ros.connect()
    const caught = ros.call("/get", {}, { timeoutMs: 1000 }).catch((e: unknown) => e)
    vi.advanceTimersByTime(1000)
    expect(await caught).toBeInstanceOf(RosTimeoutError)
    bridge.last.open()
    expect(bridge.ops("call_service")).toHaveLength(0)
  })
})

describe("heartbeat", () => {
  it("measures latency by calling /rosapi/get_time", async () => {
    const { bridge, ros } = opened({ heartbeat: { intervalMs: 1000 } })
    vi.advanceTimersByTime(1000)
    const req = bridge.ops("call_service")[0]!
    expect(req).toMatchObject({ service: "/rosapi/get_time", type: "rosapi/GetTime" })
    vi.advanceTimersByTime(40)
    bridge.last.emit({ op: "service_response", id: req.id, service: "/rosapi/get_time", result: true, values: {} })
    await flush()
    expect(ros.getStatus().latencyMs).toBe(40)
  })

  it("closes a link that stopped answering and reconnects", async () => {
    const { bridge, ros } = opened({ heartbeat: { intervalMs: 1000, timeoutMs: 500 } })
    const first = bridge.last
    vi.advanceTimersByTime(1500)
    await flush()
    expect(first.closedByClient).toBe(true)
    expect(ros.getStatus().state).toBe("error")
    expect(ros.getStatus().error?.message).toMatch(/heartbeat/)
  })
})

describe("cmd_vel safety", () => {
  const cmdVel = (ros: ReturnType<typeof setup>["ros"]) => ros.publisher<RosTwist>("/cmd_vel", "geometry_msgs/Twist")
  const twists = (bridge: ReturnType<typeof setup>["bridge"]) => bridge.ops("publish").map((f) => (isZeroTwist(f.msg as RosTwist) ? "zero" : "drive"))

  it("sends a zero Twist when the publisher is released mid-drive, then unadvertises", () => {
    const { bridge, ros } = opened()
    const p = cmdVel(ros)
    p.publish(drive)
    p.release()
    expect(twists(bridge)).toEqual(["drive", "zero"])
    expect(bridge.ops("publish")[1]!.msg).toEqual(zeroTwist())
    vi.advanceTimersByTime(500)
    expect(bridge.ops("unadvertise")).toHaveLength(1)
  })

  it("sends no extra zero when the last command was already a stop", () => {
    const { bridge, ros } = opened()
    const p = cmdVel(ros)
    p.publish(drive)
    p.publish(zeroTwist())
    p.release()
    expect(twists(bridge)).toEqual(["drive", "zero"])
  })

  it("never holds a drive command for later: dropped while connecting", () => {
    const { bridge, ros } = setup()
    ros.connect()
    const p = cmdVel(ros)
    expect(p.publish(drive)).toBe(false)
    bridge.last.open()
    expect(twists(bridge)).toEqual([])
  })

  it("after a dropped link: the first thing sent is a zero, and driving waits for a fresh stop from the app", () => {
    const { bridge, ros } = opened()
    const p = cmdVel(ros)
    p.publish(drive)
    bridge.last.drop()
    // The stick is still held while the link is down: nothing is held for later.
    expect(p.publish(drive)).toBe(false)
    vi.advanceTimersByTime(10_000)
    const second = bridge.last
    second.open()
    expect(second.sent.map((f) => f.op)).toEqual(["advertise", "publish"])
    expect(second.sent[1]!.msg).toEqual(zeroTwist())
    // Still held after the link is back: refused until the operator lets go.
    expect(p.publish(drive)).toBe(false)
    expect(p.publish(zeroTwist())).toBe(true)
    expect(p.publish(drive)).toBe(true)
    expect(twists(bridge)).toEqual(["drive", "zero", "zero", "drive"])
  })

  it("stop('hidden') sends a zero mid-drive and disarms; it does nothing when already stopped", () => {
    const { bridge, ros } = opened()
    const p = cmdVel(ros)
    p.stop("hidden")
    expect(twists(bridge)).toEqual([])
    p.publish(drive)
    p.stop("hidden")
    expect(twists(bridge)).toEqual(["drive", "zero"])
    expect(p.publish(drive)).toBe(false)
  })

  it("close() sends a zero before it closes the socket", () => {
    const { bridge, ros } = opened()
    const s = bridge.last
    cmdVel(ros).publish(drive)
    ros.close()
    expect(twists(bridge)).toEqual(["drive", "zero"])
    expect(s.closedByClient).toBe(true)
  })

  it("treats a Twist with left-out fields as a stop, and TwistStamped the same way", () => {
    const { bridge, ros } = opened()
    const stamped = ros.publisher("/cmd_vel_stamped", "geometry_msgs/msg/TwistStamped")
    stamped.publish({ header: { frame_id: "base_link" }, twist: drive })
    stamped.release()
    expect(bridge.ops("publish")[1]!.msg).toEqual({ header: { frame_id: "" }, twist: zeroTwist() })
    expect(isZeroTwist({ linear: { x: 0 } } as RosTwist)).toBe(true)
  })

  it("stopMessage gives another type a stop, and null turns it off", () => {
    const { bridge, ros } = opened()
    const custom = ros.publisher<{ speed: number }>("/speed", "my_msgs/Speed", { stopMessage: { speed: 0 } })
    custom.publish({ speed: 3 })
    custom.release()
    expect(bridge.ops("publish").map((f) => f.msg)).toEqual([{ speed: 3 }, { speed: 0 }])
    const off = ros.publisher<RosTwist>("/cmd_vel2", "geometry_msgs/Twist", { stopMessage: null })
    off.publish(drive)
    off.release()
    expect(bridge.ops("publish")).toHaveLength(3)
  })
})

// --- Converters -------------------------------------------------------------------------------------------------------

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))

describe("occupancyGridToGrid", () => {
  const info = { resolution: 0.05, width: 3, height: 2, origin: { position: { x: -1, y: -2, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } } }

  it("reads data as numbers, keeps row 0 at the bottom, and robot-map draws row 0 last", () => {
    // Row 0 (bottom): free, occupied, unknown. Row 1 (top): all occupied.
    const grid: RobotMapGrid = occupancyGridToGrid({ info, data: [0, 100, -1, 100, 100, 100] })
    expect(grid).toMatchObject({ width: 3, height: 2, resolution: 0.05, origin: { x: -1, y: -2 } })
    expect([...grid.data]).toEqual([0, 100, -1, 100, 100, 100])
    const rgba = rasteriseGrid(grid)
    // The image's top row is the grid's last row: all occupied (opaque white).
    expect(rgba[3]).toBe(255)
    // Its bottom-left pixel is the grid's first cell: free (transparent).
    expect(rgba[3 * 4 + 3]).toBe(0)
    expect(gridToPlan(grid)).toEqual({ width: 0.15000000000000002, height: 0.1, origin: { x: -1, y: -2 } })
  })

  it("reads base64 bytes as signed, so 255 is unknown (−1)", () => {
    const grid = occupancyGridToGrid({ info, data: b64(new Uint8Array([0, 100, 255, 50, 0, 0])) })
    expect([...grid.data]).toEqual([0, 100, -1, 50, 0, 0])
  })
})

describe("laserScanToScan", () => {
  it("turns null (NaN or ±Infinity in JSON) into NaN, which robot-map skips with the out-of-range readings", () => {
    const msg = parseRosJson(
      '{"angle_min":-1.5707963,"angle_max":1.5707963,"angle_increment":1.5707963,"range_min":0.1,"range_max":10,"ranges":[1,NaN,Infinity,0.05,2]}',
    ) as Parameters<typeof laserScanToScan>[0]
    const scan: RobotMapScan = laserScanToScan(msg, "amr-7")
    expect(scan.robotId).toBe("amr-7")
    expect(Number.isNaN(scan.ranges[1])).toBe(true)
    expect(Number.isNaN(scan.ranges[2])).toBe(true)
    const pts = scanToPoints(scan, { x: 5, y: 5, heading: 0 })
    // Beams 0 (right of the robot, 1 m) and 4 (out of the array: only 3 angles), beam 3 is under range_min.
    expect(pts).toHaveLength(2)
    expect(pts[0]![0]).toBeCloseTo(6)
    expect(pts[0]![1]).toBeCloseTo(5)
  })

  it("keeps a real Infinity, which robot-map also skips", () => {
    const scan = laserScanToScan({ angle_min: 0, angle_increment: 0.1, range_min: 0, range_max: 5, ranges: [Infinity, 1] }, "r")
    expect(scanToPoints(scan, { x: 0, y: 0, heading: 90 })).toHaveLength(1)
  })
})

/** A PointCloud2 the way a driver packs one: x, y, z float32 at 0, 4, 8, intensity at 16, 32-byte points, padded rows. */
function cloud(points: [number, number, number, number][], options: { big?: boolean; width?: number; pad?: number; intensityType?: number } = {}): RosPointCloud2 {
  const { big = false, width = points.length, pad = 0, intensityType = 7 } = options
  const height = Math.ceil(points.length / width)
  const step = 32
  const rowStep = width * step + pad
  const buf = new DataView(new ArrayBuffer(rowStep * height))
  points.forEach(([x, y, z, i], n) => {
    const at = Math.floor(n / width) * rowStep + (n % width) * step
    buf.setFloat32(at, x, !big)
    buf.setFloat32(at + 4, y, !big)
    buf.setFloat32(at + 8, z, !big)
    if (intensityType === 7) buf.setFloat32(at + 16, i, !big)
    else buf.setUint16(at + 16, i, !big)
  })
  return {
    height,
    width,
    fields: [
      { name: "x", offset: 0, datatype: 7, count: 1 },
      { name: "y", offset: 4, datatype: 7, count: 1 },
      { name: "z", offset: 8, datatype: 7, count: 1 },
      { name: "intensity", offset: 16, datatype: intensityType, count: 1 },
    ],
    is_bigendian: big,
    point_step: step,
    row_step: rowStep,
    data: b64(new Uint8Array(buf.buffer)),
    is_dense: false,
  }
}

describe("pointCloud2ToPoints", () => {
  const pts: [number, number, number, number][] = [
    [1, 2, 3, 10],
    [NaN, NaN, NaN, 0],
    [-1.5, 0.25, 0.5, 200],
    [4, Infinity, 0, 5],
  ]

  it("reads little-endian float32 x, y, z and intensity, and skips NaN and infinite points", () => {
    const { points, intensity } = pointCloud2ToPoints(cloud(pts))
    expect([...points]).toEqual([1, 2, 3, -1.5, 0.25, 0.5])
    expect([...intensity!]).toEqual([10, 200])
  })

  it("reads big-endian the same", () => {
    const { points, intensity } = pointCloud2ToPoints(cloud(pts, { big: true }))
    expect([...points]).toEqual([1, 2, 3, -1.5, 0.25, 0.5])
    expect([...intensity!]).toEqual([10, 200])
  })

  it("follows row_step past padding at the end of each row of an organised cloud", () => {
    const { points } = pointCloud2ToPoints(cloud(pts, { width: 2, pad: 12 }))
    expect([...points]).toEqual([1, 2, 3, -1.5, 0.25, 0.5])
  })

  it("reads an integer intensity field, and leaves intensity out when asked or absent", () => {
    expect([...pointCloud2ToPoints(cloud(pts, { intensityType: 4 })).intensity!]).toEqual([10, 200])
    expect(pointCloud2ToPoints(cloud(pts), { intensityField: null }).intensity).toBeUndefined()
    const noI = cloud(pts)
    noI.fields = noI.fields.slice(0, 3)
    expect(pointCloud2ToPoints(noI).intensity).toBeUndefined()
  })

  it("reads data sent as a list of numbers, and skips a point cut short", () => {
    const msg = cloud([[1, 1, 1, 1]])
    const bytes = Uint8Array.from(atob(msg.data as string), (c) => c.charCodeAt(0))
    expect([...pointCloud2ToPoints({ ...msg, data: Array.from(bytes) }).points]).toEqual([1, 1, 1])
    expect(pointCloud2ToPoints({ ...msg, data: Array.from(bytes.slice(0, 10)) }).points).toHaveLength(0)
  })

  it("throws without x, y and z", () => {
    expect(() => pointCloud2ToPoints({ ...cloud(pts), fields: [] })).toThrow(/x, y and z/)
  })
})

describe("poses", () => {
  const frame = { width: 20, height: 10, origin: { x: -5, y: -2 } }

  it("reads yaw from a quaternion", () => {
    expect(quaternionToYaw({ x: 0, y: 0, z: 0, w: 1 })).toBe(0)
    expect(quaternionToYaw(yawToQuaternion(Math.PI / 2))).toBeCloseTo(Math.PI / 2)
    expect(quaternionToYaw(yawToQuaternion(-2.5))).toBeCloseTo(-2.5)
  })

  it("puts /amcl_pose (PoseWithCovarianceStamped) on the plan: facing +x is heading 90, facing +y heading 0", () => {
    const amcl = { header: { frame_id: "map" }, pose: { pose: { position: { x: 0, y: 3, z: 0 }, orientation: yawToQuaternion(0) }, covariance: [] } }
    const p: RobotMapPose = poseToRobotMapPose(amcl, frame)
    expect(p).toEqual({ x: 5, y: 5, heading: 90 })
    expect(poseToRobotMapPose({ position: { x: 0, y: 3 }, orientation: yawToQuaternion(Math.PI / 2) }, frame).heading).toBeCloseTo(0)
    expect(poseToRobotMapPose({ position: { x: 0, y: 3 }, orientation: yawToQuaternion(-Math.PI / 2) }, frame).heading).toBeCloseTo(180)
  })

  it("matches robot-map's rosToPlan for any pose", () => {
    for (let i = 0; i < 50; i++) {
      const x = Math.sin(i) * 30
      const y = Math.cos(i * 1.7) * 30
      const yaw = ((i * 0.77) % (2 * Math.PI)) - Math.PI
      const ours = poseToRobotMapPose({ pose: { position: { x, y }, orientation: yawToQuaternion(yaw) } }, frame)
      const theirs = rosToPlan(frame, { x, y, yaw })
      expect(ours.x).toBeCloseTo(theirs.x, 9)
      expect(ours.y).toBeCloseTo(theirs.y, 9)
      // Headings may land on either side of 0/360.
      const d = Math.abs((ours.heading! - theirs.heading! + 540) % 360 - 180)
      expect(d).toBeLessThan(1e-6)
    }
  })

  it("turns a goal on the plan into a PoseStamped in the map frame, the inverse of the above", () => {
    const goal = goalToPoseStamped({ x: 5, y: 5, heading: 0 }, frame)
    expect(goal.header).toEqual({ frame_id: "map" })
    expect(goal.pose.position).toEqual({ x: 0, y: 3, z: 0 })
    expect(quaternionToYaw(goal.pose.orientation)).toBeCloseTo(Math.PI / 2)
    const back = poseToRobotMapPose(goal, frame)
    expect(back.x).toBeCloseTo(5)
    expect(back.y).toBeCloseTo(5)
    expect(back.heading).toBeCloseTo(0)
    expect(goalToPoseStamped({ x: 1, y: 1 }, frame, { frameId: "site", stamp: { sec: 1, nanosec: 0 } }).header).toEqual({ frame_id: "site", stamp: { sec: 1, nanosec: 0 } })
    expect(goalToPoseStamped({ x: 1, y: 1 }, frame).pose.orientation).toEqual({ x: 0, y: 0, z: 0, w: 1 })
  })
})

describe("teleopToTwist", () => {
  it("scales the pad's −1…1 by the robot's top speeds, REP 103 (forward and left are +)", () => {
    expect(teleopToTwist({ linear: 0.5, angular: -1 }, { maxLinear: 1.2, maxAngular: 2 })).toEqual({
      linear: { x: 0.6, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: -2 },
    })
  })

  it("clamps and cleans: past ±1, NaN and −0", () => {
    const t = teleopToTwist({ linear: 3, angular: NaN }, { maxLinear: 1, maxAngular: 1 })
    expect(t.linear.x).toBe(1)
    expect(t.angular.z).toBe(0)
    const stop = teleopToTwist({ linear: -0, angular: 0 }, { maxLinear: 1, maxAngular: 1 })
    expect(Object.is(stop.linear.x, 0)).toBe(true)
    expect(stop).toEqual(zeroTwist())
  })
})

describe("jointStateToJoints", () => {
  const msg = { name: ["elbow", "shoulder", "gripper"], position: [1.2, -0.3, null], velocity: [0.1, 0, 0], effort: [] }

  it("adds the URDF's limits, keeps SI units, and leaves out a joint with no position", () => {
    const joints: JointStateJoint[] = jointStateToJoints(msg, { limits: { elbow: { lower: -3.14, upper: 3.14 } } })
    expect(joints).toEqual([
      { name: "elbow", position: 1.2, lower: -3.14, upper: 3.14, velocity: 0.1 },
      { name: "shoulder", position: -0.3, velocity: 0 },
    ])
  })

  it("lists and orders by `order`", () => {
    expect(jointStateToJoints(msg, { order: ["shoulder", "elbow", "wrist"] }).map((j) => j.name)).toEqual(["shoulder", "elbow"])
  })
})

describe("diagnosticArrayToStatuses", () => {
  it("maps levels, hardware_id and values, and stamps each with receivedAt", () => {
    const statuses: DiagnosticStatus[] = diagnosticArrayToStatuses(
      {
        header: { stamp: { sec: 1, nanosec: 0 } },
        status: [
          { level: 0, name: "/Power/Battery", message: "OK", hardware_id: "bms", values: [{ key: "Voltage", value: "51.2" }] },
          { level: 1, name: "/Motors/Lift", message: "Hot", hardware_id: "", values: [] },
          { level: 2, name: "/Motors/Left wheel", message: "Overcurrent" },
          { level: 3, name: "/Sensors/Lidar", message: "" },
        ],
      },
      { receivedAt: 42 },
    )
    expect(statuses).toEqual([
      { name: "/Power/Battery", level: "ok", message: "OK", hardwareId: "bms", values: [{ key: "Voltage", value: "51.2" }], receivedAt: 42 },
      { name: "/Motors/Lift", level: "warn", message: "Hot", receivedAt: 42 },
      { name: "/Motors/Left wheel", level: "error", message: "Overcurrent", receivedAt: 42 },
      { name: "/Sensors/Lidar", level: "stale", receivedAt: 42 },
    ])
  })

  it("reads the level byte however the bridge wrote it, and an unknown one as stale", () => {
    const level = (l: number | string) => diagnosticArrayToStatuses({ status: [{ level: l, name: "x" }] }, { receivedAt: 0 })[0]!.level
    expect(level("Ag==")).toBe("error")
    expect(level("\u0001")).toBe("warn")
    expect(level("2")).toBe("error")
    expect(level(7)).toBe("stale")
    expect(level(-1)).toBe("stale")
    expect(level("not base64!")).toBe("stale")
  })

  it("stamps with the clock when no receivedAt is given", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(1_800_000_000_000)
    expect(diagnosticArrayToStatuses({ status: [{ level: 0, name: "x" }] })[0]!.receivedAt).toBe(1_800_000_000_000)
    vi.useRealTimers()
  })

  it("mergeDiagnostics keeps each name's latest status in its first place", () => {
    const a = [
      { name: "/A", level: "ok" as const },
      { name: "/B", level: "ok" as const },
    ]
    expect(mergeDiagnostics(a, [])).toBe(a)
    expect(mergeDiagnostics(a, [{ name: "/C", level: "warn" }, { name: "/A", level: "error" }])).toEqual([
      { name: "/A", level: "error" },
      { name: "/B", level: "ok" },
      { name: "/C", level: "warn" },
    ])
  })
})

describe("stampToMs", () => {
  it("reads ROS 2 and ROS 1 stamps", () => {
    expect(stampToMs({ sec: 1700000000, nanosec: 500_000_000 })).toBe(1700000000500)
    expect(stampToMs({ secs: 2, nsecs: 1_000_000 })).toBe(2001)
    expect(stampToMs(undefined)).toBeUndefined()
  })
})

describe("rosLogToLogLine", () => {
  it("reads a ROS 2 rcl_interfaces/msg/Log as a log-viewer line", () => {
    const msg = { stamp: { sec: 1700000000, nanosec: 250_000_000 }, level: 40, name: "planner_server", msg: "No valid path", file: "planner_server.cpp", function: "computePlan", line: 466 }
    const line: LogLine = rosLogToLogLine(msg)
    expect(line).toEqual({ time: 1700000000250, level: "error", source: "planner_server", message: "No valid path", file: "planner_server.cpp", function: "computePlan", line: 466 })
    expect([10, 20, 30, 40, 50].map((level) => rosLogToLogLine({ ...msg, level }).level)).toEqual(["debug", "info", "warn", "error", "fatal"])
    // A level between the named ones takes the one below it.
    expect(rosLogToLogLine({ ...msg, level: 35 }).level).toBe("warn")
  })

  it("reads a ROS 1 rosgraph_msgs/Log, its header stamp and topics", () => {
    const msg = { header: { stamp: { secs: 2, nsecs: 1_000_000 } }, level: 4, name: "/amcl", msg: "No laser scan received", file: "", function: "", line: 0, topics: ["/rosout", "/amcl_pose"] }
    expect(rosLogToLogLine(msg)).toEqual({ time: 2001, level: "warn", source: "/amcl", message: "No laser scan received", fields: { topics: "/rosout, /amcl_pose" } })
    expect([1, 2, 4, 8, 16].map((level) => rosLogToLogLine({ ...msg, level }).level)).toEqual(["debug", "info", "warn", "error", "fatal"])
  })

  it("falls back to when it was received for a message with no stamp", () => {
    expect(rosLogToLogLine({ level: 20, msg: "ok" }, { receivedAt: 5 })).toEqual({ time: 5, level: "info", message: "ok" })
  })
})

describe("webVideoServerSrc", () => {
  it("builds the web_video_server URL a video plays for an image topic, sized by the wall's quality", () => {
    expect(webVideoServerSrc("http://robot-7f3a.local:8080/", "/front/image_raw")).toBe(
      "http://robot-7f3a.local:8080/stream?topic=%2Ffront%2Fimage_raw&type=vp8&width=640&height=360&bitrate=300000",
    )
    const high = new URL(webVideoServerSrc("http://robot:8080", "/front/image_raw", { quality: "high", type: "h264", transport: "compressed" }))
    expect(Object.fromEntries(high.searchParams)).toEqual({
      topic: "/front/image_raw",
      type: "h264",
      width: "1280",
      height: "720",
      bitrate: "2000000",
      default_transport: "compressed",
    })
    expect(new URL(webVideoServerSrc("http://robot:8080", "/cam", { width: 320, height: 240 })).searchParams.get("width")).toBe("320")
  })
})
