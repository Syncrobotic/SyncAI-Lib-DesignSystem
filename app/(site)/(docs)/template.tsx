"use client"

import * as React from "react"
import * as m from "motion/react-m"
import { usePathname } from "next/navigation"
import { patterns } from "@/site/motion"
import { componentBase } from "@/site/component-tabs"

// The page last shown. A component page's tabs count as one page: switching tab keeps the head still and only the tab's
// content arrives (site/component-tabs.tsx).
let shown: string | null = null

const subscribeNothing = () => () => {}

// A template remounts on every navigation (the layout and its sidebar do not), so each page arrives once. Not on the
// first load: the server's HTML shows as it is instead of waiting at opacity 0 for the scripts (which would make it the
// page's last paint on a phone, seconds after the first).
export default function DocsTemplate({ children }: { children: React.ReactNode }) {
  const page = componentBase(usePathname())
  // Read once when this page mounts; recorded after, so a second render (StrictMode) reads the same.
  const [sameView] = React.useState(() => shown === page)
  const hydrated = React.useSyncExternalStore(subscribeNothing, () => true, () => false)
  React.useEffect(() => {
    shown = page
  }, [page])
  return (
    <m.div initial={sameView || !hydrated ? false : "hidden"} animate="shown" variants={patterns.appear}>
      {children}
    </m.div>
  )
}
