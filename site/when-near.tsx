"use client"

import * as React from "react"

/**
 * Renders its children once they come within a screen of the viewport, and keeps them. Until then, and on the server, an
 * empty block at the example frame's minimum height. A page with a dozen live examples (maps, grids, charts) hydrated and
 * drew them all at once, seconds of main-thread work on a phone; now only the ones near the screen do. The render is a
 * transition, so while a story's file loads the block stays as it is. `placeholder` replaces the empty block with one of the
 * content's own size (the home page's live specimens), so nothing moves when it arrives.
 */
export function WhenNear({ children, placeholder }: { children: React.ReactNode; placeholder?: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [near, setNear] = React.useState(false)
  // Opened at an anchor further down (#example-…): everything above it draws at once, so it does not push the anchor away
  // as it draws; the page then returns to the anchor.
  const [forAnchor, setForAnchor] = React.useState(false)
  React.useEffect(() => {
    if (!forAnchor) return
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView()
  }, [forAnchor])
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null
    if (target && (target.contains(el) || el.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      React.startTransition(() => {
        setNear(true)
        setForAnchor(true)
      })
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        React.startTransition(() => setNear(true))
      },
      { rootMargin: "100% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref}>{near ? children : (placeholder ?? <div aria-hidden="true" className="min-h-24 sm:min-h-32" />)}</div>
}
