"use client"

import * as React from "react"

/** True inside the sidebar column: the docs template, which wraps every slot, leaves the sidebar's still. */
export const InSidebar = React.createContext(false)

/** The sticky, scrollable sidebar column. */
export function SidebarFrame({ children }: { children: React.ReactNode }) {
  return (
    <aside data-scroll className="sidebar-fade sticky top-(--site-header) hidden h-[calc(100dvh-var(--site-header))] w-56 shrink-0 overflow-y-auto py-8 lg:block">
      <InSidebar value>{children}</InSidebar>
    </aside>
  )
}

/**
 * What the sidebar slot renders, in a box with no box (display: contents). On a navigation the router scrolls to the
 * first changed segment it can measure, and the sticky sidebar always measures in view, so the new page would keep the
 * old one's scroll. Measuring nothing here leaves that to the page.
 */
export function SidebarSlot({ children }: { children: React.ReactNode }) {
  return <div className="contents">{children}</div>
}
