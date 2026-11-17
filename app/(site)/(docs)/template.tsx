"use client"

import * as m from "motion/react-m"
import { patterns } from "@/site/motion"

// A template remounts on every navigation (the layout and its sidebar do not), so each page arrives once.
export default function DocsTemplate({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial="hidden" animate="shown" variants={patterns.appear}>
      {children}
    </m.div>
  )
}
