"use client"

import * as React from "react"

/** A block's preview scaled to the card's width, so the whole width shows instead of a cropped middle. */
export function BlockThumb({ name, title, width, height }: { name: string; title: string; width: number; height: number }) {
  const box = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0)
  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])
  return (
    <div ref={box} className="specimen relative h-72 overflow-hidden">
      {scale > 0 && (
        <iframe
          src={`/preview/${name}`}
          title={`${title} thumbnail`}
          tabIndex={-1}
          aria-hidden
          inert
          loading="lazy"
          className="pointer-events-none absolute top-0 left-1/2 origin-top bg-background"
          style={{ width, height, transform: `translateX(-50%) scale(${scale})` }}
        />
      )}
    </div>
  )
}
