import { groups as itemGroups, items } from "@/site/catalog"
import { foundations } from "@/site/foundations"
import { Sidebar, type NavGroup } from "@/site/sidebar"

const groups: NavGroup[] = [
  {
    title: "Getting started",
    links: [
      { href: "/docs/foundations", label: "Overview" },
      { href: "/docs/installation", label: "Installation" },
    ],
  },
  { title: "Foundations", links: foundations.map((f) => ({ href: `/docs/foundations/${f.slug}`, label: f.title })) },
  ...itemGroups.map((g) => ({
    title: g,
    links: items.filter((i) => i.group === g).map((i) => ({ href: `/docs/components/${i.name}`, label: i.title })),
  })),
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-8 md:block">
        <Sidebar groups={groups} />
      </aside>
      <main className="min-w-0 flex-1 py-8 pb-24">
        <details className="mb-8 rounded-md border border-border md:hidden">
          <summary className="flex h-(--h-md) cursor-pointer items-center px-4 text-sm font-medium">Menu</summary>
          <div className="border-t border-border p-4">
            <Sidebar groups={groups} />
          </div>
        </details>
        {children}
      </main>
    </div>
  )
}
