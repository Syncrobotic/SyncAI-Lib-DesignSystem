// @syncrobotic/grounded-text v0.31.0 · update: npx shadcn add @syncrobotic/grounded-text --overwrite
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  AnnotatedImage,
  type AnnotatedImageLabels,
  type Annotation,
  type AnnotationKind,
  type AnnotationOverlay,
} from "@/registry/syncrobotic/ui/annotated-image"

/*
  Text whose words point at places on a picture, as a vision-language model answers: a caption where each object's name
  matches a box, or reasoning where "8 zebras" is linked to 8 points. The picture is annotated-image; the text is beside it
  from 48 rem of width (the container's, not the window's), under it on a phone.

  Hover or focus a span and its marks are drawn highlighted (the selected ink, 3 px) while the rest fade; hover or focus a
  mark and the spans that point at it are highlighted. A click or tap, Enter or Space pins one, so it stays after the
  pointer leaves (touch has no hover); again, or Esc, lets it go.

  Spans are role="button" on an inline span, not a native button: that one is laid out inline-block and cannot wrap across
  lines, so a long span would break the paragraph on a phone. Each is named by its own words and described by where its
  marks are ("8 points on the image"); each mark is described by the words that point at it ("In the text: 8 zebras").
*/

/** A run of the text, by character offsets (as `start_idx` / `end_idx` from a model): `text.slice(start, end)`. */
export type GroundedSpan = {
  start: number
  end: number
  /** The ids of the annotations it points at. */
  marks: string[]
}

/** What is pinned: a span (its index in `spans`) or a mark (its annotation id). */
export type GroundedPin = { span: number } | { mark: string }

export type GroundedTextLabels = {
  /** A span's description, read after its words: "8 points on the image", "2 boxes and 1 point on the image". */
  marks: (count: { points: number; boxes: number; shapes: number }) => string
  /** A mark's description, read after its name: the words that point at it. */
  linked: (words: string[]) => string
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const defaultLabels: GroundedTextLabels = {
  marks: ({ points, boxes, shapes }) => {
    const parts = [boxes && plural(boxes, "box", "boxes"), points && plural(points, "point", "points"), shapes && plural(shapes, "shape", "shapes")].filter(Boolean)
    return `${parts.join(" and ")} on the image`
  },
  linked: (words) => `In the text: ${words.join("; ")}`,
}

/** One grounding as a model writes it: offsets into the text, and points or boxes on the picture. */
export type Grounding = {
  start_idx?: number
  end_idx?: number
  start?: number
  end?: number
  /** `[x, y]` or `{ x, y }`. */
  points?: ([number, number] | { x: number; y: number })[]
  /** Corners, `[x1, y1, x2, y2]`. */
  boxes?: [number, number, number, number][]
  /** The class word on each mark; the span's own words by default. */
  label?: string
}

/**
 * Turns a model's groundings into GroundedText's `annotations` and `spans`. Coordinates are scaled from `scale` (1 for
 * normalised 0–1, 100 for percent, 1000 for 0–1000) to the picture's pixels; leave `scale` out when they are pixels.
 */
export function fromGrounding(
  text: string,
  groundings: readonly Grounding[],
  options: { width: number; height: number; scale?: number; kind?: AnnotationKind; score?: number; idPrefix?: string },
): { annotations: Annotation[]; spans: GroundedSpan[] } {
  const { width, height, scale, kind = "predicted", score, idPrefix = "g" } = options
  const sx = scale ? width / scale : 1
  const sy = scale ? height / scale : 1
  const annotations: Annotation[] = []
  const spans = groundings.map((g, i) => {
    const start = g.start_idx ?? g.start ?? 0
    const end = g.end_idx ?? g.end ?? start
    const label = g.label ?? text.slice(start, end).trim()
    const marks: string[] = []
    const add = (shape: Annotation["shape"]) => {
      const id = `${idPrefix}${i}-${marks.length}`
      marks.push(id)
      annotations.push({ id, kind, label, score, shape })
    }
    for (const p of g.points ?? []) {
      const [x, y] = Array.isArray(p) ? p : [p.x, p.y]
      add({ type: "point", x: x * sx, y: y * sy })
    }
    for (const [x1, y1, x2, y2] of g.boxes ?? []) {
      add({ type: "box", x: Math.min(x1, x2) * sx, y: Math.min(y1, y2) * sy, width: Math.abs(x2 - x1) * sx, height: Math.abs(y2 - y1) * sy })
    }
    return { start, end, marks }
  })
  return { annotations, spans }
}

type Run = { from: number; to: number; span?: number; marks: string[] }
/** The text cut into plain runs and spans, in order. Spans are clamped to the text; one that overlaps the one before starts where it ends. */
function runs(text: string, spans: readonly GroundedSpan[], ids: Set<string>): Run[] {
  const order = spans
    .map((s, i) => ({ i, start: Math.max(0, Math.min(text.length, s.start)), end: Math.max(0, Math.min(text.length, s.end)), marks: s.marks.filter((m) => ids.has(m)) }))
    .sort((a, b) => a.start - b.start || a.i - b.i)
  const out: Run[] = []
  let at = 0
  for (const s of order) {
    const from = Math.max(at, s.start)
    if (s.end <= from) continue
    if (from > at) out.push({ from: at, to: from, marks: [] })
    // A span whose marks are not on the picture is plain text: there is nothing to point at.
    out.push(s.marks.length ? { from, to: s.end, span: s.i, marks: s.marks } : { from, to: s.end, marks: [] })
    at = s.end
  }
  if (at < text.length) out.push({ from: at, to: text.length, marks: [] })
  return out
}

type GroundedTextProps = {
  /** The answer or caption. Line breaks are kept. */
  text: string
  spans: GroundedSpan[]
  /** The marks the spans point at (points, boxes or any shape), in the picture's pixels. `fromGrounding` builds both. */
  annotations: Annotation[]
  /** The picture, as in annotated-image: `src` or `image`, its natural `width` and `height`, and what it is in `label`. */
  src?: string
  image?: React.ReactNode
  width: number
  height: number
  label: string
  /** Class words on the picture. None by default: the text says what each mark is; "selected" shows the highlighted ones. */
  showLabels?: "all" | "selected" | "none"
  /** annotated-image's line-style legend, for the kinds present. Off by default: a model's answer has one kind. */
  legend?: boolean
  overlays?: AnnotationOverlay[]
  loading?: boolean
  /** Pinned at first (uncontrolled), or controlled with `onPinnedChange`. */
  defaultPinned?: GroundedPin | null
  pinned?: GroundedPin | null
  onPinnedChange?: (pin: GroundedPin | null) => void
  labels?: Partial<GroundedTextLabels>
  /** annotated-image's words (`annotatedImageLabels` in labels-zh-tw). */
  imageLabels?: Partial<AnnotatedImageLabels>
  className?: string
}

const samePin = (a: GroundedPin | null, b: GroundedPin | null) =>
  !!a && !!b && ("span" in a ? "span" in b && a.span === b.span : "mark" in b && a.mark === b.mark)

/**
 * A picture and the text that points at it, linked both ways: a span highlights its marks, a mark its spans. For a
 * vision-language model's caption or reasoning, or any review screen that shows words beside an annotated picture.
 */
export function GroundedText({
  text,
  spans,
  annotations,
  src,
  image,
  width,
  height,
  label,
  showLabels = "none",
  legend = false,
  overlays,
  loading,
  defaultPinned = null,
  pinned: pinnedProp,
  onPinnedChange,
  labels: labelsProp,
  imageLabels,
  className,
}: GroundedTextProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const descId = React.useId()
  const [ownPin, setOwnPin] = React.useState<GroundedPin | null>(defaultPinned)
  const pinned = pinnedProp === undefined ? ownPin : pinnedProp
  const [spanHover, setSpanHover] = React.useState<number | null>(null)
  const [spanFocus, setSpanFocus] = React.useState<number | null>(null)
  const [markActive, setMarkActive] = React.useState<string | null>(null)

  const byId = new Map(annotations.map((a) => [a.id, a]))
  const cut = runs(text, spans, new Set(byId.keys()))
  const linked = cut.filter((r) => r.span !== undefined)
  const words = (r: Run) => text.slice(r.from, r.to).replace(/\s+/g, " ").trim()

  const setPin = (pin: GroundedPin | null) => {
    if (pinnedProp === undefined) setOwnPin(pin)
    onPinnedChange?.(pin)
  }
  const toggle = (pin: GroundedPin) => setPin(samePin(pinned, pin) ? null : pin)

  // What is shown: the pointer first, then a mark under the keyboard, then a span under it, then what is pinned.
  const shown: GroundedPin | null =
    spanHover !== null ? { span: spanHover } : markActive !== null ? { mark: markActive } : spanFocus !== null ? { span: spanFocus } : pinned
  const litMarks = !shown ? [] : "mark" in shown ? [shown.mark] : (linked.find((r) => r.span === shown.span)?.marks ?? [])
  const litSpan = (r: Run) => !!shown && ("span" in shown ? r.span === shown.span : r.marks.includes(shown.mark))

  const count = (marks: string[]) => {
    const n = { points: 0, boxes: 0, shapes: 0 }
    for (const id of marks) {
      const t = byId.get(id)?.shape.type
      if (t === "point") n.points++
      else if (t === "box") n.boxes++
      else n.shapes++
    }
    return labels.marks(n)
  }
  const described = annotations.map((a) => {
    const from = linked.filter((r) => r.marks.includes(a.id)).map(words)
    return from.length ? { ...a, description: labels.linked(from) } : a
  })

  return (
    <div data-slot="grounded-text" className={cn("@container w-full", className)}>
      <div className="grid gap-4 @3xl:grid-cols-2 @3xl:items-start @3xl:gap-6">
        <AnnotatedImage
          src={src}
          image={image}
          width={width}
          height={height}
          label={label}
          annotations={described}
          overlays={overlays}
          loading={loading}
          showLabels={showLabels}
          legend={legend}
          labels={imageLabels}
          selectedId={pinned && "mark" in pinned ? pinned.mark : null}
          onSelectedChange={(id) => (id === null ? pinned && "mark" in pinned && setPin(null) : toggle({ mark: id }))}
          highlighted={litMarks}
          onActiveChange={setMarkActive}
        />
        <p
          data-slot="grounded-text-text"
          className="min-w-0 text-base leading-7 break-words whitespace-pre-line any-pointer-coarse:leading-(--h-md)"
        >
          {cut.map((r) => {
            const t = text.slice(r.from, r.to)
            if (r.span === undefined) return <React.Fragment key={r.from}>{t}</React.Fragment>
            const i = r.span
            const pin = { span: i }
            const lit = litSpan(r)
            return (
              <span
                key={r.from}
                role="button"
                tabIndex={0}
                aria-pressed={samePin(pinned, pin)}
                aria-describedby={`${descId}-${i}`}
                data-active={lit || undefined}
                onClick={() => toggle(pin)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggle(pin)
                  else if (e.key === "Escape" && pinned) {
                    // Esc that let a pin go stops here, so it does not also close a dialog around it.
                    e.stopPropagation()
                    setPin(null)
                  } else return
                  e.preventDefault()
                }}
                onPointerEnter={(e) => e.pointerType !== "touch" && setSpanHover(i)}
                onPointerLeave={(e) => e.pointerType !== "touch" && setSpanHover(null)}
                onFocus={(e) => {
                  // Keyboard focus shows the span's marks; a click is a pin, so letting go of it shows the pin is gone.
                  let keyboard = true
                  try {
                    keyboard = e.currentTarget.matches(":focus-visible")
                  } catch {}
                  if (keyboard) setSpanFocus(i)
                }}
                onBlur={() => setSpanFocus(null)}
                // Underlined so it reads as linked without colour: dotted and quiet at rest, solid and thick in the focus
                // ink when lit. On touch each line is 44 px and the padding fills it, so a tap lands on the span.
                className={cn(
                  "cursor-pointer rounded-2xs underline decoration-muted-foreground decoration-dotted decoration-1 underline-offset-4 box-decoration-clone",
                  "transition-[background-color,text-decoration-color] duration-(--motion-fast) ease-(--ease-standard)",
                  "hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring any-pointer-coarse:py-3",
                  "aria-pressed:decoration-solid aria-pressed:decoration-2 aria-pressed:decoration-annotate-selected",
                  lit && "bg-accent decoration-solid decoration-2 decoration-annotate-selected",
                )}
              >
                {t}
              </span>
            )
          })}
        </p>
      </div>
      <div hidden>
        {linked.map((r) => (
          <span key={r.span} id={`${descId}-${r.span}`}>
            {count(r.marks)}
          </span>
        ))}
      </div>
    </div>
  )
}
