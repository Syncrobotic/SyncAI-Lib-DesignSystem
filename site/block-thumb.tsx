"use client"

import * as React from "react"

/**
 * A block's whole screen, scaled to fit the card in both directions and centred, so nothing is cropped:
 * a tall console shrinks until its bottom shows, a wide section until its sides do. The card height stays fixed so the grid stays even.
 */
export function BlockThumb({ name, title, width, height }: { name: string; title: string; width: number; height: number }) {
  const box = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0)
  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / width, e.contentRect.height / height)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height])
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
          className="pointer-events-none absolute top-1/2 left-1/2 origin-center bg-background ring-1 ring-border"
          style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}
        />
      )}
    </div>
  )
}
