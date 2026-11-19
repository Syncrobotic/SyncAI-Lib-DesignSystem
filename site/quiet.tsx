"use client"

import { configureFeedback, feedback, type FeedbackName } from "@/registry/syncrobotic/lib/feedback"

// The docs show alarms, not ring them: an unacknowledged critical alarm in an example would repeat its tone every 10 s
// once the page has had a click. Sound and vibration are off across the site, set when this module first loads.
if (typeof window !== "undefined") configureFeedback({ sound: false, haptics: false })

/** For a button whose whole point is to let you hear and feel a pattern: on for that one press, then quiet again. */
export function sample(name: FeedbackName) {
  configureFeedback({ sound: true, haptics: true })
  try {
    feedback(name)
  } finally {
    configureFeedback({ sound: false, haptics: false })
  }
}

/** Mount once in a layout so the module above runs before any example. */
export function Quiet() {
  return null
}
