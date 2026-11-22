// @syncrobotic/image-grid v0.28.0 · update: npx shadcn add @syncrobotic/image-grid --overwrite
"use client"

import * as React from "react"
import { Check, ChevronLeft, ChevronRight, ImageOff, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/registry/syncrobotic/ui/dialog"
import { RestrictedPreview } from "@/registry/syncrobotic/ui/restricted-preview"
import { Bone } from "@/registry/syncrobotic/shell/skeleton"

export type ImageGridItem = {
  id: string
  /** The thumbnail. */
  src: string
  /** A larger picture for the lightbox; the thumbnail when left out. */
  fullSrc?: string
  /** What the picture shows, for screen readers, e.g. "Forklift in aisle 3, two people". */
  alt: string
  /** The file name: shown when the picture cannot load, and as the lightbox's title. */
  name: string
  /** One line under the picture in the lightbox: where, when, the labels on it. */
  caption?: React.ReactNode
  /** The viewer must ask to see it (faces, number plates, a restricted tier): shown through RestrictedPreview until they do. */
  restricted?: boolean
  /** Why it is hidden, e.g. "T2 · faces". */
  reason?: string
}

export type ImageGridLabels = {
  /** Read out while the skeleton shows. */
  loading: string
  /** Read before the file name of a picture that could not load. */
  broken: string
  /** The button on a hidden picture. */
  reveal: string
  /** The corner button that opens the lightbox while picking. */
  viewLarger: (name: string) => string
  previous: string
  next: string
  close: string
  /** "3 of 24". */
  position: (n: number, total: number) => string
}

const defaultLabels: ImageGridLabels = {
  loading: "Loading pictures",
  broken: "Could not load",
  reveal: "Show picture",
  viewLarger: (name) => `View ${name} larger`,
  previous: "Previous",
  next: "Next",
  close: "Close",
  position: (n, total) => `${n} of ${total}`,
}

const aspects = { square: "aspect-square", "4/3": "aspect-4/3", video: "aspect-video" } as const
// Grid: as many columns as fit at the tile's smallest width. Strip: fixed widths, so a row of uploads keeps its rhythm.
const gridSizes = {
  sm: "grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]",
  md: "grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]",
  lg: "grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]",
} as const
const stripSizes = { sm: "w-24", md: "w-36", lg: "w-48" } as const

type ImageGridProps = {
  items: ImageGridItem[]
  /** Names the collection for screen readers, e.g. "Images in Forklift aisles v3". */
  label: string
  /** grid: rows of tiles that fill the width. strip: one row that scrolls sideways and snaps to each tile. */
  layout?: "grid" | "strip"
  /** Every tile keeps this shape before and after its picture loads, so nothing jumps. */
  aspect?: keyof typeof aspects
  /** The smallest a tile gets (grid) or its width (strip): 96, 144 or 192 px. */
  size?: keyof typeof gridSizes
  /** Show skeleton tiles instead of the items. */
  loading?: boolean
  /** How many skeleton tiles; default 8 (grid) or 4 (strip). */
  loadingCount?: number
  /** none: a tile opens the lightbox. single or multiple: a tile is picked, and a corner button opens the lightbox. */
  selection?: "none" | "single" | "multiple"
  /** Picked ids (controlled). */
  selected?: string[]
  defaultSelected?: string[]
  onSelectedChange?: (ids: string[]) => void
  /** Open pictures in a lightbox. On by default. */
  lightbox?: boolean
  /** Called when someone asks to see a hidden picture, e.g. to log the view. */
  onReveal?: (item: ImageGridItem) => void
  labels?: Partial<ImageGridLabels>
  className?: string
}

/**
 * Many pictures at once: a dataset's images, the frames of a run, what was just uploaded. Tiles hold their shape
 * (`aspect`) and load lazily. A tile opens a lightbox (← → to move, Esc to close, focus returns to the tile), or, with
 * `selection`, is picked: ringed in the focus ink with a check. Many: each tile is a toggle (`aria-pressed`, a box). One: the
 * tiles are a radio group (`role="radio"`, a round mark, one Tab stop; the arrow keys, Home and End move and pick). Hidden pictures stay unloaded behind
 * RestrictedPreview until someone asks; one that fails shows its file name. Neutral throughout: colour is for faults.
 */
export function ImageGrid({
  items,
  label,
  layout = "grid",
  aspect = "4/3",
  size = "md",
  loading,
  loadingCount,
  selection = "none",
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  lightbox = true,
  onReveal,
  labels: labelsProp,
  className,
}: ImageGridProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [selectedState, setSelectedState] = React.useState(defaultSelected)
  const selected = selectedProp ?? selectedState
  const [broken, setBroken] = React.useState<Set<string>>(() => new Set())
  const [revealed, setRevealed] = React.useState<Set<string>>(() => new Set())
  const [open, setOpen] = React.useState<number | null>(null)
  const last = React.useRef(0)
  const tiles = React.useRef(new Map<string, HTMLLIElement>())
  const focusAfterReveal = React.useRef<string | null>(null)
  const picking = selection !== "none"
  const single = selection === "single"
  const strip = layout === "strip"

  const markBroken = (id: string) => setBroken((s) => (s.has(id) ? s : new Set(s).add(id)))
  const reveal = (item: ImageGridItem, fromTile: boolean) => {
    if (fromTile) focusAfterReveal.current = item.id
    setRevealed((s) => new Set(s).add(item.id))
    onReveal?.(item)
  }
  // The reveal button gives way to the tile; keep focus where the person was, on the picture they asked for.
  React.useEffect(() => {
    const id = focusAfterReveal.current
    if (!id) return
    focusAfterReveal.current = null
    tiles.current.get(id)?.querySelector("button")?.focus()
  }, [revealed])

  const toggle = (id: string) => {
    const on = selected.includes(id)
    // Pick one is a radio group: picking the picked tile again keeps it. Another tile moves the pick.
    if (single && on) return
    const next = single ? [id] : on ? selected.filter((s) => s !== id) : [...selected, id]
    if (selectedProp === undefined) setSelectedState(next)
    onSelectedChange?.(next)
  }
  // Pick one: one Tab stop, on the picked tile (or the first that shows), and the arrow keys move and pick, as radios do.
  const shown = (item: ImageGridItem) => !item.restricted || revealed.has(item.id)
  const tabStop = single ? (items.find((x) => selected.includes(x.id) && shown(x)) ?? items.find(shown))?.id : undefined
  const onRadioKey = (e: React.KeyboardEvent, id: string) => {
    const order = items.filter(shown).map((x) => x.id)
    const at = order.indexOf(id)
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? order[(at + 1) % order.length]
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? order[(at - 1 + order.length) % order.length]
          : e.key === "Home"
            ? order[0]
            : e.key === "End"
              ? order.at(-1)
              : undefined
    if (to === undefined) return
    e.preventDefault()
    if (!selected.includes(to)) toggle(to)
    tiles.current.get(to)?.querySelector<HTMLElement>("[role=radio]")?.focus()
  }

  const show = (i: number) => {
    last.current = i
    setOpen(i)
  }

  const listClass = cn(
    strip ? "flex snap-x snap-mandatory scroll-px-1 gap-2 overflow-x-auto p-1" : cn("grid gap-2", gridSizes[size]),
    className,
  )
  const itemClass = cn("relative", strip && cn("shrink-0 snap-start", stripSizes[size]))

  if (loading) {
    const n = loadingCount ?? (strip ? 4 : 8)
    return (
      <div data-slot="image-grid" aria-busy="true">
        <p role="status" className="sr-only">
          {labels.loading}
        </p>
        <ul aria-label={label} className={listClass}>
          {Array.from({ length: n }, (_, i) => (
            <li key={i} className={itemClass}>
              <Bone className={cn("w-full rounded-sm", aspects[aspect])} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div data-slot="image-grid">
      <ul role={single ? "radiogroup" : undefined} aria-label={label} className={listClass}>
        {items.map((item, i) => {
          const isSelected = selected.includes(item.id)
          const isBroken = broken.has(item.id)
          const hidden = !!item.restricted && !revealed.has(item.id)
          const interactive = picking || lightbox
          const face = (
            <span className={cn("block w-full overflow-hidden rounded-sm bg-muted", aspects[aspect], item.restricted && "animate-fade-in")}>
              {isBroken ? (
                <Broken name={item.name} label={labels.broken} />
              ) : (
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={() => markBroken(item.id)}
                  // A picture that failed before React attached onError (server-rendered) is caught here.
                  ref={(img) => {
                    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) markBroken(item.id)
                  }}
                  className="size-full object-cover"
                />
              )}
            </span>
          )
          return (
            <li
              key={item.id}
              ref={(el) => {
                if (el) tiles.current.set(item.id, el)
                else tiles.current.delete(item.id)
              }}
              role={single ? "none" : undefined}
              className={itemClass}
            >
              <RestrictedPreview
                restricted={hidden}
                reason={item.reason}
                label={labels.reveal}
                onReveal={() => reveal(item, true)}
                className={cn("w-full", aspects[aspect])}
              >
                {interactive ? (
                  <button
                    type="button"
                    role={single ? "radio" : undefined}
                    aria-checked={single ? isSelected : undefined}
                    aria-pressed={picking && !single ? isSelected : undefined}
                    aria-haspopup={picking ? undefined : "dialog"}
                    tabIndex={single ? (item.id === tabStop ? 0 : -1) : undefined}
                    onKeyDown={single ? (e) => onRadioKey(e, item.id) : undefined}
                    onClick={() => (picking ? toggle(item.id) : show(i))}
                    className="press relative block w-full rounded-sm"
                  >
                    {face}
                    {picking && <Picked on={isSelected} round={single} />}
                  </button>
                ) : (
                  face
                )}
                {picking && lightbox && (
                  <button
                    type="button"
                    aria-label={labels.viewLarger(item.name)}
                    aria-haspopup="dialog"
                    onClick={() => show(i)}
                    className={cn(
                      "press absolute top-0 right-0 flex size-(--h-md) items-center justify-center rounded-sm text-foreground",
                      // On a small tile the plate sits in the corner of its 44 px target, so it covers less of the picture.
                      size === "sm" && "items-start justify-end p-2",
                    )}
                  >
                    {/* A small plate under the icon, so it reads on any picture without covering the corner. */}
                    <span className={cn("flex items-center justify-center bg-card ring-1 ring-border", size === "sm" ? "size-6 rounded-2xs" : "size-8 rounded-xs")}>
                      <ZoomIn aria-hidden="true" className="size-4" />
                    </span>
                  </button>
                )}
              </RestrictedPreview>
            </li>
          )
        })}
      </ul>

      {lightbox && (
        <Lightbox
          items={items}
          index={open}
          onIndexChange={show}
          onClose={() => setOpen(null)}
          // Back to the tile of the picture last shown, which may not be the one that opened it.
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            const item = items[last.current]
            if (item) tiles.current.get(item.id)?.querySelector("button")?.focus()
          }}
          broken={broken}
          onBroken={markBroken}
          revealed={revealed}
          onReveal={(item) => reveal(item, false)}
          labels={labels}
        />
      )}
    </div>
  )
}

/** A picture that could not load: the image-off icon and the file name, in the tile's shape. */
function Broken({ name, label, large }: { name: string; label: string; large?: boolean }) {
  return (
    <span className={cn("flex size-full flex-col items-center justify-center gap-2 p-2 text-center text-muted-foreground", large ? "text-sm" : "text-xs")}>
      <ImageOff aria-hidden="true" className={large ? "size-6" : "size-5"} />
      <span className="line-clamp-2 break-all">
        <span className="sr-only">{label}: </span>
        {name}
      </span>
    </span>
  )
}

/**
 * Picked: a ring in the focus ink with a card-coloured line inside it, so it shows on light and dark pictures, and a mark:
 * a box with a check when many can be picked, a round radio with a dot when only one can.
 */
function Picked({ on, round }: { on: boolean; round?: boolean }) {
  const swap = "transition-opacity duration-(--motion-fast) ease-(--ease-standard)"
  return (
    <>
      <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 rounded-sm ring-4 ring-ring ring-inset", swap, on ? "opacity-100" : "opacity-0")} />
      <span aria-hidden="true" className={cn("pointer-events-none absolute inset-1 rounded-xs ring-2 ring-card ring-inset", swap, on ? "opacity-100" : "opacity-0")} />
      {round ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2 left-2 flex size-6 items-center justify-center rounded-full",
            "transition-colors duration-(--motion-fast) ease-(--ease-standard)",
            on ? "bg-primary ring-1 ring-card" : "ring-2 ring-card ring-inset outline-1 outline-foreground",
          )}
        >
          <span className={cn("size-2 rounded-full bg-primary-foreground", swap, on ? "opacity-100" : "opacity-0")} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2 left-2 flex size-6 items-center justify-center rounded-2xs ring-1",
            "transition-colors duration-(--motion-fast) ease-(--ease-standard)",
            // Not picked: an empty box, a card-coloured line with a foreground edge, so it reads on light and dark pictures
            // without becoming a solid square.
            on ? "bg-primary text-primary-foreground ring-card" : "text-transparent ring-2 ring-card ring-inset outline-1 outline-foreground",
          )}
        >
          <Check className="size-4" />
        </span>
      )}
    </>
  )
}

function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  onCloseAutoFocus,
  broken,
  onBroken,
  revealed,
  onReveal,
  labels,
}: {
  items: ImageGridItem[]
  index: number | null
  onIndexChange: (i: number) => void
  onClose: () => void
  onCloseAutoFocus: (e: Event) => void
  broken: Set<string>
  onBroken: (id: string) => void
  revealed: Set<string>
  onReveal: (item: ImageGridItem) => void
  labels: ImageGridLabels
}) {
  const content = React.useRef<HTMLDivElement>(null)
  // Keep the last picture while the dialog fades out, instead of an empty frame.
  // State set during render rather than a ref, so the React Compiler can see what the markup depends on.
  const [shown, setShown] = React.useState(index ?? 0)
  if (index !== null && index !== shown) setShown(index)
  const i = index ?? shown
  const item = items[i]
  const total = items.length
  const go = (to: number) => to >= 0 && to < total && onIndexChange(to)

  // ← and → move between pictures; not while typing (a caption field inside the dialog keeps its arrows).
  React.useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        go(index - 1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        go(index + 1)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  })

  // Reaching either end disables that button; focus moves to the dialog instead of falling out of it.
  React.useEffect(() => {
    const a = document.activeElement as HTMLButtonElement | null
    if (index !== null && (!a || a === document.body || a.disabled)) content.current?.focus()
  }, [index])

  if (!item) return null
  const hidden = !!item.restricted && !revealed.has(item.id)
  return (
    <Dialog open={index !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent ref={content} closeLabel={labels.close} onCloseAutoFocus={onCloseAutoFocus} className="max-w-4xl gap-3 max-sm:p-4">
        <div className="flex min-w-0 flex-col gap-1 pr-8">
          <DialogTitle className="truncate">{item.name}</DialogTitle>
          <DialogDescription className="tabular-nums">{labels.position(i + 1, total)}</DialogDescription>
        </div>
        {/* Moving with the arrows changes the title without moving focus, so say where we are. */}
        <p aria-live="polite" className="sr-only">
          {index !== null ? `${item.name}, ${labels.position(i + 1, total)}` : ""}
        </p>
        <div className="flex aspect-4/3 max-h-[65dvh] w-full items-center justify-center overflow-hidden rounded-sm bg-muted">
          {hidden ? (
            <RestrictedPreview key={item.id} restricted reason={item.reason} label={labels.reveal} onReveal={() => onReveal(item)} className="size-full">
              {null}
            </RestrictedPreview>
          ) : broken.has(item.id) ? (
            <Broken name={item.name} label={labels.broken} large />
          ) : (
            <img
              key={item.id}
              src={item.fullSrc ?? item.src}
              alt={item.alt}
              decoding="async"
              onError={() => onBroken(item.id)}
              className="size-full animate-fade-in object-contain"
            />
          )}
        </div>
        {item.caption && <p className="text-sm text-muted-foreground">{item.caption}</p>}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => go(i - 1)} disabled={i === 0}>
            <ChevronLeft aria-hidden="true" />
            {labels.previous}
          </Button>
          <Button variant="outline" onClick={() => go(i + 1)} disabled={i === total - 1}>
            {labels.next}
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
