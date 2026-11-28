"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useSelectedLayoutSegment } from "next/navigation"
import { componentBase } from "@/site/component-tabs"
import { cn } from "@/lib/utils"
import { inScope } from "./scope-match"
import { rememberArea } from "./nav-data"
import type { AreaNav, NavLink, PageSections, Scope } from "./scopes"

export const scopeFor = (scopes: Pick<Scope, "match">[], path: string) =>
  Math.max(
    0,
    scopes.findIndex((s) => s.match.some((m) => inScope(m, path))),
  )

/**
 * The areas in the drawer: real tabs, as the header's row shows them on desktop (an underline, quiet). Choosing one shows
 * its pages under the tabs without leaving the page you are on; the list is the tab panel. Its baseline is the drawer
 * header's edge, drawn once the list has scrolled under it (`edge`). Arrow keys, Home and End move between tabs.
 */
export function AreaTabs({ scopes, area, onArea, panel, edge }: { scopes: Pick<Scope, "key" | "label">[]; area: string; onArea: (key: string) => void; panel: string; edge: boolean }) {
  const tabs = React.useRef<HTMLDivElement>(null)
  const move = (e: React.KeyboardEvent) => {
    const i = scopes.findIndex((s) => s.key === area)
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? scopes.length - 1 : null
    if (next === null) return
    e.preventDefault()
    const key = scopes[(next + scopes.length) % scopes.length].key
    onArea(key)
    tabs.current?.querySelector<HTMLElement>(`[data-area="${key}"]`)?.focus()
  }
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tabindex: the tabs take focus; the tablist handles their bubbled arrow keys
    <div
      ref={tabs}
      role="tablist"
      aria-label="Areas"
      onKeyDown={move}
      className={cn(
        "scroll-row flex gap-4 overflow-x-auto overflow-y-hidden border-b px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        edge ? "border-border" : "border-transparent",
      )}
    >
      {scopes.map((s) => (
        <button
          key={s.key}
          type="button"
          role="tab"
          data-area={s.key}
          aria-selected={s.key === area}
          aria-controls={panel}
          tabIndex={s.key === area ? 0 : -1}
          onClick={() => onArea(s.key)}
          className={cn(
            // The ring sits inside the tab: the row scrolls sideways, so it clips anything drawn outside it.
            "-mb-px inline-flex h-(--h-md) shrink-0 items-center border-b-2 text-sm whitespace-nowrap transition-colors duration-(--motion-fast) ease-(--ease-standard) focus-visible:-outline-offset-2",
            s.key === area ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

/**
 * The groups of an area: in the sidebar, of the page's own (its area's sidebar layout passes it, and the page its
 * `sections`); in the drawer (`switcher`), of the area its tabs have chosen.
 */
export function Sidebar({ area: active, switcher = false, path: frozen, sections }: { area: AreaNav; switcher?: boolean; path?: string; sections?: React.ReactNode }) {
  // The drawer passes the page it was opened on, so its list holds still while it closes on the way to another page.
  const current = usePathname()
  const path = frozen ?? current
  // A component page's tabs belong to its one link.
  const here = componentBase(path)
  const nav = React.useRef<HTMLElement>(null)
  // The drawer opens on this area without asking for it.
  React.useEffect(() => {
    if (!switcher) rememberArea(active)
  }, [active, switcher])
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
  }, [path, active.key])
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
      {active.groups.map((g, gi) => (
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
                {/* The current page's grey is the link's own background, so the inset focus ring draws over it. It does not
                    slide: a sliding layer would sweep down the scrolling column on every switch. */}
                <span className="min-w-0 truncate">{l.label}</span>
                {/* Over half the items are beta, so the mark stays quiet: small grey words, no outline, there to find
                    rather than to catch the eye. The component page states it again beside its version. */}
                {l.beta && <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">Beta</span>}
              </Link>
              {/* The open page's examples, under its link; its page sends them. They appear and go at once: a height
                  animation here moves every link below (and, closing above, the column itself) for a third of a second. */}
              {!switcher && here === l.href && sections}
            </React.Fragment>
          ))}
        </div>
      ))}
    </nav>
  )
}

/** An area's own sidebar, unless the page is in an area nested under its address (`segment`: Components under /docs). */
export function UnlessNested({ segment, own, children }: { segment: string; own: React.ReactNode; children: React.ReactNode }) {
  return useSelectedLayoutSegment() === segment ? children : own
}

type Section = NonNullable<NavLink["sections"]>[number]

/** A page's sections under its link: anchors on the page (`#…`), or filters of it (`?category=…`). */
export function SidebarSections({ label, href, sections }: PageSections) {
  // A list of filters marks the one in the address. Reading the address needs a Suspense boundary on a prerendered page;
  // until it is read, the list shows with nothing marked.
  return sections.some((x) => x.href.includes("?")) ? (
    <React.Suspense fallback={<Sections label={label} sections={sections} filter />}>
      <FilterSections label={label} sections={sections} />
    </React.Suspense>
  ) : (
    <Sections label={label} sections={sections.map((x) => (x.href.startsWith("#") ? { ...x, href: href + x.href } : x))} />
  )
}

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
