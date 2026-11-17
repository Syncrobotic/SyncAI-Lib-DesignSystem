"use client"

import * as m from "motion/react-m"
import { patterns } from "./motion"

/** Content of a tab that has just been chosen arrives with the appear pattern. Radix unmounts hidden tabs, so this runs on every switch. */
export function TabPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div initial="hidden" animate="shown" variants={patterns.appear} className={className}>
      {children}
    </m.div>
  )
}
