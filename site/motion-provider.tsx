"use client"

import { LazyMotion, MotionConfig } from "motion/react"
import { t } from "./motion"

// No animation plays on first load (site/appear.tsx, the docs template), so the features (layout ones included, for
// layoutId) load after hydration instead of with every page's scripts.
const features = () => import("./motion-features").then((r) => r.default)

/** Every animation on the site uses the theme's base duration and curve unless it says otherwise, and honours reduced motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={features} strict>
      <MotionConfig reducedMotion="user" transition={t.base}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
