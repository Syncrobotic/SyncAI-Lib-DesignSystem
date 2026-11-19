"use client"

import * as React from "react"
import { ViewTransition } from "react"
import { usePathname } from "next/navigation"

/**
 * The page's content leaves and arrives when you go to another page: the old one fades out (--motion-fast, exit easing),
 * the new one appears (--motion-base, 8 px rise), the kit's disappear and appear. Keyed by path, so a new page is a new
 * entry and a change of hash is not. Only the content takes part: the header and sidebar stay live and still, and since
 * the root is not snapshotted (globals.css) everything outside the content can be clicked during the 320 ms. In a robot
 * app the same rule keeps the stop and the island out of any transition.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <ViewTransition key={path} enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
