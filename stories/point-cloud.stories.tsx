import type { Meta, StoryObj } from "@storybook/react"
import { PointCloud } from "@/registry/syncrobotic/ui/point-cloud"

const meta: Meta = { title: "Charts/Point cloud" }
export default meta
type S = StoryObj

// A synthetic warehouse scan, as a robot's LiDAR at the origin would see it in its own frame (x forward, y left, z up):
// the floor, two racks along the aisle with boxes on their shelves, a person standing in the aisle, and the back wall.
// A seeded random generator makes every load (and every screenshot) the same cloud. Intensity is what a real sensor
// returns: low on concrete, middling on painted steel and cardboard, high on the reflective tape round the uprights.
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Scan = { points: Float32Array; intensity: Float32Array }

function makeWarehouse(total = 100_000): Scan {
  const rand = seeded(7)
  const noise = (s: number) => (rand() - 0.5) * s
  const points = new Float32Array(total * 3)
  const intensity = new Float32Array(total)
  let n = 0
  const add = (x: number, y: number, z: number, i: number) => {
    if (n >= total) return
    points[n * 3] = x + noise(0.02)
    points[n * 3 + 1] = y + noise(0.02)
    points[n * 3 + 2] = z + noise(0.02)
    intensity[n] = Math.max(0, i + noise(12))
    n++
  }
  const racks = [-3.2, 3.2]
  // Some draws fall outside the room and are dropped, so it keeps drawing until it has the points it was asked for.
  for (let k = 0; n < total && k < total * 4; k++) {
    const r = rand()
    if (r < 0.36) {
      // The floor, denser near the sensor, as a spinning LiDAR's rings are.
      const d = 0.8 + 17 * rand() ** 1.6
      const a = (rand() - 0.5) * Math.PI * 0.9
      const x = d * Math.cos(a)
      const y = d * Math.sin(a)
      if (Math.abs(y) < 4.2 && x < 18) add(x, y, 0, 28)
    } else if (r < 0.8) {
      // The racks: uprights every 2.7 m with reflective tape, beams at three levels, boxes on the beams.
      const side = racks[rand() < 0.5 ? 0 : 1]!
      const face = side - Math.sign(side) * 0.45
      const x = 2 + rand() * 14
      const part = rand()
      if (part < 0.25) {
        const post = 2 + Math.round((x - 2) / 2.7) * 2.7
        const z = rand() * 3.2
        add(post, face, z, z > 0.4 && z < 0.7 ? 230 : 95)
      } else if (part < 0.45) {
        const level = [0.15, 1.2, 2.25][Math.floor(rand() * 3)]!
        add(x, face, level + rand() * 0.12, 90)
      } else {
        const level = [0.27, 1.32, 2.37][Math.floor(rand() * 3)]!
        const bay = Math.floor((x - 2) / 1.35)
        // Some bays are empty, so the shelves read as shelves.
        if ((bay * 7 + (side > 0 ? 3 : 0)) % 5 === 0) continue
        add(x, face + Math.sign(side) * rand() * 0.05, level + rand() * 0.75, 55)
      }
    } else if (r < 0.86) {
      // A person in the aisle: a 1.75 m cylinder, 0.25 m across, seen from the sensor's side only.
      const a = Math.PI + (rand() - 0.5) * Math.PI
      add(6.5 + 0.25 * Math.cos(a), 0.8 + 0.25 * Math.sin(a), rand() * 1.75, 62)
    } else {
      // The back wall.
      add(18, (rand() - 0.5) * 8.4, rand() * 4.5, 40)
    }
  }
  return { points: points.subarray(0, n * 3), intensity: intensity.subarray(0, n) }
}

let scan: Scan | null = null
const warehouse = () => (scan ??= makeWarehouse())

// When the last scan arrived in the stale story: well in the past, at a fixed local time, so its line always reads 14:02:31.
const LAST_SCAN = new Date(2026, 0, 5, 14, 2, 31).getTime()

// The no-WebGL story: this browser has WebGL, so it is taken away for canvases inside the marked wrapper only, and every
// other example on the same page keeps its own.
if (typeof HTMLCanvasElement !== "undefined") {
  const proto = HTMLCanvasElement.prototype as HTMLCanvasElement & { __pointCloudDemo?: boolean }
  if (!proto.__pointCloudDemo) {
    const original = proto.getContext
    proto.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === "webgl2" && this.closest("[data-demo-no-webgl]")) return null
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest)
    } as typeof original
    proto.__pointCloudDemo = true
  }
}

/** About 100,000 points of a warehouse aisle, coloured by height: the floor lightest, the top shelves the full accent. */
export const PointCloudByHeight: S = {
  render: () => {
    const { points } = warehouse()
    return <PointCloud label="Front lidar, Forklift 2" points={points} colorBy="height" robot />
  },
}

/** The same scan by intensity: the reflective tape on the uprights stands out from concrete and cardboard. */
export const PointCloudByIntensity: S = {
  render: () => {
    const { points, intensity } = warehouse()
    return <PointCloud label="Front lidar, Forklift 2" points={points} intensity={intensity} colorBy="intensity" robot />
  },
}

/** Waiting for the first cloud: the view keeps its size. */
export const PointCloudLoading: S = {
  render: () => <PointCloud label="Front lidar, Forklift 2" points={new Float32Array(0)} loading />,
}

/** The sensor sent a cloud with nothing in range. */
export const PointCloudEmpty: S = {
  render: () => <PointCloud label="Front lidar, Forklift 2" points={new Float32Array(0)} />,
}

/** The cloud could not be loaded: what failed, and Load again because trying again can help. */
export const PointCloudError: S = {
  render: () => <PointCloud label="Front lidar, Forklift 2" points={new Float32Array(0)} error="The scan file could not be read: it ended early." onRetry={() => {}} />,
}

/** No new cloud for longer than staleAfterMs: the last one stays, dimmed, with when it arrived. Never a silent freeze. */
export const PointCloudStale: S = {
  render: () => {
    const { points } = warehouse()
    return <PointCloud label="Front lidar, Forklift 2" points={points} colorBy="height" robot staleAfterMs={2000} receivedAt={LAST_SCAN} />
  },
}

/** A browser without WebGL2 (simulated here): it says so in words, and screen readers still get the count and extent. */
export const PointCloudNoWebGL: S = {
  render: () => {
    const { points } = warehouse()
    return (
      <div data-demo-no-webgl="">
        <PointCloud label="Front lidar, Forklift 2" points={points} robot />
      </div>
    )
  },
}
