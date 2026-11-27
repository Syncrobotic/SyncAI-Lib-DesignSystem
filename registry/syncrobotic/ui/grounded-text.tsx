// @syncrobotic/grounded-text v0.51.0 · update: npx shadcn add @syncrobotic/grounded-text --overwrite
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
import { prefersReducedMotion } from "@/registry/syncrobotic/hooks/use-reduced-motion"

/*
  Words that point at places on a picture (annotated-image), as a vision model answers: beside it from 42 rem of container
  width, under it on a phone. Hover or focus highlights a span's marks or a mark's spans; a click, Enter or Space pins one
  (touch has no hover), and pinning scrolls its marks into view. GroundedTextBody is the text alone, wired to a picture in
  another panel with `groundedImageProps`. Spans are role="button" on an inline span, since a native button is
  inline-block and cannot wrap across lines; each is described by where its marks are ("8 points on the image").
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

/** What is shown: the span under the pointer or keyboard first, then the mark under them on the picture, then what is pinned. */
const shownOf = (activeSpan: number | null, activeMark: string | null, pinned: GroundedPin | null): GroundedPin | null =>
  activeSpan !== null ? { span: activeSpan } : activeMark !== null ? { mark: activeMark } : pinned

const samePin = (a: GroundedPin | null, b: GroundedPin | null) =>
  !!a && !!b && ("span" in a ? "span" in b && a.span === b.span : "mark" in b && a.mark === b.mark)

/** The nearest ancestor that scrolls vertically, or null for the page. */
function scrollParent(el: Element): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    const y = getComputedStyle(p).overflowY
    if ((y === "auto" || y === "scroll" || y === "overlay") && p.scrollHeight > p.clientHeight) return p
  }
  return null
}

/**
 * Scrolls the marks with these ids, found in `picture`, into their scrolling panel's view, the top of them first when they
 * do not all fit. When the span scrolls with them (one panel, or the page), it is never scrolled out of view to do it.
 */
function reveal(picture: Element | null | undefined, ids: readonly string[], span: Element) {
  if (!picture || !ids.length) return
  const marks = [...picture.querySelectorAll<SVGGElement>("g[data-id]")].filter((g) => ids.includes(g.dataset.id ?? ""))
  const [first] = marks
  if (!first) return
  const rects = marks.map((m) => m.getBoundingClientRect())
  const top = Math.min(...rects.map((r) => r.top))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  const scroller = scrollParent(first)
  const port = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
  let by = top < port.top ? top - port.top : bottom > port.bottom ? Math.min(bottom - port.bottom, top - port.top) : 0
  if (!scroller || scroller.contains(span)) {
    const s = span.getBoundingClientRect()
    by = by < 0 ? Math.min(0, Math.max(by, s.bottom - port.bottom)) : Math.max(0, Math.min(by, s.top - port.top))
  }
  if (!by) return
  const reduce = prefersReducedMotion(true)
  const options: ScrollToOptions = { top: by, behavior: reduce ? "auto" : "smooth" }
  if (scroller) scroller.scrollBy?.(options)
  else window.scrollBy?.(options)
}

/**
 * Props linking an annotated-image to GroundedTextBody in separate panels. Give the picture's `onActiveChange` to the
 * text's `activeMark`, the text's `onActiveChange` here as `activeSpan`, and share `pinned`.
 */
export function groundedImageProps({
  text,
  spans,
  annotations,
  pinned,
  onPinnedChange,
  activeSpan = null,
  activeMark = null,
  labels: labelsProp,
}: {
  text: string
  spans: readonly GroundedSpan[]
  annotations: readonly Annotation[]
  pinned: GroundedPin | null
  onPinnedChange: (pin: GroundedPin | null) => void
  activeSpan?: number | null
  activeMark?: string | null
  labels?: Partial<GroundedTextLabels>
}): { annotations: Annotation[]; highlighted: string[]; selectedId: string | null; onSelectedChange: (id: string | null) => void } {
  const labels = { ...defaultLabels, ...labelsProp }
  const linked = runs(text, spans, new Set(annotations.map((a) => a.id))).filter((r) => r.span !== undefined)
  const words = (r: Run) => text.slice(r.from, r.to).replace(/\s+/g, " ").trim()
  const shown = shownOf(activeSpan, activeMark, pinned)
  return {
    annotations: annotations.map((a) => {
      const from = linked.filter((r) => r.marks.includes(a.id)).map(words)
      return from.length ? { ...a, description: labels.linked(from) } : a
    }),
    highlighted: !shown ? [] : "mark" in shown ? [shown.mark] : (linked.find((r) => r.span === shown.span)?.marks ?? []),
    selectedId: pinned && "mark" in pinned ? pinned.mark : null,
    onSelectedChange: (id) => {
      if (id !== null) onPinnedChange(samePin(pinned, { mark: id }) ? null : { mark: id })
      else if (pinned && "mark" in pinned) onPinnedChange(null)
    },
  }
}

type GroundedTextBodyProps = {
  /** The answer or caption. Line breaks are kept. */
  text: string
  spans: GroundedSpan[]
  /** The marks the spans point at: the list given to the annotated-image (only each one's `id` and `shape` are read). */
  annotations: readonly Pick<Annotation, "id" | "shape">[]
  /** The mark under the pointer or keyboard on the picture (its `onActiveChange`): the spans that point at it light up. */
  activeMark?: string | null
  /**
   * The span under the mouse, or else the one with keyboard focus (its index in `spans`); `null` when neither. Touch does not
   * hover: a tap pins. Give it to `groundedImageProps` as `activeSpan`.
   */
  onActiveChange?: (span: number | null) => void
  /** Pinned at first (uncontrolled), or controlled with `onPinnedChange`. Control it when the picture is elsewhere, so a pinned mark lights its spans. */
  defaultPinned?: GroundedPin | null
  pinned?: GroundedPin | null
  onPinnedChange?: (pin: GroundedPin | null) => void
  /** The element around the linked annotated-image: pinning a span scrolls its marks into view there when they are scrolled out. */
  picture?: React.RefObject<Element | null>
  labels?: Partial<GroundedTextLabels>
  className?: string
}

/**
 * GroundedText's text alone, its spans linked to the marks of an annotated-image shown elsewhere on the page (another
 * panel) through `onActiveChange`, `activeMark` and `pinned`; `groundedImageProps` gives the picture its side.
 */
export function GroundedTextBody({
  text,
  spans,
  annotations,
  activeMark = null,
  onActiveChange,
  defaultPinned = null,
  pinned: pinnedProp,
  onPinnedChange,
  picture,
  labels: labelsProp,
  className,
}: GroundedTextBodyProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const descId = React.useId()
  const [ownPin, setOwnPin] = React.useState<GroundedPin | null>(defaultPinned)
  const pinned = pinnedProp === undefined ? ownPin : pinnedProp
  const [hovered, setHovered] = React.useState<number | null>(null)
  const [focused, setFocused] = React.useState<number | null>(null)

  const types = new Map(annotations.map((a) => [a.id, a.shape.type]))
  const cut = runs(text, spans, new Set(types.keys()))
  const linked = cut.filter((r) => r.span !== undefined)

  const setPin = (pin: GroundedPin | null) => {
    if (pinnedProp === undefined) setOwnPin(pin)
    onPinnedChange?.(pin)
  }
  // A pin (never a hover or focus) brings the span's marks into view when the picture's panel has them scrolled out.
  const pinSpan = (r: Run, el: Element) => {
    const pin = { span: r.span ?? -1 }
    if (samePin(pinned, pin)) return setPin(null)
    setPin(pin)
    reveal(picture?.current, r.marks, el)
  }
  // Hover first, then keyboard focus, as annotated-image reports its marks.
  const report = (hover: number | null, focus: number | null) => {
    const before = hovered ?? focused
    const after = hover ?? focus
    if (after !== before) onActiveChange?.(after)
  }

  const shown = shownOf(hovered ?? focused, activeMark, pinned)
  const litSpan = (r: Run) => !!shown && ("span" in shown ? r.span === shown.span : r.marks.includes(shown.mark))

  const count = (marks: string[]) => {
    const n = { points: 0, boxes: 0, shapes: 0 }
    for (const id of marks) {
      const t = types.get(id)
      if (t === "point") n.points++
      else if (t === "box") n.boxes++
      else n.shapes++
    }
    return labels.marks(n)
  }

  return (
    <div data-slot="grounded-text-body" className={cn("min-w-0", className)}>
      <p data-slot="grounded-text-text" className="min-w-0 text-base leading-7 break-words whitespace-pre-line">
        {cut.map((r) => {
          const t = text.slice(r.from, r.to)
          if (r.span === undefined) return <React.Fragment key={r.from}>{t}</React.Fragment>
          const i = r.span
          const lit = litSpan(r)
          return (
            <span
              key={r.from}
              data-slot="grounded-text-span"
              role="button"
              tabIndex={0}
              aria-pressed={samePin(pinned, { span: i })}
              aria-describedby={`${descId}-${i}`}
              data-active={lit || undefined}
              onClick={(e) => pinSpan(r, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") pinSpan(r, e.currentTarget)
                else if (e.key === "Escape" && pinned) {
                  // Esc that let a pin go stops here, so it does not also close a dialog around it.
                  e.stopPropagation()
                  setPin(null)
                } else return
                e.preventDefault()
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === "touch") return
                setHovered(i)
                report(i, focused)
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "touch") return
                setHovered(null)
                report(null, focused)
              }}
              onFocus={(e) => {
                // Keyboard focus shows the span's marks; a click is a pin, so letting go of it shows the pin is gone.
                let keyboard = true
                try {
                  keyboard = e.currentTarget.matches(":focus-visible")
                } catch {}
                if (!keyboard) return
                setFocused(i)
                report(hovered, i)
              }}
              onBlur={() => {
                setFocused(null)
                report(hovered, null)
              }}
              // Underlined so it reads as linked without colour: dotted and quiet at rest, solid and thick in the focus
              // ink when lit. The text keeps its reading leading on touch too (inline targets in a sentence are exempt from the
              // 44 px rule, WCAG 2.5.8); its padding reaches into the gap between lines, without moving them, so a tap still lands.
              className={cn(
                "cursor-pointer rounded-2xs underline decoration-muted-foreground decoration-dotted decoration-1 underline-offset-4 box-decoration-clone",
                "transition-[background-color,text-decoration-color] duration-(--motion-fast) ease-(--ease-standard)",
                "hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring any-pointer-coarse:py-1",
                "aria-pressed:decoration-solid aria-pressed:decoration-2 aria-pressed:decoration-annotate-selected",
                lit && "bg-accent decoration-solid decoration-2 decoration-annotate-selected",
              )}
            >
              {t}
            </span>
          )
        })}
      </p>
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

/**
 * A picture and the text that points at it, linked both ways: a span highlights its marks, a mark its spans. For a vision
 * model's caption or reasoning beside an annotated picture.
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
  labels,
  imageLabels,
  className,
}: GroundedTextProps) {
  const [ownPin, setOwnPin] = React.useState<GroundedPin | null>(defaultPinned)
  const pinned = pinnedProp === undefined ? ownPin : pinnedProp
  const [activeSpan, setActiveSpan] = React.useState<number | null>(null)
  const [activeMark, setActiveMark] = React.useState<string | null>(null)
  const root = React.useRef<HTMLDivElement>(null)
  const setPin = (pin: GroundedPin | null) => {
    if (pinnedProp === undefined) setOwnPin(pin)
    onPinnedChange?.(pin)
  }
  const linked = groundedImageProps({ text, spans, annotations, pinned, onPinnedChange: setPin, activeSpan, activeMark, labels })

  // Beside the picture from @2xl (42 rem): two columns of about 324 px at the threshold, 348 px at a 720 px canvas, a phone's
  // reading width each; at @xl (36 rem) the text would be 276 px.
  return (
    <div ref={root} data-slot="grounded-text" className={cn("@container w-full", className)}>
      <div className="grid gap-4 @2xl:grid-cols-2 @2xl:items-start @2xl:gap-6">
        <AnnotatedImage
          src={src}
          image={image}
          width={width}
          height={height}
          label={label}
          {...linked}
          overlays={overlays}
          loading={loading}
          showLabels={showLabels}
          legend={legend}
          labels={imageLabels}
          onActiveChange={setActiveMark}
        />
        <GroundedTextBody
          text={text}
          spans={spans}
          annotations={annotations}
          activeMark={activeMark}
          onActiveChange={setActiveSpan}
          pinned={pinned}
          onPinnedChange={setPin}
          picture={root}
          labels={labels}
        />
      </div>
    </div>
  )
}
