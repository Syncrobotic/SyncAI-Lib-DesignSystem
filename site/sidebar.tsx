"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { componentBase } from "@/site/component-tabs"
import { cn } from "@/lib/utils"
import { inScope } from "./scope-match"
import type { NavLink, Scope } from "./scopes"

export const scopeFor = (scopes: Pick<Scope, "match">[], path: string) =>
  Math.max(
    0,
    scopes.findIndex((s) => s.match.some((m) => inScope(m, path))),
  )

/**
 * The areas, as the header shows them on desktop: one quiet row of tabs with an underline, not a second set of buttons
 * louder than the pages. The drawer holds it in its fixed header, above the list that scrolls; its baseline is the
 * header's edge, drawn once the list has scrolled under it (`edge`). On the home page there is no area yet, so there are
 * no tabs: the Sidebar lists the four instead.
 */
export function AreaTabs({ scopes, path, edge }: { scopes: Scope[]; path: string; edge: boolean }) {
  const active = scopes[scopeFor(scopes, path)]
  return (
    <div
      role="list"
      aria-label="Areas"
      className={cn(
        "flex gap-4 overflow-x-auto overflow-y-hidden border-b px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        edge ? "border-border" : "border-transparent",
      )}
    >
      {scopes.map((s) => (
        <Link
          key={s.key}
          role="listitem"
          href={s.href}
          aria-current={s.key === active.key ? "true" : undefined}
          className={cn(
            // The ring sits inside the tab: the row scrolls sideways, so it clips anything drawn outside it.
            "-mb-px inline-flex h-(--h-md) shrink-0 items-center border-b-2 text-sm whitespace-nowrap transition-colors duration-(--motion-fast) ease-(--ease-standard) focus-visible:-outline-offset-2",
            s.key === active.key ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {s.label}
        </Link>
      ))}
    </div>
  )
}

/** The groups of the area you are in. In the drawer (`switcher`) on the home page, the four areas instead. */
export function Sidebar({ scopes, switcher = false, path: frozen }: { scopes: Scope[]; switcher?: boolean; path?: string }) {
  // The drawer passes the page it was opened on, so its list holds still while it closes on the way to another page.
  const current = usePathname()
  const path = frozen ?? current
  // A component page's tabs belong to its one link.
  const here = componentBase(path)
  const active = scopes[scopeFor(scopes, path)]
  // The home page belongs to no area: in the drawer, Home is current and no area is selected.
  const home = path === "/"
  const nav = React.useRef<HTMLElement>(null)
  // The link you clicked, and where it was in its column. The previous page's examples close above it, which would pull
  // it up; before the next paint the column scrolls back by that much, so the link stays under the pointer. Browsers
  // with scroll anchoring already do this; Safari does not.
  const anchor = React.useRef<{ href: string; top: number } | null>(null)
  React.useLayoutEffect(() => {
    const a = anchor.current
    anchor.current = null
    const box = nav.current?.closest<HTMLElement>("[data-scroll]")
    const link = a && nav.current?.querySelector<HTMLElement>(`a[href="${CSS.escape(a.href)}"]`)
    if (!a || !box || !link) return
    const moved = link.getBoundingClientRect().top - a.top
    if (moved) box.scrollTop += moved
  }, [path])
  // Open where you are: if the current page's link is out of view in its scrolling column (or the drawer), centre it.
  // Only that box scrolls, never the page.
  React.useEffect(() => {
    const link = nav.current?.querySelector<HTMLElement>("a[data-current]")
    const box = link?.closest<HTMLElement>("[data-scroll]")
    if (!link || !box) return
    const l = link.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    if (l.top >= b.top && l.bottom <= b.bottom) return
    // Centre it, then move up to the nearest whole row or group heading, so no item sits half cut at the top edge.
    const centred = box.scrollTop + l.top - b.top - b.height / 2 + l.height / 2
    const rows = [...box.querySelectorAll<HTMLElement>("a, nav > div > p")].map((e) => ({ heading: e.tagName === "P", top: e.getBoundingClientRect().top - b.top + box.scrollTop }))
    // Near the end of the list the column cannot scroll that far: start from the last row it can bring to the top.
    const max = box.scrollHeight - box.clientHeight + 12
    let i = rows.filter((r) => r.top <= Math.min(centred, max) + 1).length - 1
    // A group's first page starts the column with its group's name, never with the name cut off above it.
    if (i > 0 && rows[i - 1].heading && rows[i].top - rows[i - 1].top < 40) i -= 1
    box.scrollTop = Math.max(0, (i >= 0 ? rows[i].top : centred) - 12)
  }, [path])
  return (
    <nav
      ref={nav}
      aria-label={`${active.label} navigation`}
      className="flex flex-col gap-6 text-sm"
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]")
        if (a) anchor.current = { href: a.getAttribute("href")!, top: a.getBoundingClientRect().top }
      }}
    >
      {!switcher && <p className="px-3 text-sm font-medium text-muted-foreground">{active.label}</p>}
      {switcher && home && (
        <div role="list" aria-label="Areas" className="flex flex-col gap-1">
          {scopes.map((s) => (
            <Link
              key={s.key}
              role="listitem"
              href={s.href}
              className="press flex h-(--h-sm) items-center rounded-xs px-3 text-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent focus-visible:-outline-offset-2"
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
      {!(home && switcher) && active.groups.map((g, gi) => (
        // Groups are split by a hairline, and the group's name is in ink while its pages are grey: two levels, not one.
        <div key={g.title} className={cn("flex flex-col gap-1", gi > 0 && "border-t border-border pt-4")}>
          <p className="px-3 pb-1 text-xs font-bold text-foreground">{g.title}</p>
          {/* Focus rings sit inside each link (-outline-offset-2), on the current page's grey box, instead of 2 px outside it
              where they crossed the column's edge and the examples' line below. */}
          {g.links.map((l) => (
            <React.Fragment key={l.href}>
              <Link
                href={l.href}
                aria-current={path === l.href ? "page" : here === l.href ? "true" : undefined}
                data-current={here === l.href || undefined}
                className={cn(
                  "press relative flex h-(--h-sm) items-center rounded-xs px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent focus-visible:-outline-offset-2",
                  here === l.href ? "bg-muted font-medium text-foreground hover:bg-muted" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* The current page's grey is the link's own background, so the inset focus ring draws over it. It stays put; it
                    used to slide as a layer of its own, which swept down the scrolling column on every switch. */}
                <span className="min-w-0 truncate">{l.label}</span>
                {/* Over half the items are beta, so the mark stays quiet: small grey words, no outline, there to find
                    rather than to catch the eye. The component page states it again beside its version. */}
                {l.beta && <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">Beta</span>}
              </Link>
              {/* The open page's examples, under its link. They appear and go at once: a height animation here moves every
                  link below (and, closing above, the column itself) for a third of a second on each switch. */}
              {!switcher && here === l.href && l.sections && l.sections.length > 1 && (
                // A list of filters (?category=…) marks the one in the address. Reading the address needs a Suspense
                // boundary on a prerendered page; until it is read, the list shows with nothing marked.
                l.sections.some((x) => x.href.includes("?")) ? (
                  <React.Suspense fallback={<Sections label={l.label} sections={l.sections} filter />}>
                    <FilterSections label={l.label} sections={l.sections} />
                  </React.Suspense>
                ) : (
                  <Sections label={l.label} sections={l.sections} />
                )
              )}
            </React.Fragment>
          ))}
        </div>
      ))}
    </nav>
  )
}

type Section = NonNullable<NavLink["sections"]>[number]

/** The open page's sections under its link: examples to jump to, or, on /icons, categories to filter by. */
// A filter keeps the page where it is (scroll={false}); an example link is a jump to its anchor, so it scrolls as usual.
function Sections({ label, sections, current, filter = false }: { label: string; sections: Section[]; current?: string; filter?: boolean }) {
  return (
    <ul aria-label={`${label} ${filter ? "categories" : "examples"}`} className="ml-3 flex flex-col border-l border-border">
      {sections.map((s) => (
        <li key={s.href}>
          <Link
            href={s.href}
            scroll={filter ? false : undefined}
            aria-current={s.href === current ? "true" : undefined}
            className={cn(
              "-ml-px flex min-h-(--h-sm) items-center gap-2 border-l py-1 pr-2 pl-3 text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground focus-visible:-outline-offset-2",
              s.href === current ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            {s.count !== undefined && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{s.count}</span>}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Sections that filter the page: the one the address names is current; with none named, the first ("All"). */
function FilterSections({ label, sections }: { label: string; sections: Section[] }) {
  const params = useSearchParams()
  const path = usePathname()
  const category = params.get("category")
  const current = category ? `${path}?category=${category}` : sections[0]?.href
  return <Sections label={label} sections={sections} current={current} filter />
}
