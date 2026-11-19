"use client"

import * as React from "react"

/** The part of a block a card shows, in the block's own pixels: its left and top edge and its width. The height follows the box. */
export type ThumbView = { x?: number; y?: number; width: number }

/**
 * A block's preview. Without a box (`ratio`) it fills the card's width and the frame takes the block's own height at
 * that scale: app shells (`fit="screen"`) show their screen height; sections (`fit="content"`) are measured, like the
 * block page's frame, so a row of KPI cards is not followed by blank screen. Phone screens are capped in height.
 *
 * In a box (`ratio`, for grids where every card lines up) a whole desktop screen scaled to a card is too small to read,
 * so a screen shows one region of itself (`view`, by default its top-left 480 px: title, first panel, first rows) at
 * about half size, where the words still read. Sections and phone screens without a `view` sit whole, centred.
 */
export function BlockThumb({
  name,
  title,
  width,
  height,
  fit = "screen",
  ratio,
  view,
}: {
  name: string
  title: string
  width: number
  height: number
  fit?: "content" | "screen"
  /** A fixed box (width / height). */
  ratio?: number
  /** The region a boxed thumbnail shows. Desktop screens default to their top-left 480 px. */
  view?: ThumbView
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const frame = React.useRef<HTMLIFrameElement>(null)
  const observer = React.useRef<ResizeObserver | null>(null)
  const [avail, setAvail] = React.useState(0)
  const [contentH, setContentH] = React.useState<number | null>(null)
  const maxHeight = 420

  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width))
    ro.observe(el)
    return () => {
      ro.disconnect()
      observer.current?.disconnect()
    }
  }, [])

  const region = ratio ? (view ?? (fit === "screen" && width > 600 ? { width: 480 } : undefined)) : undefined
  const cropped = !!region

  // Same-origin frame: follow the block root's height. The frame can finish before React attaches onLoad, so check on mount too.
  const measure = React.useCallback(() => {
    const f = frame.current
    const win = f?.contentWindow as (Window & typeof globalThis) | null
    const root = f?.contentDocument?.getElementById("block-root")
    if (fit !== "content" || cropped || !win || !root) return
    observer.current?.disconnect()
    observer.current = new win.ResizeObserver(() => setContentH(Math.ceil(root.getBoundingClientRect().height)))
    observer.current.observe(root)
  }, [fit, cropped])
  React.useEffect(() => {
    if (frame.current?.contentDocument?.readyState === "complete") measure()
  }, [avail, measure])

  const h = Math.min(height, contentH ?? height)
  let scale = avail ? Math.min(1, avail / width, maxHeight / h) : 0
  let left = avail / 2 - (width * scale) / 2
  let top = 0
  if (ratio && avail) {
    const boxH = avail / ratio
    if (region) {
      // One region at the scale that fits its width into the card, its top-left corner on the card's.
      scale = avail / region.width
      left = -(region.x ?? 0) * scale
      top = -(region.y ?? 0) * scale
    } else {
      // A section or a phone sits whole, centred, with a margin, so a row of KPI cards or a phone does not look stretched.
      scale = Math.min(avail / width, boxH / h) * 0.9
      left = (avail - width * scale) / 2
      top = Math.max(0, (boxH - h * scale) / 2)
    }
  }
  return (
    // Before the first measure the frame holds the box (or the block's ratio), so the grid does not jump.
    <div
      ref={box}
      className="specimen relative overflow-hidden"
      style={ratio ? { aspectRatio: String(ratio) } : scale ? { height: h * scale } : { aspectRatio: `${width} / ${height}` }}
    >
      {scale > 0 && (
        <iframe
          ref={frame}
          src={`/preview/${name}`}
          title={`${title} thumbnail`}
          tabIndex={-1}
          aria-hidden
          inert
          loading="lazy"
          onLoad={measure}
          className="pointer-events-none absolute top-0 left-0 origin-top-left bg-background"
          style={{ width, height, transform: `translate(${left}px, ${top}px) scale(${scale})` }}
        />
      )}
    </div>
  )
}
