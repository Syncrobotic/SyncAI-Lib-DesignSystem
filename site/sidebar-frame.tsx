"use client"

import * as m from "motion/react-m"

/** The sticky, scrollable sidebar column. `layoutScroll` keeps the sliding page marker aligned when the column is scrolled. */
export function SidebarFrame({ children }: { children: React.ReactNode }) {
  return (
    <m.aside layoutScroll data-scroll className="sidebar-fade sticky top-(--site-header) hidden h-[calc(100dvh-var(--site-header))] w-56 shrink-0 overflow-y-auto py-8 lg:block">
      {children}
    </m.aside>
  )
}
