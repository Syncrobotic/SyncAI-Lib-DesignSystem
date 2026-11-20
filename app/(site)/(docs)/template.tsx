"use client"

import * as React from "react"
import * as m from "motion/react-m"
import { usePathname } from "next/navigation"
import { patterns } from "@/site/motion"
import { componentBase } from "@/site/component-tabs"

// The page last shown. A component page's tabs count as one page: switching tab keeps the head still and only the tab's
// content arrives (site/component-tabs.tsx).
let shown: string | null = null

// A template remounts on every navigation (the layout and its sidebar do not), so each page arrives once.
export default function DocsTemplate({ children }: { children: React.ReactNode }) {
  const page = componentBase(usePathname())
  // Read once when this page mounts; recorded after, so a second render (StrictMode) reads the same.
  const [sameView] = React.useState(() => shown === page)
  React.useEffect(() => {
    shown = page
  }, [page])
  return (
    <m.div initial={sameView ? false : "hidden"} animate="shown" variants={patterns.appear}>
      {children}
    </m.div>
  )
}
