import { scopes } from "@/site/scopes"
import { Sidebar } from "@/site/sidebar"

// Docs and blocks share this frame. The sidebar shows only the area the page belongs to.
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 md:block">
        <Sidebar scopes={scopes} />
      </aside>
      <main id="content" className="min-w-0 flex-1 py-8 pb-24">
        <details className="mb-8 rounded-md border border-border md:hidden">
          <summary className="flex h-(--h-md) cursor-pointer items-center px-4 text-sm font-medium">Menu</summary>
          <div className="border-t border-border p-4">
            <Sidebar scopes={scopes} switcher />
          </div>
        </details>
        {children}
      </main>
    </div>
  )
}
