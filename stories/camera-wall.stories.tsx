import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import type { CameraFeedLabels } from "@/registry/syncrobotic/ui/camera-feed"
import { CameraWall, type CameraWallCamera } from "@/registry/syncrobotic/ui/camera-wall"

const meta: Meta = { title: "Display/Camera wall" }
export default meta
type S = StoryObj

// Every camera is drawn in code and streamed with canvas.captureStream(), as in the camera-feed stories: real
// MediaStreams, so each tile watches real frames arrive, with no network. Each robot's picture differs (shade, racks, where
// its forklift is) and carries its own number in the burnt-in clock.
//
// The screenshot run (and anyone who asked for reduced motion) gets stills: each picture at 14:02:31, sent again every
// 100 ms, so every tile stays Live and every screenshot is the same. A camera that hangs stops once its tile has shown
// a frame (the "shown" signal camera-feed itself watches), so Stalled does not depend on how fast the machine is.
const STILL_AT = 14 * 3600 + 2 * 60 + 31
const still = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const clock = (seconds: number) =>
  [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, Math.floor(seconds) % 60].map((n) => String(n).padStart(2, "0")).join(":")
// tokens-ok: a camera picture, not UI
const grey = (v: number) => `rgb(${v} ${v} ${v})`

function drawScene(ctx: CanvasRenderingContext2D, n: number, t: number) {
  const w = 640
  const h = 360
  ctx.save()
  ctx.scale(ctx.canvas.width / w, ctx.canvas.height / h)
  const shade = 190 + (n % 4) * 8
  ctx.fillStyle = grey(shade)
  ctx.fillRect(0, 0, w, h)
  const rack = 120 + (n % 3) * 40
  ctx.fillStyle = grey(140 + (n % 5) * 6)
  ctx.fillRect(0, 40, rack, 230)
  ctx.fillRect(w - rack, 40, rack, 230)
  ctx.fillStyle = grey(176)
  for (let y = 80 + (n % 2) * 20; y < 270; y += 60) {
    ctx.fillRect(10, y, rack - 20, 36)
    ctx.fillRect(w - rack + 10, y, rack - 20, 36)
  }
  ctx.fillStyle = grey(222)
  ctx.beginPath()
  ctx.moveTo(rack, 270)
  ctx.lineTo(w - rack, 270)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.fill()
  ctx.strokeStyle = grey(188)
  ctx.lineWidth = 2
  for (let i = 0; i <= 6; i++) {
    ctx.beginPath()
    ctx.moveTo(rack + ((w - 2 * rack) * i) / 6, 270)
    ctx.lineTo((w * i) / 6, h)
    ctx.stroke()
  }
  // A forklift crossing the aisle, each camera at its own point of the crossing.
  const phase = ((t + n * 1.7) % 12) / 12
  const x = rack + 10 + (w - 2 * rack - 80) * (phase < 0.5 ? phase * 2 : 2 - phase * 2)
  ctx.fillStyle = grey(70)
  ctx.fillRect(x, 220, 60, 50)
  ctx.fillRect(x + 60, 190, 6, 80)
  ctx.fillStyle = grey(110)
  ctx.fillRect(x + 8, 200, 34, 20)
  ctx.fillStyle = grey(30)
  ctx.font = "20px monospace"
  ctx.fillText(`CAM ${n + 1}  ${clock(t)}`, 14, 28)
  ctx.restore()
}

type Wall = { streams: Record<string, MediaStream>; posters: Record<string, string> }

/** The drawn cameras as an external store: subscribing starts every stream, unsubscribing stops them. */
function wallStore(ids: string[], hang: string[]) {
  let wall: Wall | null = null
  const subscribe = (onChange: () => void) => {
    const fixed = still()
    const startedAt = Date.now()
    const now = new Date()
    const startClock = fixed ? STILL_AT : now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const streams: Record<string, MediaStream> = {}
    const posters: Record<string, string> = {}
    const senders: (() => void)[] = []
    ids.forEach((id, n) => {
      const canvas = document.createElement("canvas")
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext("2d")
      if (!ctx || typeof canvas.captureStream !== "function") return
      const s = canvas.captureStream(0)
      const track = s.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }
      drawScene(ctx, n, startClock)
      // A snapshot the robot would serve: what a paused tile shows before it has a frame of its own.
      posters[id] = canvas.toDataURL("image/jpeg", 0.8)
      let shown = false
      let watching: HTMLVideoElement | undefined
      senders.push(() => {
        const elapsed = (Date.now() - startedAt) / 1000
        if (hang.includes(id)) {
          if (fixed ? shown : elapsed > 1.5) return
          const video = [...document.querySelectorAll("video")].find((v) => v.srcObject === s)
          if (video && video !== watching && typeof video.requestVideoFrameCallback === "function") {
            watching = video
            video.requestVideoFrameCallback(() => {
              shown = true
            })
          }
        }
        drawScene(ctx, n, startClock + (fixed ? 0 : elapsed))
        track.requestFrame?.()
      })
      streams[id] = s
    })
    const send = () => senders.forEach((f) => f())
    send()
    const timer = setInterval(send, 100)
    wall = { streams, posters }
    onChange()
    return () => {
      clearInterval(timer)
      Object.values(streams).forEach((s) => s.getTracks().forEach((t) => t.stop()))
      wall = null
    }
  }
  return { subscribe, getSnapshot: () => wall }
}

function useWall(ids: string[], hang: string[] = []) {
  const key = ids.join(",") + "|" + hang.join(",")
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the store is the same for the same cameras
  const store = React.useMemo(() => wallStore(ids, hang), [key])
  return React.useSyncExternalStore(store.subscribe, store.getSnapshot, () => null)
}

const fleet: CameraWallCamera[] = [
  { id: "dog-7f3a", label: "Front camera", source: "Patrol dog 7F3A", latencyMs: 180 },
  { id: "fork-2", label: "Mast camera", source: "Forklift 2", latencyMs: 240, alarm: { priority: "critical", title: "Obstacle in path" } },
  { id: "bot-3", label: "Front camera", source: "Delivery bot 3", status: "offline", offlineReason: "The robot is out of network range." },
  { id: "amr-12", label: "Front camera", source: "AMR 12", latencyMs: 150 },
  { id: "amr-14", label: "Rear camera", source: "AMR 14", latencyMs: 160, alarm: { priority: "low", title: "Wheel slip" } },
  { id: "arm-1", label: "Wrist camera", source: "Picking arm 1", latencyMs: 90 },
  { id: "dog-2b10", label: "Front camera", source: "Patrol dog 2B10", latencyMs: 210 },
  { id: "tug-5", label: "Front camera", source: "Tugger 5", latencyMs: 170 },
  { id: "fork-4", label: "Mast camera", source: "Forklift 4", latencyMs: 230 },
  { id: "amr-21", label: "Front camera", source: "AMR 21", latencyMs: 140 },
  { id: "amr-22", label: "Front camera", source: "AMR 22", latencyMs: 145 },
  { id: "arm-2", label: "Wrist camera", source: "Picking arm 2", latencyMs: 95 },
  { id: "dock-1", label: "Dock camera", source: "Charging dock 1", latencyMs: 120 },
  { id: "dock-2", label: "Dock camera", source: "Charging dock 2", latencyMs: 125 },
  { id: "gate-n", label: "Gate camera", source: "North gate", latencyMs: 200 },
  { id: "gate-s", label: "Gate camera", source: "South gate", latencyMs: 205 },
]

/** In the still, every feed's clock is the drawn cameras', so a stalled tile's last frame matches its picture. */
const stillFeed = (): Partial<CameraFeedLabels> | undefined => (still() ? { formatTime: () => clock(STILL_AT) } : undefined)

function Demo({
  count,
  hang,
  posters = false,
  ...props
}: { count: number; hang?: string[]; posters?: boolean } & Omit<React.ComponentProps<typeof CameraWall>, "cameras" | "getSource">) {
  const cameras = fleet.slice(0, count)
  const wall = useWall(
    cameras.map((c) => c.id),
    hang,
  )
  return (
    <CameraWall
      cameras={cameras.map((c) => ({
        ...c,
        status: c.status ?? (wall ? undefined : "connecting"),
        poster: posters ? wall?.posters[c.id] : undefined,
      }))}
      // One stream per camera here; a product returns its low or high stream (or a web_video_server URL) by `quality`.
      getSource={(camera) => (wall ? { stream: wall.streams[camera.id] } : null)}
      labels={{ feed: stillFeed() }}
      {...props}
    />
  )
}

/** Nine robots, 3×3, attention first: the critical alarm, then the offline robot, then the low alarm, then by name. */
export const CameraWallGrid: S = {
  render: () => <Demo count={9} />,
}

/** One camera hangs: its tile dims the last frame and says when it arrived, and it moves up with the others that need attention. */
export const CameraWallStalled: S = {
  render: () => <Demo count={4} hang={["amr-12"]} staleAfterMs={1000} />,
}

/** Sixteen cameras, at most six streaming: the rest keep a still and say why they are not live. */
export const CameraWallBandwidth: S = {
  render: () => <Demo count={16} maxLive={6} posters />,
}

/** One camera large, asking for high quality, with the rest in a strip under it. Esc goes back to the grid. */
export const CameraWallFocused: S = {
  render: () => <Demo count={9} defaultFocused="fork-2" />,
}

/** Only the cameras that need someone: alarms, offline, stalled. */
export const CameraWallNeedsAttention: S = {
  render: () => <Demo count={16} defaultNeedsAttention />,
}
