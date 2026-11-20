import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"
import { CameraFeed, type CameraFeedLabels } from "@/registry/syncrobotic/ui/camera-feed"

const meta: Meta = { title: "Display/Camera feed" }
export default meta
type S = StoryObj

// A camera picture drawn in code, streamed with canvas.captureStream(): a real MediaStream, so the feed watches real frames
// arrive, as it would from WebRTC. A warehouse aisle, a forklift crossing it, and the camera's own clock burnt in.
//
// The screenshot run (and anyone who asked for reduced motion) gets a still: the same picture at 14:02:31, sent again
// every 100 ms (captureStream(0) and requestFrame), so the feed stays Live and every screenshot is the same. The feed's
// `formatTime` is that camera clock too, so "last frame 14:02:31" matches the picture whenever it runs.
const STILL_AT = 14 * 3600 + 2 * 60 + 31
const still = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const clock = (seconds: number) =>
  [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, Math.floor(seconds) % 60].map((n) => String(n).padStart(2, "0")).join(":")
// tokens-ok: a camera picture, not UI
const grey = (v: number) => `rgb(${v} ${v} ${v})`

function drawAisle(ctx: CanvasRenderingContext2D, t: number) {
  const { width: w, height: h } = ctx.canvas
  ctx.fillStyle = grey(206)
  ctx.fillRect(0, 0, w, h)
  // Racks on both sides, the floor in perspective.
  ctx.fillStyle = grey(150)
  ctx.fillRect(0, 40, 150, 230)
  ctx.fillRect(w - 150, 40, 150, 230)
  ctx.fillStyle = grey(178)
  for (let y = 80; y < 270; y += 60) {
    ctx.fillRect(10, y, 130, 36)
    ctx.fillRect(w - 140, y, 130, 36)
  }
  ctx.fillStyle = grey(224)
  ctx.beginPath()
  ctx.moveTo(150, 270)
  ctx.lineTo(w - 150, 270)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.fill()
  ctx.strokeStyle = grey(190)
  ctx.lineWidth = 2
  for (let i = 0; i <= 6; i++) {
    ctx.beginPath()
    ctx.moveTo(150 + ((w - 300) * i) / 6, 270)
    ctx.lineTo((w * i) / 6, h)
    ctx.stroke()
  }
  // A forklift crossing the aisle and back, every 12 s.
  const phase = (t % 12) / 12
  const x = 160 + (w - 380) * (phase < 0.5 ? phase * 2 : 2 - phase * 2)
  ctx.fillStyle = grey(70)
  ctx.fillRect(x, 220, 60, 50)
  ctx.fillRect(x + 60, 190, 6, 80)
  ctx.fillStyle = grey(110)
  ctx.fillRect(x + 8, 200, 34, 20)
  // The camera's clock.
  ctx.fillStyle = grey(30)
  ctx.font = "16px monospace"
  ctx.fillText(`CAM 1  ${clock(t)}`, 12, 24)
}

/** A live stream from a drawn camera. `stopAfter` (seconds) stops sending frames, as a camera that hangs does. */
function useDemoStream({ stopAfter }: { stopAfter?: number } = {}) {
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  React.useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 360
    const ctx = canvas.getContext("2d")
    if (!ctx || typeof canvas.captureStream !== "function") return
    const fixed = still()
    const startedAt = Date.now()
    const now = new Date()
    const startClock = fixed ? STILL_AT : now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const s = canvas.captureStream(0)
    const track = s.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }
    const send = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      if (stopAfter !== undefined && elapsed > (fixed ? 0 : stopAfter)) return
      drawAisle(ctx, startClock + (fixed ? 0 : elapsed))
      track.requestFrame?.()
    }
    send()
    const id = setInterval(send, 100)
    setStream(s)
    return () => {
      clearInterval(id)
      s.getTracks().forEach((t) => t.stop())
    }
  }, [stopAfter])
  return stream
}

/** In the still, the feed's clock is the drawn camera's, so the last frame's time matches the picture in the screenshot. */
const stillLabels = (): Partial<CameraFeedLabels> | undefined => (still() ? { formatTime: () => clock(STILL_AT) } : undefined)

/** A robot's front camera, live, with the latency the app measured. Snapshot saves the frame on screen. */
export const CameraFeedLive: S = {
  render: function Render() {
    const stream = useDemoStream()
    return (
      <CameraFeed
        label="Front camera"
        source="Patrol dog 7F3A"
        stream={stream}
        status={stream ? "live" : "connecting"}
        latencyMs={180}
        onSnapshot={() => {}}
      />
    )
  },
}

/** Detections drawn over the picture: the overlay layer is the video box, so the marks sit on the picture at any size. */
export const CameraFeedWithOverlay: S = {
  render: function Render() {
    const stream = useDemoStream()
    return (
      <CameraFeed label="Front camera" source="Forklift 2" stream={stream} status={stream ? "live" : "connecting"} latencyMs={240}>
        <svg viewBox="0 0 640 360" className="size-full" aria-hidden="true">
          <line x1="320" y1="160" x2="320" y2="200" stroke="var(--annotate-halo)" strokeWidth="4" />
          <line x1="300" y1="180" x2="340" y2="180" stroke="var(--annotate-halo)" strokeWidth="4" />
          <line x1="320" y1="160" x2="320" y2="200" stroke="var(--annotate-predicted)" strokeWidth="2" />
          <line x1="300" y1="180" x2="340" y2="180" stroke="var(--annotate-predicted)" strokeWidth="2" />
          <rect x="10" y="80" width="130" height="36" fill="none" stroke="var(--annotate-halo)" strokeWidth="4" />
          <rect x="10" y="80" width="130" height="36" fill="none" stroke="var(--annotate-predicted)" strokeWidth="2" />
        </svg>
      </CameraFeed>
    )
  },
}

/** Waiting for the first frame: the box keeps its size, the state spins blue, nothing to press yet. */
export const CameraFeedConnecting: S = {
  render: () => <CameraFeed label="Front camera" source="Patrol dog 7F3A" status="connecting" />,
}

/** The connection is up but frames stopped: the last picture stays, dimmed, with when it arrived. Never a silent freeze. */
export const CameraFeedStalled: S = {
  render: function Render() {
    const stream = useDemoStream({ stopAfter: 1.5 })
    return (
      <CameraFeed
        label="Front camera"
        source="Patrol dog 7F3A"
        stream={stream}
        status={stream ? "live" : "connecting"}
        latencyMs={180}
        staleAfterMs={1000}
        labels={stillLabels()}
      />
    )
  },
}

/** The robot is out of reach: why, and Reconnect because reconnecting can help. Grey: offline is a state, not an alarm. */
export const CameraFeedOffline: S = {
  render: () => (
    <CameraFeed label="Front camera" source="Patrol dog 7F3A" status="offline" offlineReason="The robot is out of network range." onRetry={() => {}} />
  ),
}

/** This robot has no camera at this position: nothing to connect to, nothing to retry. */
export const CameraFeedNoCamera: S = {
  render: () => <CameraFeed label="Rear camera" source="Delivery bot 3" />,
}
