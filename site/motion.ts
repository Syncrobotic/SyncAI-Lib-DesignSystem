import type { Transition, Variants } from "motion/react"

/**
 * The motion tokens of syncrobotic-theme.css, in seconds, for JavaScript animation (motion/react).
 * tests/unit/motion-tokens.test.ts fails if these drift from the theme file.
 */
export const duration = { fast: 0.12, base: 0.2, sheet: 0.32 } as const
export const ease = [0.2, 0, 0, 1] as const

export const t = {
  /** Press feedback, hover, icon swaps. */
  fast: { duration: duration.fast, ease },
  /** State changes: a selection moves, content appears, a value settles. */
  base: { duration: duration.base, ease },
  /** Sheets and panels in and out; a frame changes size. */
  sheet: { duration: duration.sheet, ease },
} satisfies Record<string, Transition>

/**
 * Four of the six motion patterns (see the Motion foundation), for JavaScript animation. Each marks a change of state;
 * none loops or decorates.
 * Under reduced motion (MotionConfig reducedMotion="user") transforms are dropped and only opacity changes.
 */
export const patterns = {
  /** Something arrives: a page, a tab's content, a notice. Rises 8 px and fades in. */
  appear: {
    hidden: { opacity: 0, y: 8 },
    shown: { opacity: 1, y: 0, transition: t.base },
  } satisfies Variants,
  /** A panel opens from its edge. */
  sheet: {
    hidden: { opacity: 0, height: 0 },
    shown: { opacity: 1, height: "auto", transition: t.sheet },
  } satisfies Variants,
  /** A pressed control sinks slightly, so touch feels answered before the result arrives. */
  press: { scale: 0.97, transition: t.fast },
  /** One icon becomes another (copy → copied, sun → moon). */
  swap: {
    hidden: { opacity: 0, scale: 0.6 },
    shown: { opacity: 1, scale: 1, transition: t.fast },
  } satisfies Variants,
}
