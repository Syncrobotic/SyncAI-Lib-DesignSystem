import { scopes } from "@/site/scopes"
import { Sidebar } from "@/site/sidebar"
import { SidebarFrame } from "@/site/sidebar-frame"
import { PageTransition } from "@/site/page-transition"

// Docs and blocks share this frame. The sidebar shows only the area the page belongs to.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4">
      <SidebarFrame>
        <Sidebar scopes={scopes} />
      </SidebarFrame>
      <main id="content" className="min-w-0 flex-1 pt-8 pb-section">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
