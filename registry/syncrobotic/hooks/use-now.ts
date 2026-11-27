// @syncrobotic/use-now v0.52.0 · update: npx shadcn add @syncrobotic/use-now --overwrite
"use client"

import * as React from "react"

const subscribeNothing = () => () => {}

/**
 * A value only the browser can read and that does not change while the page is open (the platform, WebGL support):
 * `server` on the server and while the page hydrates, so both renders agree, then `read()`.
 */
export function useClientValue<T>(read: () => T, server: T): T {
  return React.useSyncExternalStore(subscribeNothing, read, () => server)
}

const yes = () => true

/** False on the server and while the page hydrates, true after: for what only the browser can draw. */
export function useHydrated(): boolean {
  return useClientValue(yes, false)
}

/**
 * The clock in ms since the epoch, read again every `intervalMs` (null: read once), for "12 s ago" and timeouts.
 * Null on the server and while the page hydrates, so both renders agree (a time read during render differs between them
 * and breaks hydration). A component mounted after hydration gets the time in its first render, so nothing flashes.
 */
export function useNow(intervalMs: number | null = 1000): number | null {
  // Read when this component first renders. The server reads one too, but never returns it.
  const [mountedAt] = React.useState(() => Date.now())
  const hydrated = useHydrated()
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
