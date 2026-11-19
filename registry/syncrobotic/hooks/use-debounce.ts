// @syncrobotic/use-debounce v0.15.0 · update: npx shadcn add @syncrobotic/use-debounce --overwrite
"use client"

import * as React from "react"

/**
 * The value, once it has stopped changing for `delay` ms: a search box's text, sent to a server only when the typing
 * pauses. The first value is returned at once.
 */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [settled, setSettled] = React.useState(value)
  React.useEffect(() => {
    const t = window.setTimeout(() => setSettled(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return settled
}

/**
 * A function that runs `delay` ms after its last call, with the arguments of that last call. `cancel()` drops a pending
 * call; `flush()` runs it now (for Enter, or a clear button that should not wait). Always calls the latest `fn`, and
 * cancels itself on unmount.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 300) {
  const latest = React.useRef(fn)
  React.useLayoutEffect(() => {
    latest.current = fn
  })
  const timer = React.useRef<number | undefined>(undefined)
  const pending = React.useRef<A | null>(null)

  // Stable across renders, so it can sit in effect dependencies and props without re-running anything.
  const debounced = React.useMemo(() => {
    const run = () => {
      const args = pending.current
      pending.current = null
      timer.current = undefined
      if (args) latest.current(...args)
    }
    const call = (...args: A) => {
      pending.current = args
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(run, delay)
    }
    const cancel = () => {
      window.clearTimeout(timer.current)
      timer.current = undefined
      pending.current = null
    }
    const flush = () => {
      window.clearTimeout(timer.current)
      run()
    }
    return Object.assign(call, { cancel, flush, isPending: () => pending.current !== null })
  }, [delay])

  React.useEffect(() => debounced.cancel, [debounced])
  return debounced
}
