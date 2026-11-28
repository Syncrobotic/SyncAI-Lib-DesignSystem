import { areaNav, pageSections } from "./scopes"
import { Sidebar, SidebarSections } from "./sidebar"
import { SidebarSlot } from "./sidebar-frame"

// The pieces of the sidebar slot (app/(site)/(docs)/@sidebar): an area's layout sends its pages once, shared by every page
// of the area; a page sends only its own sections, which the sidebar draws under its link.

/** An area's sidebar; `children` is the page's slot, its sections. */
export function AreaSidebar({ area, children }: { area: string; children?: React.ReactNode }) {
  return (
    <SidebarSlot>
      <Sidebar area={areaNav(area)} sections={children} />
    </SidebarSlot>
  )
}

/** The sections under a page's link, or nothing when it has none. */
export function SectionsOf({ href }: { href: string }) {
  const s = pageSections(href)
  return s ? (
    <SidebarSlot>
      <SidebarSections {...s} />
    </SidebarSlot>
  ) : null
}

/** A page of an area with no sections. */
export const NoSections = () => null
