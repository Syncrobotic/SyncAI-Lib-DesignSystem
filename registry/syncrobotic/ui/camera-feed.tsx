// @syncrobotic/camera-feed v0.23.1 · update: npx shadcn add @syncrobotic/camera-feed --overwrite
"use client"

import * as React from "react"
import { Camera, Maximize, Minimize, Pause, Play, RotateCw, TriangleAlert, VideoOff, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"

/**
 * What the app knows about the connection. `live` means frames should be arriving; the feed itself tells "Live" from
 * "Stalled" by watching them, and shows "Connecting" until the first one.
 */
export type CameraFeedStatus = "connecting" | "live" | "offline"

/** What the feed shows, as `data-state` on its root. */
export type CameraFeedState = "none" | "connecting" | "live" | "stalled" | "paused" | "offline"

export type CameraFeedLabels = {
  /** Read after the feed's name: the keys it answers to. */
  keys: string
  live: string
  /** Written after "Live": "180 ms". */
  latency: (ms: number) => string
  /** The state word while connecting, and the line over the skeleton. */
  connecting: string
  /** Shown in the state while connecting, after the word; the line over the skeleton says the whole thing. */
  connectingLong: string
  stalled: string
  /** After "Stalled": when the last frame arrived. */
  lastFrame: (time: string) => string
  /** The time of the last frame. 24-hour clock by default; pass the site's own format or time zone. */
  formatTime: (date: Date) => string
  paused: string
  offline: string
  noCamera: string
  retry: string
  pauseView: string
  resumeView: string
  mute: string
  unmute: string
  snapshot: string
  fullscreen: string
  exitFullscreen: string
}

export const defaultCameraFeedLabels: CameraFeedLabels = {
  keys: "Space pauses and resumes the view, F goes full screen. Pausing freezes this view only; the robot keeps streaming.",
  live: "Live",
  latency: (ms) => `${Math.round(ms)} ms`,
  connecting: "Connecting",
  connectingLong: "Connecting to camera…",
  stalled: "Stalled",
  lastFrame: (time) => `last frame ${time}`,
  formatTime: (d) => [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":"),
  paused: "Paused",
  offline: "Camera offline",
  noCamera: "No camera",
  retry: "Reconnect",
  pauseView: "Pause view",
  resumeView: "Resume view",
  mute: "Mute",
  unmute: "Unmute",
  snapshot: "Take snapshot",
  fullscreen: "Full screen",
  exitFullscreen: "Leave full screen",
}

/** How long controls stay after the pointer stops moving. */
const IDLE_MS = 2500

type VideoWithFrames = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number
  cancelVideoFrameCallback?: (handle: number) => void
  webkitEnterFullscreen?: () => void
}

export type CameraFeedProps = {
  /** The camera's name: "Front camera". Names the feed with `source`. */
  label: string
  /** The robot it is on: "Patrol dog 7F3A". */
  source?: string
  /** A WebRTC stream, set as the video's `srcObject`. The app owns the connection; the feed only shows it. */
  stream?: MediaStream | null
  /** A URL the browser plays by itself (a live MP4 or WebM, or HLS where the browser supports it). Use `stream` or `src`. */
  src?: string
  /** What the connection is doing. Defaults to `live` when there is a `stream` or `src`; with neither, "No camera". */
  status?: CameraFeedStatus
  /** Glass-to-glass delay, measured by the app, written after "Live". */
  latencyMs?: number
  /** With no new frame for this long, the feed says "Stalled" over a dimmed picture instead of freezing silently. */
  staleAfterMs?: number
  /** Why the camera is offline, written under "Camera offline": "the robot is out of network range." */
  offlineReason?: string
  /** Shows "Reconnect" while offline. Without it there is no button (a `src` reloads itself after a video error). */
  onRetry?: () => void
  /** Shows "Take snapshot": the frame on screen, drawn to a canvas, as a PNG. */
  onSnapshot?: (blob: Blob) => void
  /** The stream carries sound: adds Mute. It starts muted (browsers block sound until someone asks for it). */
  audio?: boolean
  /** Width over height, so the layout holds its size before the first frame. 16 / 9 by default. */
  aspectRatio?: number
  /** Drawn over the picture, in a layer the size of the video box: a crosshair, detection boxes. */
  children?: React.ReactNode
  labels?: Partial<CameraFeedLabels>
  className?: string
}

/**
 * A robot's live camera, over a native `<video>` the app feeds (a WebRTC `stream` or a `src`). It always says whether
 * what you see is live: "Live" with the latency, "Stalled · last frame 14:02:31" over a dimmed picture when frames stop,
 * "Paused" while the view is frozen here, and connecting, offline and no-camera states. No timeline: it is live.
 */
export function CameraFeed({
  label,
  source,
  stream,
  src,
  status: statusProp,
  latencyMs,
  staleAfterMs = 2000,
  offlineReason,
  onRetry,
  onSnapshot,
  audio = false,
  aspectRatio = 16 / 9,
  children,
  labels: labelsProp,
  className,
}: CameraFeedProps) {
  const l = { ...defaultCameraFeedLabels, ...labelsProp }
  const rootRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<VideoWithFrames>(null)
  const keysId = React.useId()

  const hasSource = !!stream || !!src
  const status: CameraFeedStatus | "none" = statusProp ?? (hasSource ? "live" : "none")

  const [hasFrame, setHasFrame] = React.useState(false)
  // When the last frame arrived, set only once the feed has stalled (frames themselves do not re-render).
  const [stalledAt, setStalledAt] = React.useState<number | null>(null)
  const [paused, setPaused] = React.useState(false)
  const [muted, setMuted] = React.useState(true)
  const [videoError, setVideoError] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [canFullscreen, setCanFullscreen] = React.useState(false)
  const [active, setActive] = React.useState(false)
  const [focusWithin, setFocusWithin] = React.useState(false)
  const idle = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerType = React.useRef("mouse")

  const lastFrame = React.useRef<number | null>(null)
  const staleTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const watching = status === "live" && hasSource && !paused && !videoError
  // The frame and timer callbacks read whether frames are expected from a ref, updated after each commit rather than
  // during render.
  const watchingRef = React.useRef(watching)
  React.useLayoutEffect(() => {
    watchingRef.current = watching
  })
  const flags = React.useRef({ hasFrame: false, stalled: false })

  const arm = React.useCallback(() => {
    clearTimeout(staleTimer.current)
    staleTimer.current = setTimeout(() => {
      if (!watchingRef.current || lastFrame.current === null) return
      flags.current.stalled = true
      setStalledAt(lastFrame.current)
    }, staleAfterMs)
  }, [staleAfterMs])

  const onFrame = React.useCallback(() => {
    lastFrame.current = Date.now()
    if (!flags.current.hasFrame) {
      flags.current.hasFrame = true
      setHasFrame(true)
    }
    if (flags.current.stalled) {
      flags.current.stalled = false
      setStalledAt(null)
    }
    if (watchingRef.current) arm()
  }, [arm])

  // A new source starts over: connecting until its first frame. The state is reset during the render that brings the
  // new source, so no frame is drawn with the old source's state; the refs and the video element follow in the effect.
  const [feed, setFeed] = React.useState({ stream, src })
  if (feed.stream !== stream || feed.src !== src) {
    setFeed({ stream, src })
    setHasFrame(false)
    setStalledAt(null)
    setVideoError(false)
    setPaused(false)
  }
  React.useEffect(() => {
    flags.current = { hasFrame: false, stalled: false }
    lastFrame.current = null
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream ?? null
    if (stream || src) video.play()?.catch(() => {})
  }, [stream, src])

  // Watch frames arrive: each video frame where the browser can say so, otherwise each time the position moves.
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !hasSource) return
    if (typeof video.requestVideoFrameCallback === "function") {
      let handle = 0
      const tick = () => {
        onFrame()
        handle = video.requestVideoFrameCallback!(tick)
      }
      handle = video.requestVideoFrameCallback(tick)
      return () => video.cancelVideoFrameCallback?.(handle)
    }
    video.addEventListener("timeupdate", onFrame)
    return () => video.removeEventListener("timeupdate", onFrame)
  }, [hasSource, stream, src, onFrame])

  // The stale timer runs only while frames are expected; resuming or a new threshold starts it again.
  React.useEffect(() => {
    if (!watching || !hasFrame) {
      clearTimeout(staleTimer.current)
      return
    }
    arm()
    return () => clearTimeout(staleTimer.current)
  }, [watching, hasFrame, arm])

  React.useEffect(() => {
    const root = rootRef.current
    const video = videoRef.current
    setCanFullscreen(!!(root?.requestFullscreen || video?.webkitEnterFullscreen))
    const onChange = () => setFullscreen(!!root && document.fullscreenElement === root)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const poke = React.useCallback(() => {
    setActive(true)
    clearTimeout(idle.current)
    idle.current = setTimeout(() => setActive(false), IDLE_MS)
  }, [])
  React.useEffect(() => () => clearTimeout(idle.current), [])

  const state: CameraFeedState =
    status === "offline" || videoError
      ? "offline"
      : status === "none"
        ? "none"
        : status === "connecting" || !hasFrame
          ? "connecting"
          : paused
            ? "paused"
            : stalledAt !== null
              ? "stalled"
              : "live"
  const picture = state === "live" || state === "stalled" || state === "paused"

  const togglePause = () => {
    const video = videoRef.current
    if (!video || !picture) return
    if (paused) {
      setPaused(false)
      flags.current.stalled = false
      setStalledAt(null)
      video.play()?.catch(() => {})
    } else {
      setPaused(true)
      video.pause()
    }
  }
  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }
  const toggleFullscreen = () => {
    const root = rootRef.current
    const video = videoRef.current
    if (!root || !video) return
    if (document.fullscreenElement) void document.exitFullscreen?.()
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => {})
    else video.webkitEnterFullscreen?.()
  }
  const snapshot = () => {
    const video = videoRef.current
    if (!video || !onSnapshot || !picture) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx || !canvas.width || !canvas.height) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => blob && onSnapshot(blob), "image/png")
  }
  const retry = () => {
    setVideoError(false)
    if (onRetry) onRetry()
    else videoRef.current?.load()
  }

  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const target = e.target as HTMLElement
    const onButton = target !== rootRef.current && !!target.closest("button")
    if (e.key === " ") {
      if (onButton || !picture) return // Space presses the focused button
      togglePause()
    } else if (e.key === "f" || e.key === "F") {
      if (!canFullscreen) return
      toggleFullscreen()
    } else return
    e.preventDefault()
    e.stopPropagation()
    poke()
  }

  const shown = picture && (active || focusWithin || paused)
  const lastFrameTime = stalledAt !== null ? l.formatTime(new Date(stalledAt)) : ""
  const name = source ? `${label}, ${source}` : label

  const stateWord: Record<CameraFeedState, string> = {
    none: l.noCamera,
    connecting: l.connecting,
    live: l.live,
    stalled: l.stalled,
    paused: l.paused,
    offline: l.offline,
  }

  return (
    <div
      ref={rootRef}
      data-slot="camera-feed"
      data-state={state}
      role="region"
      aria-label={name}
      aria-describedby={keysId}
      tabIndex={0}
      onKeyDownCapture={onKeyDownCapture}
      onPointerMove={(e) => {
        if (e.pointerType === "mouse") poke()
      }}
      onPointerDown={(e) => {
        pointerType.current = e.pointerType || "mouse"
      }}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false)
      }}
      className={cn(
        "flex flex-col gap-2 rounded-md",
        "[&:fullscreen]:gap-3 [&:fullscreen]:rounded-none [&:fullscreen]:bg-background [&:fullscreen]:p-4",
        className,
      )}
    >
      <span id={keysId} className="sr-only">
        {l.keys}
      </span>
      {/* Spoken when the state changes; the visible line below also carries the latency, which changes too often to read out. */}
      <span role="status" className="sr-only">
        {state === "stalled" ? `${l.stalled}, ${l.lastFrame(lastFrameTime)}` : stateWord[state]}
      </span>

      <div data-slot="camera-feed-header" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <p className="min-w-0">
          <span className="font-medium">{label}</span>
          {source && <span className="text-muted-foreground"> · {source}</span>}
        </p>
        <p data-slot="camera-feed-state" className={cn("flex items-center gap-2", state === "stalled" ? "text-warning" : "text-muted-foreground")}>
          {state === "connecting" ? (
            <span aria-hidden="true" className="flex">
              <Spinner className="size-4 text-info" delay={0} label={l.connectingLong} />
            </span>
          ) : state === "paused" ? (
            <Pause aria-hidden="true" className="size-4" />
          ) : (
            <StatusGlyph
              status={state === "live" ? "active" : state === "stalled" ? "warning" : "offline"}
              className={state === "live" ? "text-foreground" : undefined}
            />
          )}
          <span className={cn(state === "live" && "font-medium text-foreground")}>{stateWord[state]}</span>
          {state === "live" && latencyMs !== undefined && Number.isFinite(latencyMs) && (
            <span className="font-mono text-xs tabular-nums">· {l.latency(latencyMs)}</span>
          )}
        </p>
      </div>

      <div
        data-slot="camera-feed-frame"
        style={{ "--camera-feed-ratio": aspectRatio } as React.CSSProperties}
        className="relative aspect-(--camera-feed-ratio) w-full overflow-hidden rounded-md ring-1 ring-border [:fullscreen_&]:aspect-auto [:fullscreen_&]:min-h-0 [:fullscreen_&]:flex-1"
      >
        {/* Always dark, like any video surface: the overlays take the dark theme's tokens whatever the page's theme. */}
        <div className="dark absolute inset-0 bg-background text-foreground">
          <video
            ref={videoRef}
            src={stream ? undefined : src}
            autoPlay
            playsInline
            muted={!audio || muted}
            aria-hidden="true"
            className={cn("size-full object-contain", !picture && "invisible")}
            onClick={() => {
              if (!picture) return
              // A click or tap shows the controls (a tap on shown controls hides them); it never pauses the view by surprise.
              if (pointerType.current !== "mouse" && shown && !paused) {
                clearTimeout(idle.current)
                setActive(false)
              } else poke()
            }}
            onLoadedData={onFrame}
            onError={() => setVideoError(true)}
            onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
          />

          {picture && children && (
            <div data-slot="camera-feed-overlay" className="pointer-events-none absolute inset-0">
              {children}
            </div>
          )}

          {state === "connecting" && (
            <div className="absolute inset-0">
              <Bone className="size-full rounded-none" />
              {/* On its own surface, as Stalled is: grey words straight on the grey skeleton fall below 4.5:1. */}
              <div className="absolute inset-0 grid place-items-center p-4">
                <p className="rounded-sm bg-background px-3 py-2 text-center text-sm">{l.connectingLong}</p>
              </div>
            </div>
          )}

          {state === "stalled" && (
            <div className="absolute inset-0 grid place-items-center bg-(--scrim) p-4">
              <p className="flex items-center gap-2 rounded-sm bg-background px-3 py-2 text-center text-sm">
                <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
                <span>
                  <span className="font-medium">{l.stalled}</span> · <span className="tabular-nums">{l.lastFrame(lastFrameTime)}</span>
                </span>
              </p>
            </div>
          )}

          {state === "paused" && (
            <p className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-sm bg-(--scrim) px-2 py-1 text-sm">
              <Pause aria-hidden="true" className="size-4" />
              {l.paused}
            </p>
          )}

          {(state === "offline" || state === "none") && (
            <div className="absolute inset-0 grid place-items-center p-4">
              <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                <VideoOff aria-hidden="true" className="size-6 text-muted-foreground" />
                <p className="text-sm text-pretty">
                  <span className="font-medium">{state === "offline" ? l.offline : l.noCamera}</span>
                  {state === "offline" && offlineReason && <span className="block text-muted-foreground">{offlineReason}</span>}
                </p>
                {state === "offline" && (onRetry || (videoError && src && !stream)) && (
                  <Button variant="outline" onClick={retry}>
                    <RotateCw aria-hidden="true" />
                    {l.retry}
                  </Button>
                )}
              </div>
            </div>
          )}

          {picture && (
            <div
              data-slot="camera-feed-controls"
              data-controls={shown ? "shown" : "hidden"}
              className={cn(
                "absolute inset-x-0 bottom-0 flex items-center gap-1 bg-(--scrim) px-2 py-1 transition-opacity duration-(--motion-base) ease-(--ease-standard)",
                shown ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <Button variant="ghost" size="icon" aria-label={paused ? l.resumeView : l.pauseView} onClick={togglePause}>
                {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
              </Button>
              {audio && (
                <Button variant="ghost" size="icon" aria-label={muted ? l.unmute : l.mute} onClick={toggleMute}>
                  {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                </Button>
              )}
              <span className="flex-1" />
              {onSnapshot && (
                <Button variant="ghost" size="icon" aria-label={l.snapshot} onClick={snapshot}>
                  <Camera aria-hidden="true" />
                </Button>
              )}
              {canFullscreen && (
                <Button variant="ghost" size="icon" aria-label={fullscreen ? l.exitFullscreen : l.fullscreen} onClick={toggleFullscreen}>
                  {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
