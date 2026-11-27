// @syncrobotic/use-debounce v0.51.0 · update: npx shadcn add @syncrobotic/use-debounce --overwrite
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

/** The debounced function, its timer and its pending arguments, outside React so nothing here is read during render. */
function createDebounced<A extends unknown[]>(initial: (...args: A) => void, delay: number) {
  let run = initial
  let timer: number | undefined
  let pending: A | null = null
  const fire = () => {
    const args = pending
    pending = null
    timer = undefined
    if (args) run(...args)
  }
  const call = (...args: A) => {
    pending = args
    window.clearTimeout(timer)
    timer = window.setTimeout(fire, delay)
  }
  const cancel = () => {
    window.clearTimeout(timer)
    timer = undefined
    pending = null
  }
  const flush = () => {
    window.clearTimeout(timer)
    fire()
  }
  // Swaps in the latest fn without changing the function's identity.
  const setLatest = (fn: (...args: A) => void) => {
    run = fn
  }
  return { debounced: Object.assign(call, { cancel, flush, isPending: () => pending !== null }), setLatest }
}

/**
 * A function that runs `delay` ms after its last call, with the arguments of that last call. `cancel()` drops a pending
 * call; `flush()` runs it now (for Enter, or a clear button that should not wait). Always calls the latest `fn`, and
 * cancels itself on unmount.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 300) {
  // The fn of the first render starts each debounced function; after every commit the latest one is swapped in, so a
  // call always runs the newest fn. The timer and the pending arguments live in the closure rather than in refs.
  const [first] = React.useState(() => fn)
  // Stable across renders, so it can sit in effect dependencies and props without re-running anything.
  const { debounced, setLatest } = React.useMemo(() => createDebounced<A>(first, delay), [first, delay])
  React.useLayoutEffect(() => {
    setLatest(fn)
  })

  React.useEffect(() => debounced.cancel, [debounced])
  return debounced
}
