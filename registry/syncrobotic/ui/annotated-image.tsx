// @syncrobotic/annotated-image v0.51.0 · update: npx shadcn add @syncrobotic/annotated-image --overwrite
"use client"

import * as React from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"

/** Where an annotation came from: a model, a person, or the last version of the same labels. */
export type AnnotationKind = "predicted" | "truth" | "previous"

/** Coordinates are in the image's own pixels (0 0 is its top-left corner), whatever size it is shown at. */
export type AnnotationShape =
  | { type: "box"; x: number; y: number; width: number; height: number }
  | { type: "point"; x: number; y: number }
  | { type: "polygon"; points: [number, number][] }
  /** A pose: `null` for a keypoint that is not visible; `skeleton` joins two keypoints by their index. */
  | { type: "keypoints"; points: ([number, number] | null)[]; skeleton?: [number, number][] }

export type Annotation = {
  id: string
  kind: AnnotationKind
  /** The class word, e.g. "person". It is what tells classes apart: never a colour. */
  label: string
  /** The model's confidence, 0–1; written after the label ("person 0.92"). */
  score?: number
  shape: AnnotationShape
  /** Read after the annotation's name on its button, e.g. where it is in a text beside the picture ("In the text: 8 zebras"). */
  description?: string
}

/** A raster layer drawn between the picture and the marks: a depth map, a segmentation mask. */
export type AnnotationOverlay = {
  src: string
  /** 0–1; default 0.5, so the picture still shows through. */
  opacity?: number
  /** What the layer is, e.g. "Depth"; read out with the picture's summary. */
  label: string
}

export type AnnotatedImageLabels = {
  /** The legend's words, and the kind in each annotation's spoken name. */
  predicted: string
  truth: string
  previous: string
  /** Names the legend for screen readers. */
  legend: string
  /** "3 annotations". */
  count: (n: number) => string
  /** One annotation as it is read out: "person, predicted, 0.92". `kind` is the legend word; `score` is already written. */
  annotation: (a: { label: string; kind: string; score?: string }) => string
  /** A score as it is written, on the picture and read out. */
  score: (n: number) => string
  /** "Layers: depth", read after the annotations when there are overlays. */
  layers: (names: string[]) => string
  /** Read out while the skeleton shows. */
  loading: string
  /** Shown in place of the picture when it cannot load. */
  failed: string
}

const defaultLabels: AnnotatedImageLabels = {
  predicted: "Predicted",
  truth: "Ground truth",
  previous: "Previous version",
  legend: "Line styles",
  count: (n) => (n === 0 ? "No annotations" : n === 1 ? "1 annotation" : `${n} annotations`),
  annotation: ({ label, kind, score }) => [label, kind.toLowerCase(), score].filter(Boolean).join(", "),
  score: (n) => n.toFixed(2),
  layers: (names) => `Layers: ${names.join(", ")}`,
  loading: "Loading picture",
  failed: "The picture could not be loaded",
}

const kinds: AnnotationKind[] = ["predicted", "truth", "previous"]
// Line style first, colour second (design-language.md, "Annotations on images"). Widths are on-screen pixels: every stroke
// is non-scaling, so a 4000 px frame shown 400 px wide keeps 2 px lines.
const style = {
  predicted: { ink: "stroke-annotate-predicted", dash: undefined, cap: undefined },
  truth: { ink: "stroke-annotate-truth", dash: "6 4", cap: undefined },
  previous: { ink: "stroke-annotate-previous", dash: "0 5", cap: "round" },
} as const
const fade = { opacity: "var(--annotate-fade)" }
const pct = (v: number, of: number) => (v / of) * 100

type Box = { l: number; t: number; r: number; b: number }
/** The shape's bounds in image pixels: where its label and focus frame go, and its place in reading order. */
function bounds(shape: AnnotationShape): Box {
  if (shape.type === "box") return { l: shape.x, t: shape.y, r: shape.x + shape.width, b: shape.y + shape.height }
  if (shape.type === "point") return { l: shape.x, t: shape.y, r: shape.x, b: shape.y }
  const pts = (shape.points as ([number, number] | null)[]).filter((p): p is [number, number] => p !== null)
  if (pts.length === 0) return { l: 0, t: 0, r: 0, b: 0 }
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return { l: Math.min(...xs), t: Math.min(...ys), r: Math.max(...xs), b: Math.max(...ys) }
}

/** The lines of a shape as one path: a box or polygon outline, or a skeleton's bones. Points have none. */
function lines(shape: AnnotationShape) {
  if (shape.type === "box") return `M${shape.x} ${shape.y}h${shape.width}v${shape.height}h${-shape.width}Z`
  if (shape.type === "polygon") return shape.points.length ? `M${shape.points.map((p) => p.join(" ")).join("L")}Z` : ""
  if (shape.type === "keypoints")
    return (shape.skeleton ?? [])
      .map(([a, b]) => [shape.points[a], shape.points[b]])
      .filter((s): s is [[number, number], [number, number]] => !!s[0] && !!s[1])
      .map(([a, b]) => `M${a.join(" ")}L${b.join(" ")}`)
      .join("")
  return ""
}
const dots = (shape: AnnotationShape): [number, number][] =>
  shape.type === "point" ? [[shape.x, shape.y]] : shape.type === "keypoints" ? shape.points.filter((p): p is [number, number] => p !== null) : []
const corners = (shape: AnnotationShape): [number, number][] =>
  shape.type === "box"
    ? [
        [shape.x, shape.y],
        [shape.x + shape.width, shape.y],
        [shape.x, shape.y + shape.height],
        [shape.x + shape.width, shape.y + shape.height],
      ]
    : shape.type === "polygon"
      ? shape.points
      : []

// A zero-length line with a round (or square) cap is a dot (or square) whose size is its stroke width, and a non-scaling
// stroke keeps that size on screen at any scale: so points and handles need no measuring.
const nub = (pts: [number, number][]) => pts.map(([x, y]) => `M${x} ${y}h0`).join("")
const ns = { vectorEffect: "non-scaling-stroke", fill: "none" } as const

/**
 * One annotation as drawn: each line twice (the halo, 2 px wider, under the ink), then its dots, then handles if selected.
 * Highlighted is the selected ink at 3 px that keeps its kind's line style and has no handles; dimmed fades it.
 */
function Mark({ a, selected, highlighted = false, dimmed = false }: { a: Annotation; selected: boolean; highlighted?: boolean; dimmed?: boolean }) {
  const s = style[a.kind]
  const d = lines(a.shape)
  const pts = dots(a.shape)
  const lit = selected || highlighted
  const width = lit ? 3 : 2
  const ink = lit ? "stroke-annotate-selected" : s.ink
  const dash = selected ? undefined : s.dash
  const cap = selected ? undefined : s.cap
  const point = a.shape.type === "point"
  // Dot sizes (diameters): a point is 10, a keypoint 8; the previous version smaller; selected and highlighted 12. Ground
  // truth is a ring: the ink, then the halo inside it.
  const size = lit ? (point ? 12 : 8) : a.kind === "previous" ? (point ? 6 : 5) : point ? 10 : 8
  const ring = !selected ? a.kind === "truth" : point
  const faded = !lit && (dimmed || a.kind === "previous")
  return (
    <g data-id={a.id} data-kind={a.kind} data-selected={selected || undefined} data-highlighted={(highlighted && !selected) || undefined} style={faded ? fade : undefined}>
      {d && (
        <>
          <path d={d} {...ns} className="stroke-annotate-halo" strokeWidth={width + 2} strokeDasharray={dash} strokeLinecap={cap} />
          <path d={d} {...ns} className={ink} strokeWidth={width} strokeDasharray={dash} strokeLinecap={cap} />
        </>
      )}
      {pts.length > 0 && (
        <>
          <path d={nub(pts)} {...ns} className="stroke-annotate-halo" strokeWidth={size + 3} strokeLinecap="round" />
          <path d={nub(pts)} {...ns} className={ink} strokeWidth={size} strokeLinecap="round" />
          {ring && <path d={nub(pts)} {...ns} className="stroke-annotate-halo" strokeWidth={size - (lit ? 6 : 4)} strokeLinecap="round" />}
        </>
      )}
      {selected && corners(a.shape).length > 0 && (
        // Square handles: a halo, the selected ink, a halo centre (12, 10, 6 px), so they read on any photo.
        <>
          <path d={nub(corners(a.shape))} {...ns} className="stroke-annotate-halo" strokeWidth={12} strokeLinecap="square" />
          <path d={nub(corners(a.shape))} {...ns} className="stroke-annotate-selected" strokeWidth={10} strokeLinecap="square" />
          <path d={nub(corners(a.shape))} {...ns} className="stroke-annotate-halo" strokeWidth={6} strokeLinecap="square" />
        </>
      )}
    </g>
  )
}

type AnnotatedImageProps = {
  /** The picture. Or pass `image` to draw your own (a canvas, a video frame). */
  src?: string
  /** The picture as an element, in place of `src`; it should fill its box (size-full). */
  image?: React.ReactNode
  /** The picture's natural size in pixels: the coordinate space of the annotations, and the box's aspect ratio. */
  width: number
  height: number
  /** What the picture is, e.g. "Camera 2, aisle 3, 14:08". The annotations are summarised after it for screen readers. */
  label: string
  annotations: Annotation[]
  /** The annotation drawn as selected: 3 px in the focus ink, with handles. */
  selectedId?: string | null
  /** Makes each annotation a button (one Tab stop, arrows move, Enter selects, Esc clears). Without it nothing is focusable. */
  onSelectedChange?: (id: string | null) => void
  /**
   * Annotations drawn highlighted (the selected ink at 3 px, in their own line style, without handles), e.g. the ones a
   * hovered word links to. While any is, the others fade to `--annotate-fade`.
   */
  highlighted?: readonly string[]
  /**
   * The annotation under the mouse, or else the one with keyboard focus; `null` when neither. Touch does not hover: a tap
   * selects. Needs `onSelectedChange` (the annotations are buttons only then).
   */
  onActiveChange?: (id: string | null) => void
  /** Which class words show on the picture. `selected` keeps a crowded picture readable; the words are still read out. */
  showLabels?: "all" | "selected" | "none"
  /** The line-style legend under the picture, for the kinds present. On by default; off when the page has its own. */
  legend?: boolean
  /** Raster layers drawn between the picture and the marks, in order. */
  overlays?: AnnotationOverlay[]
  /** Show the box at the picture's aspect ratio, breathing, until the picture and its annotations arrive. */
  loading?: boolean
  /**
   * Called once when the picture from `src` fails to load and the failed state shows, e.g. to count failures or offer a
   * retry. Not called for a picture passed as `image`, which handles its own errors.
   */
  onLoadError?: () => void
  labels?: Partial<AnnotatedImageLabels>
  className?: string
}

/**
 * Boxes, points, polygons and poses over a picture: predictions, labels, a previous version. Marks share the picture's
 * pixel space, so they line up at any size; line style carries the kind (predicted solid, ground truth dashed, previous
 * dotted) and the class is a word, never a colour. With `onSelectedChange` each annotation is a button.
 */
export function AnnotatedImage({
  src,
  image,
  width,
  height,
  label,
  annotations,
  selectedId = null,
  onSelectedChange,
  highlighted = [],
  onActiveChange,
  showLabels = "all",
  legend = true,
  overlays = [],
  loading,
  onLoadError,
  labels: labelsProp,
  className,
}: AnnotatedImageProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const failed = !!src && failedSrc === src
  // Once per failed picture: the error event and the server-rendered check below can both see the same failure.
  const fail = (from: string) => {
    if (failedSrc === from) return
    setFailedSrc(from)
    onLoadError?.()
  }
  const [active, setActive] = React.useState<string | null>(null)
  const [focused, setFocused] = React.useState<string | null>(null)
  const [hovered, setHovered] = React.useState<string | null>(null)
  const describedBy = React.useId()
  const nodes = React.useRef(new Map<string, SVGGElement>())
  const selectable = !!onSelectedChange
  const ratio = { aspectRatio: `${width} / ${height}` }

  // Reading order, top to bottom then left to right: the order the arrows move in and a screen reader reads.
  const ordered = annotations
    .map((a) => ({ a, box: bounds(a.shape) }))
    .sort((p, q) => p.box.t - q.box.t || p.box.l - q.box.l)
  const ids = ordered.map((o) => o.a.id)
  const selected = selectedId !== null && ids.includes(selectedId) ? selectedId : null
  const tabStop = (active && ids.includes(active) ? active : null) ?? selected ?? ids[0]
  const kindWord = (k: AnnotationKind) => labels[k]
  const spoken = (a: Annotation) =>
    labels.annotation({ label: a.label, kind: kindWord(a.kind), score: a.score === undefined ? undefined : labels.score(a.score) })
  const summary = [
    `${labels.count(annotations.length)}${annotations.length ? `: ${ordered.map((o) => spoken(o.a)).join("; ")}` : ""}`,
    overlays.length ? labels.layers(overlays.map((o) => o.label)) : "",
  ]
    .filter(Boolean)
    .join(". ")

  if (loading) {
    return (
      <div data-slot="annotated-image" aria-busy="true" className={cn("flex w-full flex-col gap-3", className)}>
        <p role="status" className="sr-only">
          {labels.loading}
        </p>
        <div style={ratio} className="w-full">
          <Bone className="size-full rounded-xs" />
        </div>
      </div>
    )
  }

  if (failed) {
    return (
      <div data-slot="annotated-image" className={cn("flex w-full flex-col gap-3", className)}>
        <div style={ratio} className="flex w-full flex-col items-center justify-center gap-2 rounded-xs bg-muted p-4 text-center text-sm text-muted-foreground">
          <ImageOff aria-hidden="true" className="size-6" />
          <p>
            <span className="sr-only">{label}: </span>
            {labels.failed}
          </p>
        </div>
      </div>
    )
  }

  const move = (from: string, to: number) => {
    const id = ids[Math.max(0, Math.min(ids.length - 1, to))]
    if (!id || id === from) return
    setActive(id)
    nodes.current.get(id)?.focus()
  }
  const onKey = (e: React.KeyboardEvent, id: string) => {
    const i = ids.indexOf(id)
    if (e.key === "ArrowRight" || e.key === "ArrowDown") move(id, i + 1)
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(id, i - 1)
    else if (e.key === "Home") move(id, 0)
    else if (e.key === "End") move(id, ids.length - 1)
    else if (e.key === "Enter" || e.key === " ") onSelectedChange?.(id)
    else if (e.key === "Escape" && selected !== null) onSelectedChange?.(null)
    else return
    e.preventDefault()
    // Esc that cleared a selection stops here, so it does not also close a dialog the picture sits in.
    if (e.key === "Escape") e.stopPropagation()
  }
  const keyboardFocus = (el: Element) => {
    try {
      return el.matches(":focus-visible")
    } catch {
      return true
    }
  }

  // Hover first, then keyboard focus: what the pointer is on is what the reader is looking at.
  const report = (hover: string | null, focus: string | null) => {
    const before = hovered ?? focused
    const after = hover ?? focus
    if (after !== before) onActiveChange?.(after)
  }

  // Paint order: the previous version at the bottom, then ground truth, then predictions; highlighted above the rest and
  // the selected one on top.
  const lit = new Set(highlighted.filter((id) => ids.includes(id)))
  const dimming = lit.size > 0
  const painted = kinds.flatMap((k) => ordered.filter((o) => o.a.kind === k && o.a.id !== selected && !lit.has(o.a.id)))
  const raised = kinds.flatMap((k) => ordered.filter((o) => o.a.kind === k && o.a.id !== selected && lit.has(o.a.id)))
  const selectedMark = ordered.find((o) => o.a.id === selected)
  const tagged = ordered.filter((o) => showLabels === "all" || (showLabels === "selected" && (o.a.id === selected || lit.has(o.a.id))))
  const focusedBox = focused ? ordered.find((o) => o.a.id === focused)?.box : undefined
  const present = kinds.filter((k) => annotations.some((a) => a.kind === k))

  return (
    <div data-slot="annotated-image" className={cn("flex w-full flex-col gap-3", className)}>
      <div
        role={selectable ? "group" : "img"}
        aria-label={selectable ? label : `${label}. ${summary}`}
        style={ratio}
        className="relative w-full overflow-hidden rounded-xs bg-muted"
      >
        {image ??
          (src && (
            <img
              src={src}
              alt=""
              // A page of many annotated pictures fetches only those near the screen.
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => fail(src)}
              // A picture that failed before React attached onError (server-rendered) is caught here.
              ref={(img) => {
                if (img?.complete && img.naturalWidth === 0 && img.currentSrc) fail(src)
              }}
              className="absolute inset-0 size-full"
            />
          ))}
        {overlays.map((o) => (
          <img key={o.src} src={o.src} alt="" loading="lazy" draggable={false} style={{ opacity: o.opacity ?? 0.5 }} className="pointer-events-none absolute inset-0 size-full" />
        ))}

        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {painted.map((o) => (
            <Mark key={o.a.id} a={o.a} selected={false} dimmed={dimming} />
          ))}
          {raised.map((o) => (
            <Mark key={o.a.id} a={o.a} selected={false} highlighted />
          ))}
          {selectedMark && <Mark a={selectedMark.a} selected />}
        </svg>

        {focusedBox && (
          // The keyboard position: a frame around the shape in the focus ink between two halo lines, so it reads on any
          // photo and never looks like the selected mark (3 px with handles). Under the class words, so it never hides one.
          <span
            aria-hidden="true"
            style={{
              left: `calc(${pct(focusedBox.l, width)}% - 0.75rem)`,
              top: `calc(${pct(focusedBox.t, height)}% - 0.75rem)`,
              width: `calc(${pct(focusedBox.r - focusedBox.l, width)}% + 1.5rem)`,
              height: `calc(${pct(focusedBox.b - focusedBox.t, height)}% + 1.5rem)`,
            }}
            className="pointer-events-none absolute rounded-2xs border-2 border-ring ring-2 ring-annotate-halo inset-ring-2 inset-ring-annotate-halo"
          />
        )}

        {/* Class words in HTML, placed in percentages, so they stay 12 px at any size. Each kind has its own place, so a
            prediction and its ground truth on the same object never stack their words: predicted above the top-left
            corner, ground truth below the bottom-left, the previous version inside the top-left. */}
        {tagged.length > 0 && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {tagged.map(({ a, box }) => {
              const l = pct(box.l, width)
              const right = l > 70
              const point = a.shape.type === "point"
              const top =
                point || a.kind === "predicted"
                  ? `max(0px, calc(${pct(box.t, height)}% - ${point ? "1.75rem" : "1.25rem"}))`
                  : a.kind === "truth"
                    ? `min(${pct(box.b, height)}%, calc(100% - 1.25rem))`
                    : `min(${pct(box.t, height)}%, calc(100% - 1.25rem))`
              return (
                <span
                  key={a.id}
                  style={{
                    top,
                    ...(right ? { right: `${100 - pct(box.r, width)}%` } : { left: `${l}%` }),
                    maxWidth: `${right ? pct(box.r, width) : 100 - l}%`,
                  }}
                  className="absolute block h-5 truncate rounded-2xs bg-annotate-halo px-1 text-xs leading-5 font-medium text-foreground tabular-nums"
                >
                  {a.label}
                  {a.score !== undefined && ` ${labels.score(a.score)}`}
                </span>
              )
            })}
          </div>
        )}

        {selectable && (
          <svg
            role="none"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
            // A click on the picture itself, away from every shape, clears the selection.
            onClick={(e) => e.target === e.currentTarget && selected !== null && onSelectedChange?.(null)}
          >
            {ordered.map(({ a }, i) => {
              const d = lines(a.shape)
              const pts = dots(a.shape)
              return (
                <g
                  key={a.id}
                  ref={(el) => {
                    if (el) nodes.current.set(a.id, el)
                    else nodes.current.delete(a.id)
                  }}
                  role="button"
                  tabIndex={a.id === tabStop ? 0 : -1}
                  aria-label={spoken(a)}
                  aria-describedby={a.description ? `${describedBy}-${i}` : undefined}
                  aria-pressed={a.id === selected}
                  onClick={() => {
                    setActive(a.id)
                    onSelectedChange?.(a.id)
                  }}
                  onKeyDown={(e) => onKey(e, a.id)}
                  onFocus={(e) => {
                    setActive(a.id)
                    if (!keyboardFocus(e.currentTarget)) return
                    setFocused(a.id)
                    report(hovered, a.id)
                  }}
                  onBlur={() => {
                    setFocused(null)
                    report(hovered, null)
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "touch") return
                    setHovered(a.id)
                    report(a.id, focused)
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === "touch") return
                    setHovered(null)
                    report(null, focused)
                  }}
                  // focus-ring: drawn as an HTML frame around the shape (focusedBox above), in the focus ink between two halo
                  // lines; the browser's own outline would be a thin line that disappears on a dark photo.
                  className="cursor-pointer outline-none"
                >
                  {/* The hit area: the shape's line plus a margin (16 px wide, 24 on touch); a point is 36 px, 44 on touch. */}
                  {d && (
                    <path
                      d={d}
                      {...ns}
                      stroke="transparent"
                      pointerEvents="stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="[stroke-width:--spacing(4)] any-pointer-coarse:[stroke-width:--spacing(6)]"
                    />
                  )}
                  {pts.length > 0 && (
                    <path
                      d={nub(pts)}
                      {...ns}
                      stroke="transparent"
                      pointerEvents="stroke"
                      strokeLinecap="round"
                      className={cn(
                        a.shape.type === "point"
                          ? "[stroke-width:var(--h-sm)] any-pointer-coarse:[stroke-width:var(--h-md)]"
                          : "[stroke-width:--spacing(4)] any-pointer-coarse:[stroke-width:--spacing(6)]",
                      )}
                    />
                  )}
                </g>
              )
            })}
          </svg>
        )}
        {selectable && annotations.some((a) => a.description) && (
          <div hidden>
            {ordered.map(({ a }, i) => a.description && <span key={a.id} id={`${describedBy}-${i}`}>{a.description}</span>)}
          </div>
        )}
      </div>
      {legend && present.length > 0 && <AnnotationLegend kinds={present} labels={labels} />}
    </div>
  )
}

/**
 * The legend for annotations: a sample of each line with its word, so the kinds read without colour. AnnotatedImage shows
 * it under the picture; use it on its own beside several pictures or in a toolbar. List only the kinds on screen.
 */
export function AnnotationLegend({
  kinds: shown = kinds,
  labels: labelsProp,
  className,
}: {
  /** The kinds to list, in this order: predicted, ground truth, previous version. */
  kinds?: AnnotationKind[]
  labels?: Partial<Pick<AnnotatedImageLabels, "predicted" | "truth" | "previous" | "legend">>
  className?: string
}) {
  const labels = { ...defaultLabels, ...labelsProp }
  return (
    <ul data-slot="annotation-legend" aria-label={labels.legend} className={cn("flex flex-wrap gap-x-4 gap-y-2 text-sm", className)}>
      {kinds
        .filter((k) => shown.includes(k))
        .map((k) => {
          const s = style[k]
          const line = { x1: 3, y1: 8, x2: 29, y2: 8, strokeDasharray: s.dash, strokeLinecap: s.cap }
          return (
            <li key={k} className="flex items-center gap-2">
              {/* The line on a halo-coloured plate, as it is drawn on the picture. */}
              <svg viewBox="0 0 32 16" aria-hidden="true" className="h-4 w-8 shrink-0 rounded-2xs bg-annotate-halo ring-1 ring-border">
                <g style={k === "previous" ? fade : undefined}>
                  <line {...line} className={s.ink} strokeWidth={2} />
                </g>
              </svg>
              <span>{labels[k]}</span>
            </li>
          )
        })}
    </ul>
  )
}
