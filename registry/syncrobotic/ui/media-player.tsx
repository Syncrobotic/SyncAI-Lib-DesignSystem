// @syncrobotic/media-player v0.50.0 · update: npx shadcn add @syncrobotic/media-player --overwrite
"use client"

import * as React from "react"
import { Captions, CircleAlert, Maximize, Minimize, Pause, Play, RotateCw, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/syncrobotic/ui/collapsible"
import { Slider } from "@/registry/syncrobotic/ui/slider"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { prefersReducedMotion } from "@/registry/syncrobotic/hooks/use-reduced-motion"

/**
 * A moment in the clip worth jumping to: "Obstacle" at 42 s. With `end` (seconds, after `time`) it is a window, drawn as a
 * band from start to end: "Person in path" from 12:04 to 12:31. Either way a press goes to `time`.
 */
export type MediaMarker = { time: number; end?: number; label: string; id?: string }

/** A WebVTT file of captions or subtitles. One is shown at a time: the one marked `default`, else the first. */
export type MediaTrack = { src: string; srcLang: string; label: string; kind?: "captions" | "subtitles"; default?: boolean }

export type MediaPlayerLabels = {
  /** Read after the player's name: the keys it answers to. */
  keys: string
  play: string
  pause: string
  mute: string
  unmute: string
  /** The speed button's name; it must contain the visible "1×". */
  speed: (rate: number) => string
  captions: string
  fullscreen: string
  exitFullscreen: string
  /** The timeline's name. */
  seek: string
  /** The timeline's value as read out: "0:42 of 1:00". */
  position: (current: string, total: string) => string
  /** Heading of the list of markers under the player. */
  markers: string
  /** The disclosure that unfolds the list, with `markerList="collapsed"`: "3 events". */
  markerCount: (count: number) => string
  /** A marker's span of time: "12:04–12:31". */
  range: (start: string, end: string) => string
  /** A marker's name, in the list and on the timeline: "12:04–12:31, Person in path". */
  marker: (time: string, label: string) => string
  loading: string
  buffering: string
  /** "Clip unavailable", written before the reason. */
  unavailable: string
  retry: string
  /** Why the browser could not play it, by MediaError code (1 aborted, 2 network, 3 decode, 4 not supported). */
  mediaError: (code: number) => string
}

const defaultLabels: MediaPlayerLabels = {
  keys: "Space or K plays and pauses, the arrow keys move 5 seconds, J and L 10 seconds, M mutes, F goes full screen.",
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  speed: (rate) => `Playback speed ${rate}×`,
  captions: "Captions",
  fullscreen: "Full screen",
  exitFullscreen: "Leave full screen",
  seek: "Position in clip",
  position: (current, total) => `${current} of ${total}`,
  markers: "Events in this clip",
  markerCount: (count) => (count === 1 ? "1 event" : `${count} events`),
  range: (start, end) => `${start}–${end}`,
  marker: (time, label) => `${time}, ${label}`,
  loading: "Loading clip",
  buffering: "Buffering",
  unavailable: "Clip unavailable",
  retry: "Reload clip",
  mediaError: (code) =>
    code === 1
      ? "loading was stopped."
      : code === 2
        ? "the network dropped while it was loading."
        : code === 3
          ? "the file is damaged or this browser cannot decode it."
          : "the file was not found, or it is not a video this browser plays.",
}

const rates = [0.5, 1, 1.5, 2] as const
/** How long controls stay after the pointer stops moving, while the clip plays. */
const IDLE_MS = 2500

/** Seconds as a clock: 0:42, 12:05, 1:02:09. Unknown (no metadata yet) is "–:––". */
export function formatMediaTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "–:––"
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`
}

type VideoWithWebkit = HTMLVideoElement & { webkitEnterFullscreen?: () => void }

export type MediaPlayerProps = {
  /** What the clip is, for the player's name: "Patrol dog 7F3A, front camera, 14:02". */
  label: string
  /** The clip's URL. Leave it out while it is still being fetched (with `loading`). */
  src?: string
  /** A still shown before playing. */
  poster?: string
  /** Length in seconds from the clip's record, so the time and the markers show before the file's metadata arrives. */
  duration?: number
  /** Where to start, in seconds: an incident clip opens at its event. */
  startAt?: number
  markers?: MediaMarker[]
  /**
   * The markers listed under the player, for the keyboard and screen readers. `list` (default) shows them; `collapsed`
   * folds them behind "3 events", so a grid of clips lines up; `none` leaves them out when the page lists the events
   * itself, and the marks on the timeline then take the keyboard and are named instead.
   */
  markerList?: "list" | "collapsed" | "none"
  tracks?: MediaTrack[]
  /** The clip's URL is still being fetched. */
  loading?: boolean
  /** Known before loading that it cannot play: "the robot has not uploaded it yet." Shown after "Clip unavailable:". */
  unavailable?: string
  /** Called by the retry button. Without it, the button reloads `src`. */
  onRetry?: () => void
  /** Starts muted on load, unless the person asked for reduced motion. Off by default: a clip waits for Play. */
  autoPlay?: boolean
  /** How much to fetch before Play. `metadata` (default) gets the length; `none` saves data in a long list of clips. */
  preload?: "none" | "metadata" | "auto"
  labels?: Partial<MediaPlayerLabels>
  className?: string
}

/**
 * A recorded clip (a robot's camera recording, an incident clip) with the kit's controls over a native `<video>`. Controls
 * sit on a scrim in the dark theme, so they read over any picture; they hide while playing once the pointer rests, and
 * stay while a finger or the keyboard is on them. Keys work only while focus is in the player.
 */
export function MediaPlayer({
  label,
  src,
  poster,
  duration: durationHint,
  startAt,
  markers = [],
  markerList = "list",
  tracks = [],
  loading = false,
  unavailable,
  onRetry,
  autoPlay = false,
  preload = "metadata",
  labels: labelsProp,
  className,
}: MediaPlayerProps) {
  const l = { ...defaultLabels, ...labelsProp }
  const frameRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<VideoWithWebkit>(null)
  const keysId = React.useId()
  const markersId = React.useId()

  const [playing, setPlaying] = React.useState(false)
  const [current, setCurrent] = React.useState(startAt ?? 0)
  const [duration, setDuration] = React.useState(durationHint ?? NaN)
  const [muted, setMuted] = React.useState(false)
  const [rate, setRate] = React.useState(1)
  const [waiting, setWaiting] = React.useState(false)
  const [errorCode, setErrorCode] = React.useState<number | null>(null)
  const [captionsOn, setCaptionsOn] = React.useState(() => tracks.some((t) => t.default))
  const [cue, setCue] = React.useState<string | null>(null)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [canFullscreen, setCanFullscreen] = React.useState(false)
  // Controls show while paused, while focus is inside, while a finger or button is down on them, and for a moment after
  // the pointer moves.
  const [active, setActive] = React.useState(false)
  const [focusWithin, setFocusWithin] = React.useState(false)
  const [holding, setHolding] = React.useState(false)
  const idle = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerType = React.useRef("mouse")
  const started = React.useRef(false)

  // A hint that arrives later fills in a duration the media has not reported yet, during the render that brings it.
  // Object.is, because a NaN hint is never equal to itself and would otherwise set state on every render.
  const [prevHint, setPrevHint] = React.useState(durationHint)
  if (!Object.is(durationHint, prevHint)) {
    setPrevHint(durationHint)
    if (Number.isFinite(durationHint)) setDuration((d) => (Number.isFinite(d) ? d : (durationHint as number)))
  }

  // Seek to startAt once the media can seek, unless someone has already played or moved it.
  const openAtStart = (v: HTMLVideoElement) => {
    if (startAt && !started.current && v.currentTime === 0) v.currentTime = startAt
  }
  // On a server-rendered page the browser can load the metadata before React attaches onLoadedMetadata, so that event
  // never reaches the player and the picture stayed at 0:00 under a time reading startAt. Seek on mount when it already can.
  React.useEffect(() => {
    const v = videoRef.current
    if (v && v.readyState >= 1) openAtStart(v)
    // Mount only: later metadata goes through onLoadedMetadata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const poke = React.useCallback(() => {
    setActive(true)
    clearTimeout(idle.current)
    idle.current = setTimeout(() => setActive(false), IDLE_MS)
  }, [])
  React.useEffect(() => () => clearTimeout(idle.current), [])

  // Lifting a finger anywhere ends the hold; the controls then stay for the idle time before hiding.
  React.useEffect(() => {
    if (!holding) return
    const end = () => {
      setHolding(false)
      poke()
    }
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
    return () => {
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
    }
  }, [holding, poke])

  React.useEffect(() => {
    const frame = frameRef.current
    const video = videoRef.current
    setCanFullscreen(!!(frame?.requestFullscreen || video?.webkitEnterFullscreen))
    const onChange = () => setFullscreen(!!frame && document.fullscreenElement === frame)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  // Autoplay only muted (browsers block sound) and never for someone who asked for less motion.
  React.useEffect(() => {
    const video = videoRef.current
    if (!autoPlay || !video || !src || prefersReducedMotion()) return
    video.muted = true
    setMuted(true)
    video.play()?.catch(() => {})
  }, [autoPlay, src])

  // Captions are drawn by the player, above the controls, not by the browser (which would put them under the scrim).
  const trackIndex = Math.max(
    0,
    tracks.findIndex((t) => t.default),
  )
  React.useEffect(() => {
    const list = videoRef.current?.textTracks
    if (!list || tracks.length === 0) return
    let track: TextTrack | undefined
    const onCue = () => {
      const cues = track?.activeCues
      setCue(cues && cues.length ? Array.from(cues, (c) => (c as VTTCue).text).join("\n") : null)
    }
    const bind = () => {
      track?.removeEventListener("cuechange", onCue)
      for (const t of Array.from(list)) t.mode = "hidden"
      track = list[trackIndex]
      track?.addEventListener("cuechange", onCue)
    }
    bind()
    list.addEventListener?.("addtrack", bind)
    return () => {
      track?.removeEventListener("cuechange", onCue)
      list.removeEventListener?.("addtrack", bind)
    }
  }, [tracks.length, trackIndex])

  const failed = !!unavailable || errorCode !== null
  const ready = !!src && !loading && !failed
  const known = Number.isFinite(duration) && duration > 0

  const togglePlay = () => {
    const video = videoRef.current
    if (!video || !ready) return
    if (video.paused) video.play()?.catch(() => {})
    else video.pause()
  }
  const seekTo = (t: number) => {
    const video = videoRef.current
    if (!video || !ready) return
    const next = Math.max(0, known ? Math.min(t, duration) : t)
    video.currentTime = next
    setCurrent(next)
  }
  const toggleMute = () => {
    const video = videoRef.current
    if (!video || !ready) return
    video.muted = !video.muted
    setMuted(video.muted)
  }
  const cycleRate = () => {
    const video = videoRef.current
    if (!video || !ready) return
    // The index wraps with % rates.length, so it always names one of the rates (an unknown rate gives -1 + 1, the first).
    const next = rates[(rates.indexOf(rate as (typeof rates)[number]) + 1) % rates.length]!
    video.playbackRate = next
    setRate(next)
  }
  const toggleFullscreen = () => {
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame || !video || !ready) return
    if (document.fullscreenElement) void document.exitFullscreen?.()
    else if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {})
    else video.webkitEnterFullscreen?.()
  }
  const retry = () => {
    setErrorCode(null)
    setWaiting(false)
    if (onRetry) onRetry()
    else videoRef.current?.load()
  }

  // Captured at the frame, so the timeline's own arrow steps give way to the player's 5 s ones.
  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !ready) return
    const target = e.target as HTMLElement
    const onButton = target !== frameRef.current && !!target.closest("button")
    switch (e.key) {
      case " ":
        if (onButton) return // Space presses the focused button
        togglePlay()
        break
      case "k":
      case "K":
        togglePlay()
        break
      case "ArrowLeft":
        seekTo(current - 5)
        break
      case "ArrowRight":
        seekTo(current + 5)
        break
      case "j":
      case "J":
        seekTo(current - 10)
        break
      case "l":
      case "L":
        seekTo(current + 10)
        break
      case "m":
      case "M":
        toggleMute()
        break
      case "f":
      case "F":
        toggleFullscreen()
        break
      default:
        return
    }
    e.preventDefault()
    e.stopPropagation()
    poke()
  }

  const onVideoClick = () => {
    if (!ready) return
    if (pointerType.current === "mouse") return togglePlay()
    // A tap shows or hides the controls; it never starts or stops the clip by surprise.
    if (shown && playing) {
      clearTimeout(idle.current)
      setActive(false)
    } else poke()
  }

  // A marker's time as written: "0:42", or "12:04–12:31" for a window. A window that ends where it starts is a moment.
  const spans = (m: MediaMarker) => m.end !== undefined && m.end > m.time
  const when = (m: MediaMarker) => (spans(m) ? l.range(formatMediaTime(m.time), formatMediaTime(m.end!)) : formatMediaTime(m.time))
  const nameOf = (m: MediaMarker) => l.marker(when(m), m.label)
  const at = (t: number) => Math.min(1, Math.max(0, t / duration))
  // Without a list under the player, the marks are the only way to the markers, so they take the keyboard and a name.
  const marksReachable = markerList === "none"
  const markerKey = (m: MediaMarker) => m.id ?? `${m.time}-${m.end ?? ""}-${m.label}`

  // Under its heading when listed; named by itself when folded, where the disclosure says only how many. The times are
  // one column (each row a subgrid of the list), so every name starts at the same x whether its time is "0:02" or a range.
  const markerItems = (
    <ol
      {...(markerList === "list" ? { "aria-labelledby": markersId } : { "aria-label": l.markers })}
      className="grid grid-cols-[auto_1fr] gap-x-3"
    >
      {markers.map((m) => (
        <li key={markerKey(m)} className="col-span-2 grid grid-cols-subgrid">
          <Button
            variant="ghost"
            size="sm"
            disabled={!ready}
            onClick={() => seekTo(m.time)}
            className="col-span-2 grid w-full grid-cols-subgrid justify-items-start gap-3 px-2 text-left font-normal"
          >
            {/* Named by what it shows (no aria-label, which would have to repeat the visible words): the time, a comma
                for screen readers only (out of the grid, as it is absolutely placed), then the label. */}
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{when(m)}</span>
            <span className="sr-only">, </span>
            <span className="truncate">{m.label}</span>
          </Button>
        </li>
      ))}
    </ol>
  )

  const buffering = ready && playing && waiting
  const shown = ready && (!playing || active || focusWithin || holding)
  const total = known ? duration : NaN

  return (
    <div data-slot="media-player" className={cn("flex flex-col gap-3", className)}>
      <div
        ref={frameRef}
        role="region"
        aria-label={label}
        aria-describedby={keysId}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the player frame is a Tab stop that takes the player's keys (Space, arrows, J/K/L, M, F)
        tabIndex={0}
        data-playing={playing || undefined}
        data-controls={shown ? "shown" : "hidden"}
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
          "relative aspect-video w-full overflow-hidden rounded-md",
          "[&:fullscreen]:aspect-auto [&:fullscreen]:rounded-none",
          playing && !shown && "cursor-none",
        )}
      >
        <span id={keysId} className="sr-only">
          {l.keys}
        </span>
        {/* The player is always dark, like any video surface: the controls take the dark theme's tokens (white ink on
            the scrim) whatever the page's theme. The frame itself stays outside it, so its focus ring keeps the page's ink. */}
        <div className="dark absolute inset-0 bg-letterbox text-foreground">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- captions come in through `tracks` and are rendered as <track> children below */}
          <video
            ref={videoRef}
            src={loading ? undefined : src}
            poster={poster}
            preload={preload}
            playsInline
            muted={muted}
            className="size-full object-contain"
            onClick={onVideoClick}
            onPlay={() => {
              setPlaying(true)
              started.current = true
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget
              if (Number.isFinite(v.duration)) setDuration(v.duration)
              openAtStart(v)
            }}
            onDurationChange={(e) => {
              if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration)
            }}
            onWaiting={() => setWaiting(true)}
            onPlaying={() => setWaiting(false)}
            onCanPlay={() => setWaiting(false)}
            onSeeked={() => setWaiting(false)}
            onLoadStart={() => setErrorCode(null)}
            onError={(e) => setErrorCode(e.currentTarget.error?.code ?? 4)}
            onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
            onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
          >
            {tracks.map((t, i) => (
              <track key={t.src} src={t.src} srcLang={t.srcLang} label={t.label} kind={t.kind ?? "captions"} default={i === trackIndex} />
            ))}
          </video>

          {(loading || buffering) && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="flex items-center gap-2 rounded-sm bg-scrim px-3 py-2 text-sm">
                <Spinner className="size-5" label={loading ? l.loading : l.buffering} />
                {loading && <span aria-hidden="true">{l.loading}</span>}
              </span>
            </div>
          )}

          {failed && (
            <div className="absolute inset-0 grid place-items-center bg-scrim p-4">
              {/* Its own opaque surface, as the camera feed's notices: secondary text on the scrim over a bright frame fell to 3.2:1. */}
              <div role={errorCode !== null ? "alert" : undefined} className="flex max-w-sm flex-col items-center gap-3 rounded-md bg-background p-4 text-center">
                <CircleAlert aria-hidden="true" className="size-6" />
                <p className="text-sm text-pretty">
                  <span className="font-medium">{l.unavailable}:</span>{" "}
                  <span className="text-muted-foreground">{unavailable ?? l.mediaError(errorCode ?? 4)}</span>
                </p>
                {(errorCode !== null || onRetry) && (
                  <Button variant="outline" onClick={retry}>
                    <RotateCw aria-hidden="true" />
                    {l.retry}
                  </Button>
                )}
              </div>
            </div>
          )}

          {ready && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
              {captionsOn && cue && (
                <p className="mx-4 mb-2 whitespace-pre-line rounded-xs bg-scrim px-2 py-1 text-center text-sm text-pretty">{cue}</p>
              )}
              <div
                data-slot="media-player-controls"
                onPointerDown={() => setHolding(true)}
                className={cn(
                  "w-full bg-scrim px-2 transition-opacity duration-(--motion-base) ease-(--ease-standard)",
                  shown ? "pointer-events-auto opacity-100" : "opacity-0",
                )}
              >
                {/* The time beside the timeline, so the buttons' row has room for all six on a phone. */}
                <div className="flex items-center gap-2 px-2 font-mono text-xs tabular-nums">
                  <span data-slot="media-player-current">{formatMediaTime(current)}</span>
                  {/* isolate: a tick raised over a window stays inside the timeline, never over a sticky bar on the page. */}
                  <div className="relative isolate min-w-0 flex-1">
                    <Slider
                      aria-label={l.seek}
                      min={0}
                      max={known ? duration : 1}
                      step={0.1}
                      value={[known ? Math.min(current, duration) : 0]}
                      disabled={!known}
                      valueText={(v) => l.position(formatMediaTime(v), formatMediaTime(total))}
                      // One thumb, so one value; the check only satisfies the array type.
                      onValueChange={([v]) => {
                        if (v !== undefined) seekTo(v)
                      }}
                    />
                    {/* Pointer shortcuts: the list under the player names each marker for the keyboard and screen readers
                        (with markerList="none" the marks themselves do). */}
                    {known &&
                      markers.map((m) => (
                        // A moment is a tick, a window a bracket from start to end: open, in the lane above the track, so
                        // it is never read as the played or buffered fill. Both are 24 px tall targets with a mouse (WCAG
                        // 2.5.8), --h-md (44, 48 in gloves) on a coarse pointer, widened by an invisible ::after as on
                        // Checkbox; a press near a marker lands on it. A window narrower than the target is widened too.
                        <button
                          data-slot="media-player-marker"
                          key={markerKey(m)}
                          type="button"
                          className={cn(
                            "group/mark press absolute top-0 flex h-6 items-start pt-1",
                            "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
                            spans(m)
                              ? "after:h-6 after:w-full after:min-w-6 any-pointer-coarse:after:h-(--h-md) any-pointer-coarse:after:min-w-(--h-md)"
                              // A moment inside a window is drawn over it.
                              : "z-10 w-6 -translate-x-1/2 justify-center any-pointer-coarse:after:size-(--h-md)",
                          )}
                          tabIndex={marksReachable ? undefined : -1}
                          aria-hidden={marksReachable ? undefined : true}
                          aria-label={marksReachable ? nameOf(m) : undefined}
                          onClick={() => seekTo(m.time)}
                          style={
                            spans(m)
                              ? { left: `${at(m.time) * 100}%`, width: `${(at(m.end!) - at(m.time)) * 100}%` }
                              : { left: `${at(m.time) * 100}%` }
                          }
                        >
                          {spans(m) ? (
                            <span className="h-3 w-full min-w-1 rounded-t-2xs border-x-2 border-t-4 border-foreground" />
                          ) : (
                            <span className="h-3 w-0.5 rounded-xs bg-foreground" />
                          )}
                          {/* Its name on hover and on focus, over the picture; kept inside the frame by the half it is in. */}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-xs bg-scrim px-2 py-1 font-sans text-xs",
                              "group-hover/mark:block group-focus-visible/mark:block",
                              at(m.time) < 0.5 ? "left-0" : "right-0",
                            )}
                          >
                            {nameOf(m)}
                          </span>
                        </button>
                      ))}
                  </div>
                  <span data-slot="media-player-total">{formatMediaTime(total)}</span>
                </div>
                <div className="flex items-center gap-1 pb-1">
                  <Button variant="ghost" size="icon" aria-label={playing ? l.pause : l.play} onClick={togglePlay}>
                    {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={muted ? l.unmute : l.mute} onClick={toggleMute}>
                    {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                  </Button>
                  <span className="flex-1" />
                  <Button variant="ghost" size="icon" aria-label={l.speed(rate)} onClick={cycleRate} className="text-xs tabular-nums">
                    {rate}×
                  </Button>
                  {tracks.length > 0 && (
                    <Button variant="ghost" size="icon" aria-label={l.captions} aria-pressed={captionsOn} onClick={() => setCaptionsOn((c) => !c)} className="aria-pressed:bg-primary aria-pressed:text-primary-foreground">
                      <Captions aria-hidden="true" />
                    </Button>
                  )}
                  {canFullscreen && (
                    <Button variant="ghost" size="icon" aria-label={fullscreen ? l.exitFullscreen : l.fullscreen} onClick={toggleFullscreen}>
                      {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {markers.length > 0 && markerList === "list" && (
        <div className="flex flex-col gap-1">
          <p id={markersId} className="text-xs text-muted-foreground">
            {l.markers}
          </p>
          {markerItems}
        </div>
      )}
      {/* Folded, every clip in a grid is the same height: the picture and one row. */}
      {markers.length > 0 && markerList === "collapsed" && (
        <Collapsible>
          <CollapsibleTrigger className="px-2 text-muted-foreground">{l.markerCount(markers.length)}</CollapsibleTrigger>
          <CollapsibleContent className="pt-1">{markerItems}</CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
