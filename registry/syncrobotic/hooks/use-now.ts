// @syncrobotic/use-now v0.36.0 · update: npx shadcn add @syncrobotic/use-now --overwrite
"use client"

import * as React from "react"

const subscribeNothing = () => () => {}

/**
 * The clock, in ms since the epoch, read again every `intervalMs` (null: read once, never again), for "12 s ago", for
 * what has timed out, for a flood that ends when its alarms age out.
 *
 * Null on the server and while the page hydrates, so the server's render and the browser's first one agree: neither
 * knows the other's clock or time zone, and a time read during render would differ between them (React's hydration
 * error, and folded rows or "ago" texts that jump). A component mounted in the browser after that gets the time in its
 * first render, so nothing flashes.
 */
export function useNow(intervalMs: number | null = 1000): number | null {
  // Read when this component first renders. The server reads one too, but never returns it.
  const [mountedAt] = React.useState(() => Date.now())
  const hydrated = React.useSyncExternalStore(subscribeNothing, () => true, () => false)
  const [tick, setTick] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (intervalMs === null || !Number.isFinite(intervalMs) || intervalMs <= 0) return
    const read = () => setTick(Date.now())
    // Once at once, as the clock may have stood still since the first render (an interval turned on later), then on time.
    const first = setTimeout(read, 0)
    const id = setInterval(read, intervalMs)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [intervalMs])
  return hydrated ? (tick ?? mountedAt) : null
}
