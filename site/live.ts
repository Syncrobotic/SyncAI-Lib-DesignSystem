"use client"

import * as React from "react"

/**
 * The home page's live specimens (site/home-live.tsx) play simulated data through the registry's components. They hold a
 * still, complete frame where movement is not wanted: with reduced motion, and in an automated browser (the visual
 * checks), so every screenshot shows the same picture.
 */
export const wantsStill = () =>
  typeof navigator !== "undefined" && (!!navigator.webdriver || window.matchMedia("(prefers-reduced-motion: reduce)").matches)

/**
 * Calls `onTick` every `everyMs` while the element is on screen and the tab is visible; nothing runs off screen or in a
 * hidden tab. `tickOnResume` also ticks at once when it comes back (a source that catches up on what it missed).
 * Returns the ref for the element and whether the specimen is still.
 */
export function useLive<T extends HTMLElement>(everyMs: number, onTick: () => void, { tickOnResume = false } = {}) {
  const ref = React.useRef<T>(null)
  // Client-only: the specimens render after they come near the screen (WhenNear), never on the server.
  const [still] = React.useState(wantsStill)
  const tick = React.useEffectEvent(onTick)
  React.useEffect(() => {
    const el = ref.current
    if (still || !el) return
    let inView = false
    let timer: number | undefined
    const update = () => {
      const run = inView && document.visibilityState === "visible"
      if (run && timer === undefined) {
        if (tickOnResume) tick()
        timer = window.setInterval(() => tick(), everyMs)
      } else if (!run && timer !== undefined) {
        window.clearInterval(timer)
        timer = undefined
      }
    }
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
      window.clearInterval(timer)
    }
  }, [still, everyMs, tickOnResume])
  return { ref, still }
}

/** A fixed clock for the simulation: 14:02:00 on 21 November 2026, as the stories use. */
export const EPOCH = new Date(2026, 10, 21, 14, 2, 0).getTime()

const clock = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
const clockShort = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
/** "14:02:31" */
export const timeOf = (ms: number) => clock.format(ms)
/** "14:02" */
export const minuteOf = (ms: number) => clockShort.format(ms)

/** A repeatable noise in −1…1 for index i. */
export const noise = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}
