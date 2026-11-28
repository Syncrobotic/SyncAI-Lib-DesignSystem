import { SidebarFrame } from "@/site/sidebar-frame"
import { PageTransition } from "@/site/page-transition"

// Docs and blocks share this frame. The sidebar is a slot (@sidebar): each area's layout there sends that area's pages
// once, and each page its own sections, so no page carries the whole site's navigation.
export default function DocsLayout({ children, sidebar }: { children: React.ReactNode; sidebar: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4">
      <SidebarFrame>{sidebar}</SidebarFrame>
      <main id="content" className="min-w-0 flex-1 pt-8 pb-section">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
