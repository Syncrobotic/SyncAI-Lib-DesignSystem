"use client"

import * as React from "react"

/**
 * A block's whole preview: it fills the card's width and the frame takes the block's own height at that scale,
 * so nothing is cropped and nothing is left empty. App shells (`fit="screen"`) show their screen height; sections
 * (`fit="content"`) are measured, like the block page's frame, so a row of KPI cards is not followed by blank screen.
 * Phone screens are capped in height and sit centred, like a phone on a table.
 */
export function BlockThumb({
  name,
  title,
  width,
  height,
  fit = "screen",
}: {
  name: string
  title: string
  width: number
  height: number
  fit?: "content" | "screen"
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

  // Same-origin frame: follow the block root's height. The frame can finish before React attaches onLoad, so check on mount too.
  const measure = React.useCallback(() => {
    const f = frame.current
    const win = f?.contentWindow as (Window & typeof globalThis) | null
    const root = f?.contentDocument?.getElementById("block-root")
    if (fit !== "content" || !win || !root) return
    observer.current?.disconnect()
    observer.current = new win.ResizeObserver(() => setContentH(Math.ceil(root.getBoundingClientRect().height)))
    observer.current.observe(root)
  }, [fit])
  React.useEffect(() => {
    if (frame.current?.contentDocument?.readyState === "complete") measure()
  }, [avail, measure])

  const h = Math.min(height, contentH ?? height)
  const scale = avail ? Math.min(1, avail / width, maxHeight / h) : 0
  return (
    // Before the first measure the frame holds the block's ratio, so the grid does not jump.
    <div ref={box} className="specimen relative overflow-hidden" style={scale ? { height: h * scale } : { aspectRatio: `${width} / ${height}` }}>
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
          className="pointer-events-none absolute top-0 left-1/2 origin-top bg-background"
          style={{ width, height, transform: `translateX(-50%) scale(${scale})` }}
        />
      )}
    </div>
  )
}
