"use client"

import * as React from "react"

/**
 * Whether the element has come within a screen of the viewport (and stays true once it has). Opened at an anchor further
 * down (#example-…), everything above the anchor counts as near at once, so it does not push the anchor away as it draws;
 * the page then returns to the anchor. The change is a transition, so while what it shows loads the page stays as it is.
 */
export function useNear(ref: React.RefObject<HTMLElement | null>, enabled = true) {
  const [near, setNear] = React.useState(false)
  const [forAnchor, setForAnchor] = React.useState(false)
  React.useEffect(() => {
    if (!forAnchor) return
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView()
  }, [forAnchor])
  React.useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
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
  }, [ref, enabled])
  return near
}

/**
 * Renders its children once they come within a screen of the viewport, and keeps them. Until then, and on the server, an
 * empty block at the example frame's minimum height: a dozen live examples (maps, grids, charts) drawn at once cost
 * seconds on a phone. `placeholder` replaces the empty block with one of the content's own size (the home page's live
 * specimens), so nothing moves when it arrives.
 */
export function WhenNear({ children, placeholder }: { children: React.ReactNode; placeholder?: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const near = useNear(ref)
  return <div ref={ref}>{near ? children : (placeholder ?? <div aria-hidden="true" className="min-h-24 sm:min-h-32" />)}</div>
}
