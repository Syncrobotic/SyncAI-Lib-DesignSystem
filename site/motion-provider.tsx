"use client"

import { domMax, LazyMotion, MotionConfig } from "motion/react"
import { t } from "./motion"

/** Every animation on the site uses the theme's base duration and curve unless it says otherwise, and honours reduced motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={t.base}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
