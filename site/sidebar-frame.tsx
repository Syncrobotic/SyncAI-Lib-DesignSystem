"use client"

/** The sticky, scrollable sidebar column. */
export function SidebarFrame({ children }: { children: React.ReactNode }) {
  return (
    <aside data-scroll className="sidebar-fade sticky top-(--site-header) hidden h-[calc(100dvh-var(--site-header))] w-56 shrink-0 overflow-y-auto py-8 lg:block">
      {children}
    </aside>
  )
}
