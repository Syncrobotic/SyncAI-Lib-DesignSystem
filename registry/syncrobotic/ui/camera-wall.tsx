// @syncrobotic/camera-wall v0.29.0 · update: npx shadcn add @syncrobotic/camera-wall --overwrite
"use client"

import * as React from "react"
import { ArrowLeft, OctagonAlert, Pause, TriangleAlert, VideoOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import {
  CameraFeed,
  CameraFeedStateLine,
  cameraFeedStateWord,
  defaultCameraFeedLabels,
  type CameraFeedLabels,
  type CameraFeedState,
  type CameraFeedStatus,
} from "@/registry/syncrobotic/ui/camera-feed"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"
import { DiamondAlert } from "@/registry/syncrobotic/ui/robot-icons"
import { SegmentedControl, SegmentedControlItem } from "@/registry/syncrobotic/ui/segmented-control"
import { Toggle } from "@/registry/syncrobotic/ui/toggle"

/** What the wall asks the product's source function for: the focused camera is "high", every tile "low". */
export type CameraWallQuality = "high" | "low"

/** What camera-feed plays: a WebRTC `stream` or a `src` the browser plays by itself. */
export type CameraWallSource = { stream?: MediaStream | null; src?: string }

export type CameraWallAlarmPriority = "critical" | "high" | "low"

export type CameraWallCamera = {
  /** Stable and unique: the wall keys tiles, focus and live slots by it. */
  id: string
  /** The camera's name: "Front camera". */
  label: string
  /** The robot it is on: "Patrol dog 7F3A". */
  source?: string
  /** What the connection is doing, as camera-feed takes it. An offline camera never takes a live slot. */
  status?: CameraFeedStatus
  /** Glass-to-glass delay, written after "Live" on the focused camera. */
  latencyMs?: number
  /** Why it is offline: "The robot is out of network range." */
  offlineReason?: string
  /** The robot's most urgent active alarm: a shape and a word on the tile ("Critical · Obstacle in path"), and it sorts first. */
  alarm?: { priority: CameraWallAlarmPriority; title: string }
  /** A still to show while the tile is paused and before it has a frame of its own (a snapshot URL from the robot). */
  poster?: string
}

export type CameraWallSort = "attention" | "name"

export type CameraWallLabels = {
  /** Names the wall for screen readers. */
  name: string
  /** Read after a tile's name: the keys the tiles answer to. */
  keys: string
  /** Over a tile's last frame when it is not live because `maxLive` streams already are. */
  pausedToSave: string
  /** The sort control's name. */
  sort: string
  attentionFirst: string
  byName: string
  /** The filter that keeps only cameras with an alarm, offline or stalled. */
  needsAttention: string
  count: (n: number, locale: string | undefined) => string
  /** Back from one camera to the grid. */
  allCameras: string
  critical: string
  high: string
  low: string
  /** A tile's alarm: "Critical · Obstacle in path". */
  alarm: (priority: string, title: string) => string
  range: (from: number, to: number, total: number, locale?: string) => string
  previousPage: string
  nextPage: string
  empty: string
  noneNeedAttention: string
  showAll: string
  /** One polite announcement for the state changes since the last one: "Front camera, Patrol dog 7F3A: Stalled." */
  announce: (changes: { name: string; state: string }[], locale: string | undefined) => string
  /** The state words, from camera-feed. */
  feed: Partial<CameraFeedLabels>
}

export const defaultCameraWallLabels: CameraWallLabels = {
  name: "Cameras",
  keys: "Arrow keys move between cameras, Enter shows one large, Esc goes back to all cameras.",
  pausedToSave: "Paused to save bandwidth",
  sort: "Sort cameras",
  attentionFirst: "Attention first",
  byName: "Name",
  needsAttention: "Needs attention",
  count: (n, locale) => n.toLocaleString(locale),
  allCameras: "All cameras",
  critical: "Critical",
  high: "High",
  low: "Low",
  alarm: (priority, title) => `${priority} · ${title}`,
  range: (from, to, total, locale) => `${from.toLocaleString(locale)}–${to.toLocaleString(locale)} of ${total.toLocaleString(locale)} cameras`,
  previousPage: "Previous cameras",
  nextPage: "Next cameras",
  empty: "No cameras",
  noneNeedAttention: "No camera needs attention",
  showAll: "Show all cameras",
  announce: (changes, locale) => {
    const shown = changes.slice(0, 3).map((c) => `${c.name}: ${c.state}.`)
    const more = changes.length - shown.length
    return [...shown, more > 0 ? `${more.toLocaleString(locale)} more ${more === 1 ? "camera" : "cameras"} changed.` : ""].filter(Boolean).join(" ")
  },
  feed: {},
}

const alarmIcon = { critical: OctagonAlert, high: TriangleAlert, low: DiamondAlert } as const
const alarmText = { critical: "text-danger", high: "text-warning", low: "text-muted-foreground" } as const
// Attention first: critical and high alarms, then cameras with no picture (offline, stalled), then low alarms.
const alarmRank = { critical: 0, high: 1, low: 4 } as const
const CALM = 9
/** A tile narrower than this does not fit: fewer columns, more pages. */
const MIN_TILE = 240
/** Under this container width the wall is a list of tiles, and a focused camera takes the whole width. */
const PHONE = 560

/** A grid's columns: 1, 2×2, 3×3 or 4×4 by how many cameras there are, and fewer when the container is narrow. */
export function cameraWallColumns(count: number, width: number | null) {
  const byCount = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4
  const byWidth = width === null ? 4 : Math.max(1, Math.min(4, Math.floor((width + 16) / (MIN_TILE + 16))))
  return Math.min(byCount, byWidth)
}

const cols = ["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"]

/** Draws the video's frame on screen into the tile's still, smaller than the stream, before the stream is let go. */
function keepStill(video: HTMLVideoElement | null | undefined, canvas: HTMLCanvasElement | null) {
  if (!video || !canvas || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return
  const scale = Math.min(1, 640 / video.videoWidth)
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  try {
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
  } catch {
    // A cross-origin src without CORS cannot be read back; the tile keeps its poster.
  }
}

type Reported = Record<string, { state: CameraFeedState; at: number | null }>

export type CameraWallProps = {
  cameras: CameraWallCamera[]
  /**
   * The product's source function: what to play for a camera, at a quality. The wall calls it on render, only for the
   * cameras it plays, so return the same stream for the same camera and quality (keep them in a cache), and open
   * connections there lazily. `onLiveChange` says which are playing, to close the rest.
   */
  getSource: (camera: CameraWallCamera, options: { quality: CameraWallQuality }) => CameraWallSource | null | undefined
  /** At most this many streams play at once: the focused camera first, then tiles in order. The rest show their last still. */
  maxLive?: number
  /** Called with the cameras playing and the quality each was asked for, whenever that changes. */
  onLiveChange?: (live: { id: string; quality: CameraWallQuality }[]) => void
  /** The camera shown large, controlled. `null` is the grid. */
  focused?: string | null
  /** The camera shown large at first, when `focused` is not given. */
  defaultFocused?: string | null
  onFocusedChange?: (id: string | null) => void
  /** Attention first (alarms, offline, stalled, then by name) or by name. */
  defaultSort?: CameraWallSort
  /** Start with only the cameras that need attention. */
  defaultNeedsAttention?: boolean
  /** Tiles per page. By default the grid's own: 4, 9 or 16, and 6 in the phone list. */
  pageSize?: number
  /** With no new frame for this long, a feed says Stalled. Passed to every feed. */
  staleAfterMs?: number
  /** Width over height of every picture. 16 / 9 by default. */
  aspectRatio?: number
  /** Shows "Take snapshot" on the focused camera. */
  onSnapshot?: (camera: CameraWallCamera, blob: Blob) => void
  /** Shows Reconnect on the focused camera while it is offline. */
  onRetry?: (camera: CameraWallCamera) => void
  /** State changes are announced politely, at most this often (ms). */
  announceEveryMs?: number
  labels?: Partial<CameraWallLabels>
  /** Formats the counts and page ranges (a BCP 47 tag such as "zh-TW"). */
  locale?: string
  className?: string
}

/**
 * Many robot cameras at once, each a `camera-feed`: an auto grid (1, 2×2, 3×3, 4×4 by count and width), a page control
 * when there are more, and one camera focused large with a strip of the rest. Tiles off screen or behind the focused one
 * pause, only the focused camera asks for high quality, and at most `maxLive` stream at once; the rest keep their last
 * still, "Paused to save bandwidth". Sorted attention first (alarms, offline, stalled) or by name.
 */
export function CameraWall({
  cameras,
  getSource,
  maxLive = 9,
  onLiveChange,
  focused: focusedProp,
  defaultFocused = null,
  onFocusedChange,
  defaultSort = "attention",
  defaultNeedsAttention = false,
  pageSize: pageSizeProp,
  staleAfterMs,
  aspectRatio = 16 / 9,
  onSnapshot,
  onRetry,
  announceEveryMs = 5000,
  labels: labelsProp,
  locale,
  className,
}: CameraWallProps) {
  const l = { ...defaultCameraWallLabels, ...labelsProp }
  const feedLabels = { ...defaultCameraFeedLabels, ...l.feed }
  const rootRef = React.useRef<HTMLDivElement>(null)
  const keysId = React.useId()

  const [focusedInner, setFocusedInner] = React.useState<string | null>(defaultFocused)
  const focusedId = focusedProp !== undefined ? focusedProp : focusedInner
  const focusedCamera = focusedId === null ? undefined : cameras.find((c) => c.id === focusedId)
  const [sort, setSort] = React.useState<CameraWallSort>(defaultSort)
  const [attentionOnly, setAttentionOnly] = React.useState(defaultNeedsAttention)
  const [pageState, setPage] = React.useState(0)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const [offscreen, setOffscreen] = React.useState<ReadonlySet<string>>(() => new Set())
  const [fullscreen, setFullscreen] = React.useState(false)
  const [reported, setReported] = React.useState<Reported>({})
  const [announcement, setAnnouncement] = React.useState({ text: "", n: 0 })

  // The container's width picks the columns, and the list layout under PHONE.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([entry]) => entry && setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Full screen on the focused camera hides every other tile, so they pause.
  React.useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement
      setFullscreen(!!el && !!rootRef.current?.contains(el))
    }
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const phone = width !== null && width < PHONE
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" })
  const feedState = (c: CameraWallCamera) => (c.status === "offline" ? "offline" : reported[c.id]?.state)
  const rank = (c: CameraWallCamera) => {
    const s = feedState(c)
    return Math.min(c.alarm ? alarmRank[c.alarm.priority] : CALM, s === "offline" ? 2 : s === "stalled" ? 3 : CALM)
  }
  const byName = (a: CameraWallCamera, b: CameraWallCamera) => collator.compare(a.label, b.label) || collator.compare(a.source ?? "", b.source ?? "")
  const attentionCount = cameras.filter((c) => rank(c) < CALM).length
  const shown = (attentionOnly ? cameras.filter((c) => rank(c) < CALM) : [...cameras]).sort(
    sort === "attention" ? (a, b) => rank(a) - rank(b) || byName(a, b) : byName,
  )

  const columns = phone ? 1 : cameraWallColumns(shown.length, width)
  const pageSize = Math.max(1, pageSizeProp ?? (phone ? 6 : columns * columns))
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize))
  const page = Math.min(pageState, pageCount - 1)
  const pageCameras = shown.slice(page * pageSize, (page + 1) * pageSize)

  const layout = focusedCamera ? "focus" : "grid"
  const strip = focusedCamera && !phone && !fullscreen ? shown.filter((c) => c.id !== focusedCamera.id) : []
  const tiles = layout === "grid" ? pageCameras : strip

  // Live slots: the focused camera first, then the tiles in the order shown, skipping tiles off screen and offline ones
  // (nothing to decode). Tiles behind the focused camera are not drawn at all.
  const live = new Set<string>()
  for (const c of focusedCamera ? [focusedCamera, ...strip] : pageCameras) {
    if (live.size >= Math.max(0, maxLive)) break
    if (c.status === "offline" || (c !== focusedCamera && offscreen.has(c.id))) continue
    live.add(c.id)
  }
  const quality = (id: string): CameraWallQuality => (id === focusedCamera?.id ? "high" : "low")
  const liveKey = [...live].map((id) => `${id}\u0001${quality(id)}`).join("\u0002")
  const onLiveChangeRef = React.useRef(onLiveChange)
  React.useLayoutEffect(() => {
    onLiveChangeRef.current = onLiveChange
  })
  React.useEffect(() => {
    const list = liveKey ? liveKey.split("\u0002").map((e) => e.split("\u0001")) : []
    onLiveChangeRef.current?.(list.map(([id = "", q]) => ({ id, quality: q as CameraWallQuality })))
  }, [liveKey])

  // Which tiles are on screen: one observer for the tiles drawn now. A tile not reported yet counts as on screen.
  const tileKey = tiles.map((c) => c.id).join("\u0002")
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((entries) =>
      setOffscreen((prev) => {
        const next = new Set(prev)
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.cameraId
          if (id === undefined) continue
          if (e.isIntersecting) next.delete(id)
          else next.add(id)
        }
        return next.size === prev.size && [...next].every((id) => prev.has(id)) ? prev : next
      }),
    )
    root.querySelectorAll<HTMLElement>("[data-camera-id]").forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [tileKey])

  // ---------- Announcements: polite, batched, at most every announceEveryMs ----------
  const known = React.useRef(new Map<string, CameraFeedState>())
  const queue = React.useRef<{ name: string; state: string }[]>([])
  const lastSpoken = React.useRef(-Infinity)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])
  const flush = () => {
    timer.current = undefined
    if (!queue.current.length) return
    const text = l.announce(queue.current, locale)
    queue.current = []
    lastSpoken.current = clockNow()
    setAnnouncement((a) => ({ text, n: a.n + 1 }))
  }
  const report = (camera: CameraWallCamera, state: CameraFeedState, at: number | null) => {
    const prev = known.current.get(camera.id)
    known.current.set(camera.id, state)
    setReported((r) => (r[camera.id]?.state === state && r[camera.id]?.at === at ? r : { ...r, [camera.id]: { state, at } }))
    const bad = (s?: CameraFeedState) => s === "stalled" || s === "offline"
    if (prev === undefined || prev === state || !(bad(state) || (state === "live" && bad(prev)))) return
    const word =
      state === "stalled" && at !== null ? `${feedLabels.stalled}, ${feedLabels.lastFrame(feedLabels.formatTime(new Date(at)))}` : cameraFeedStateWord(state, feedLabels)
    queue.current = [...queue.current.filter((q) => q.name !== nameOf(camera)), { name: nameOf(camera), state: word }]
    if (timer.current !== undefined) return
    timer.current = setTimeout(flush, Math.max(0, lastSpoken.current + announceEveryMs - clockNow()))
  }
  const gone = (id: string) => {
    known.current.delete(id)
    setReported((r) => {
      if (!(id in r)) return r
      const next = { ...r }
      delete next[id]
      return next
    })
  }

  // ---------- Focus: which camera is large, and where keyboard focus goes after ----------
  const pendingFocus = React.useRef<{ to: "feed" } | { to: "tile"; id: string } | null>(null)
  const setFocused = (id: string | null) => {
    if (focusedProp === undefined) setFocusedInner(id)
    onFocusedChange?.(id)
  }
  const open = (id: string) => {
    pendingFocus.current = { to: "feed" }
    setActiveId(id)
    setFocused(id)
  }
  const back = () => {
    const id = focusedCamera?.id
    if (!id) return
    if (document.fullscreenElement) void document.exitFullscreen?.()
    const at = shown.findIndex((c) => c.id === id)
    if (at >= 0) setPage(Math.floor(at / pageSize))
    setActiveId(id)
    pendingFocus.current = { to: "tile", id }
    setFocused(null)
  }
  React.useLayoutEffect(() => {
    const want = pendingFocus.current
    const root = rootRef.current
    if (!want || !root) return
    pendingFocus.current = null
    if (want.to === "feed") root.querySelector<HTMLElement>('[data-slot="camera-wall-focus"] [data-slot="camera-feed"]')?.focus()
    else tileButton(root, want.id)?.focus()
  }, [focusedId])

  const moveTo = (id: string) => {
    setActiveId(id)
    const root = rootRef.current
    if (root) tileButton(root, id)?.focus()
  }
  const onTileKeyDown = (e: React.KeyboardEvent, camera: CameraWallCamera) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const ids = tiles.map((c) => c.id)
    const i = ids.indexOf(camera.id)
    const step = layout === "grid" ? columns : 1
    let next = -1
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault()
        open(camera.id)
        return
      case "ArrowRight":
        next = i + 1
        break
      case "ArrowLeft":
        next = i - 1
        break
      case "ArrowDown":
        next = i + step
        break
      case "ArrowUp":
        next = i - step
        break
      case "Home":
        next = 0
        break
      case "End":
        next = ids.length - 1
        break
      case "PageDown":
      case "PageUp": {
        if (layout !== "grid") return
        e.preventDefault()
        const to = page + (e.key === "PageDown" ? 1 : -1)
        if (to < 0 || to >= pageCount) return
        setPage(to)
        const first = shown[to * pageSize]
        if (first) {
          setActiveId(first.id)
          pendingFocus.current = { to: "tile", id: first.id }
        }
        return
      }
      default:
        return
    }
    e.preventDefault()
    const to = ids[next]
    if (to !== undefined) moveTo(to)
  }
  // Page changes move focus with them (pendingFocus is read after the page is drawn).
  React.useLayoutEffect(() => {
    const want = pendingFocus.current
    const root = rootRef.current
    if (!want || want.to !== "tile" || !root) return
    const el = tileButton(root, want.id)
    if (!el) return
    pendingFocus.current = null
    el.focus()
  }, [page])

  const onRootKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || !focusedCamera || e.defaultPrevented) return
    e.preventDefault()
    back()
  }

  const rovingId = tiles.some((c) => c.id === activeId) ? activeId : (tiles[0]?.id ?? null)
  const tileProps = (camera: CameraWallCamera) => {
    const playing = camera.status === "offline" || live.has(camera.id)
    const source = playing && camera.status !== "offline" ? getSource(camera, { quality: quality(camera.id) }) : undefined
    return {
      camera,
      playing,
      stream: source?.stream ?? undefined,
      src: source?.src,
      state: playing ? (feedState(camera) ?? "connecting") : ("paused" as CameraFeedState),
      lastFrameAt: reported[camera.id]?.at ?? null,
      tabbable: camera.id === rovingId,
      keysId,
      aspectRatio,
      staleAfterMs,
      labels: l,
      feedLabels,
      onStateChange: (state: CameraFeedState, at: number | null) => report(camera, state, at),
      onGone: () => gone(camera.id),
      onOpen: () => open(camera.id),
      onKeyDown: (e: React.KeyboardEvent) => onTileKeyDown(e, camera),
      onFocus: () => setActiveId(camera.id),
    }
  }

  const focusSource = focusedCamera && live.has(focusedCamera.id) ? getSource(focusedCamera, { quality: "high" }) : undefined

  return (
    <div
      ref={rootRef}
      data-slot="camera-wall"
      data-layout={phone ? `${layout}-phone` : layout}
      role="region"
      aria-label={l.name}
      onKeyDown={onRootKeyDown}
      className={cn("flex min-w-0 flex-col gap-4", className)}
    >
      <span id={keysId} className="sr-only">
        {l.keys}
      </span>
      <span role="status" className="sr-only">
        {announcement.text}
        {announcement.n % 2 ? " " : ""}
      </span>

      {focusedCamera ? (
        <div data-slot="camera-wall-focus" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button variant="outline" onClick={back}>
              <ArrowLeft aria-hidden="true" />
              {l.allCameras}
            </Button>
            {focusedCamera.alarm && <AlarmMarker alarm={focusedCamera.alarm} labels={l} />}
          </div>
          <CameraFeed
            key={focusedCamera.id}
            label={focusedCamera.label}
            source={focusedCamera.source}
            stream={focusSource?.stream ?? undefined}
            src={focusSource?.src}
            status={focusedCamera.status ?? (focusSource ? undefined : "connecting")}
            latencyMs={focusedCamera.latencyMs}
            staleAfterMs={staleAfterMs}
            offlineReason={focusedCamera.offlineReason}
            onRetry={onRetry ? () => onRetry(focusedCamera) : undefined}
            onSnapshot={onSnapshot ? (blob) => onSnapshot(focusedCamera, blob) : undefined}
            aspectRatio={aspectRatio}
            labels={feedLabels}
            onStateChange={(state, at) => report(focusedCamera, state, at)}
          />
          {strip.length > 0 && (
            <ul
              data-slot="camera-wall-strip"
              className="flex snap-x gap-3 overflow-x-auto overscroll-x-contain pb-2"
            >
              {strip.map((c) => (
                <Tile key={c.id} {...tileProps(c)} className="w-64 shrink-0 snap-start" />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {cameras.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                aria-label={l.sort}
                value={sort}
                onValueChange={(v) => {
                  setSort(v as CameraWallSort)
                  setPage(0)
                }}
                className="w-auto"
              >
                <SegmentedControlItem value="attention">{l.attentionFirst}</SegmentedControlItem>
                <SegmentedControlItem value="name">{l.byName}</SegmentedControlItem>
              </SegmentedControl>
              <Toggle
                pressed={attentionOnly}
                onPressedChange={(on) => {
                  setAttentionOnly(on)
                  setPage(0)
                }}
              >
                {l.needsAttention}
                <span className="tabular-nums">{l.count(attentionCount, locale)}</span>
              </Toggle>
            </div>
          )}
          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md px-4 py-8 text-center ring-1 ring-border">
              <VideoOff aria-hidden="true" className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{cameras.length === 0 ? l.empty : l.noneNeedAttention}</p>
              {cameras.length > 0 && (
                <Button variant="outline" onClick={() => setAttentionOnly(false)}>
                  {l.showAll}
                </Button>
              )}
            </div>
          ) : (
            <ul data-slot="camera-wall-grid" className={cn("grid gap-4", cols[columns - 1])}>
              {pageCameras.map((c) => (
                <Tile key={c.id} {...tileProps(c)} />
              ))}
            </ul>
          )}
          {shown.length > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={shown.length}
              onPageChange={setPage}
              locale={locale}
              labels={{ range: l.range, previous: l.previousPage, next: l.nextPage }}
            />
          )}
        </>
      )}
    </div>
  )
}

// Read only in callbacks (a feed reporting its state, the announcement timer), never while rendering.
const clockNow = () => Date.now()

const nameOf = (c: CameraWallCamera) => (c.source ? `${c.label}, ${c.source}` : c.label)

function tileButton(root: HTMLElement, id: string) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-camera-id]")) if (el.dataset.cameraId === id) return el.querySelector<HTMLElement>('[role="button"]')
  return null
}

function AlarmMarker({
  alarm,
  labels: l,
  wrap = false,
  className,
}: {
  alarm: NonNullable<CameraWallCamera["alarm"]>
  labels: CameraWallLabels
  /** Wrap a long title onto more lines instead of cutting it (the marker on a tile's picture keeps to half its width). */
  wrap?: boolean
  className?: string
}) {
  const Icon = alarmIcon[alarm.priority]
  return (
    <p data-slot="camera-wall-alarm" data-priority={alarm.priority} className={cn("flex min-w-0 gap-2 text-sm", wrap ? "items-start" : "items-center", className)}>
      <Icon aria-hidden="true" className={cn("size-4 shrink-0", wrap && "mt-0.5", alarmText[alarm.priority])} />
      <span className={wrap ? "min-w-0 break-words" : "truncate"}>
        <span className={cn("font-medium", alarmText[alarm.priority])}>{l[alarm.priority]}</span> · {alarm.title}
      </span>
    </p>
  )
}

function Tile({
  camera,
  playing,
  stream,
  src,
  state,
  lastFrameAt,
  tabbable,
  keysId,
  aspectRatio,
  staleAfterMs,
  labels: l,
  feedLabels,
  onStateChange,
  onGone,
  onOpen,
  onKeyDown,
  onFocus,
  className,
}: {
  camera: CameraWallCamera
  playing: boolean
  stream?: MediaStream
  src?: string
  state: CameraFeedState
  lastFrameAt: number | null
  tabbable: boolean
  keysId: string
  aspectRatio: number
  staleAfterMs?: number
  labels: CameraWallLabels
  feedLabels: CameraFeedLabels
  onStateChange: (state: CameraFeedState, at: number | null) => void
  onGone: () => void
  onOpen: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onFocus: () => void
  className?: string
}) {
  const still = React.useRef<HTMLCanvasElement>(null)
  const stack = React.useRef<HTMLDivElement>(null)
  // The tile is named by its words, as they are on screen (name and robot, state, the alarm), so the name a voice-control
  // user reads off it is the one that works. The picture's own overlays repeat the state and are left out of the name;
  // a stalled feed's last frame time is added, and a paused tile says why instead of repeating Paused.
  const lastFrame = playing && state === "stalled" && lastFrameAt !== null ? feedLabels.lastFrame(feedLabels.formatTime(new Date(lastFrameAt))) : null
  return (
    <li data-slot="camera-wall-tile" data-camera-id={camera.id} data-state={state} className={cn("min-w-0", className)}>
      <div
        role="button"
        tabIndex={tabbable ? 0 : -1}
        aria-describedby={keysId}
        onClick={onOpen}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        className="press flex h-full cursor-pointer flex-col gap-2 rounded-lg p-1 hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {/* The name wraps rather than cutting the robot off; the pictures of a row stay level at the bottom. */}
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1 pt-1 text-sm">
          <p className="min-w-0 break-words">
            <span className="font-medium">{camera.label}</span>
            {camera.source && <span className="text-muted-foreground"> · {camera.source}</span>}
          </p>
          <span aria-hidden={playing ? undefined : true} className="flex shrink-0">
            <CameraFeedStateLine state={state} labels={feedLabels} />
          </span>
          {lastFrame && <span className="sr-only">, {lastFrame}</span>}
        </div>
        <div ref={stack} className="relative mt-auto">
          {playing ? (
            <TileFeed
              camera={camera}
              stream={stream}
              src={src}
              aspectRatio={aspectRatio}
              staleAfterMs={staleAfterMs}
              feedLabels={feedLabels}
              onStateChange={onStateChange}
              onGone={onGone}
              stack={stack}
              still={still}
            />
          ) : (
            <div
              style={{ "--camera-feed-ratio": aspectRatio } as React.CSSProperties}
              className="relative aspect-(--camera-feed-ratio) w-full overflow-hidden rounded-md ring-1 ring-border"
            >
              <div className="dark absolute inset-0 bg-background">
                {camera.poster && <img src={camera.poster} alt="" className="size-full object-contain" />}
              </div>
            </div>
          )}
          {/* The last frame, drawn when the stream was let go; it stays while the tile is paused. */}
          <canvas ref={still} aria-hidden="true" hidden={playing} className="pointer-events-none absolute inset-0 size-full rounded-md object-contain" />
          {!playing && (
            <div className="dark pointer-events-none absolute inset-0 grid place-items-center rounded-md bg-(--scrim) p-3 text-foreground">
              <p className="flex items-center gap-2 rounded-sm bg-background px-3 py-2 text-center text-sm">
                <Pause aria-hidden="true" className="size-4 shrink-0" />
                {l.pausedToSave}
              </p>
            </div>
          )}
          {camera.alarm && (
            // Top-right, in the right half: a camera burns its name and clock into the top-left, and camera-feed draws nothing
            // in this corner (Paused sits top-left, the controls along the bottom, Stalled and Connecting in the middle).
            <div className="dark pointer-events-none absolute top-2 right-2 flex w-1/2 justify-end text-foreground">
              <AlarmMarker alarm={camera.alarm} labels={l} wrap className="rounded-sm bg-background px-2 py-1" />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

/** A playing tile's feed. When it is let go (paused, or the tile leaves), its frame on screen is kept as the tile's still. */
function TileFeed({
  camera,
  stream,
  src,
  aspectRatio,
  staleAfterMs,
  feedLabels,
  onStateChange,
  onGone,
  stack,
  still,
}: {
  camera: CameraWallCamera
  stream?: MediaStream
  src?: string
  aspectRatio: number
  staleAfterMs?: number
  feedLabels: CameraFeedLabels
  onStateChange: (state: CameraFeedState, at: number | null) => void
  onGone: () => void
  stack: React.RefObject<HTMLDivElement | null>
  still: React.RefObject<HTMLCanvasElement | null>
}) {
  const onGoneRef = React.useRef(onGone)
  React.useLayoutEffect(() => {
    onGoneRef.current = onGone
  })
  // A layout cleanup runs before the video leaves the page, while it still shows its last frame.
  React.useLayoutEffect(() => {
    const el = stack.current
    const canvas = still.current
    return () => {
      keepStill(el?.querySelector("video"), canvas)
      onGoneRef.current()
    }
  }, [stack, still])
  // The picture repeats the tile's state in its overlays; the tile names it once, from its own line.
  return (
    <div aria-hidden="true">
      <CameraFeed
      bare
      label={camera.label}
      source={camera.source}
      stream={stream}
      src={src}
      status={camera.status ?? (stream || src ? undefined : "connecting")}
      offlineReason={camera.offlineReason}
      staleAfterMs={staleAfterMs}
      aspectRatio={aspectRatio}
      labels={feedLabels}
      onStateChange={onStateChange}
      />
    </div>
  )
}
