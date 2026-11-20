"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"
import { componentBase } from "@/site/component-tabs"
import * as m from "motion/react-m"
import { cn } from "@/lib/utils"
import { patterns } from "./motion"
import type { Scope } from "./scopes"

export const scopeFor = (scopes: Pick<Scope, "match">[], path: string) =>
  Math.max(
    0,
    scopes.findIndex((s) => s.match.some((m) => path === m || path.startsWith(`${m}/`))),
  )

/** The groups of the area you are in. On phones (`switcher`) it also offers the other areas, which the header shows on desktop. */
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
    <nav ref={nav} aria-label={`${active.label} navigation`} className="flex flex-col gap-6 text-sm">
      {!switcher && <p className="px-3 text-sm font-medium text-muted-foreground">{active.label}</p>}
      {/* The areas, as the header shows them on desktop: one quiet row of tabs with an underline, not a second set of
          buttons louder than the pages. On the home page there is no area yet: the four are the list. */}
      {switcher && !home && (
        <div role="list" aria-label="Areas" className="flex gap-4 overflow-x-auto border-b border-border px-3">
          {scopes.map((s) => (
            <Link
              key={s.key}
              role="listitem"
              href={s.href}
              aria-current={s.key === active.key ? "true" : undefined}
              className={cn(
                "-mb-px inline-flex h-(--h-sm) shrink-0 items-center border-b-2 text-sm whitespace-nowrap transition-colors duration-(--motion-fast) ease-(--ease-standard)",
                s.key === active.key ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
      {switcher && home && (
        <div role="list" aria-label="Areas" className="flex flex-col gap-1">
          {scopes.map((s) => (
            <Link
              key={s.key}
              role="listitem"
              href={s.href}
              className="press flex h-(--h-sm) items-center rounded-xs px-3 text-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent"
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
          {g.links.map((l) => (
            <React.Fragment key={l.href}>
              <Link
                href={l.href}
                aria-current={path === l.href ? "page" : here === l.href ? "true" : undefined}
                data-current={here === l.href || undefined}
                className={cn(
                  "press relative flex h-(--h-sm) items-center rounded-xs px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
                  here === l.href ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* The current-page marker slides to the page you open. */}
                {here === l.href && <m.span layoutId={`${switcher ? "m-" : ""}sidebar-marker`} aria-hidden className="absolute inset-0 rounded-xs bg-muted" />}
                <span className="relative">{l.label}</span>
              </Link>
              {/* The open page's examples grow in under it (the sheet pattern: height and opacity, --motion-sheet). */}
              <AnimatePresence initial={false}>
                {!switcher && here === l.href && l.sections && l.sections.length > 1 && (
                  <m.ul
                    key="sections"
                    aria-label={`${l.label} examples`}
                    initial="hidden"
                    animate="shown"
                    exit="hidden"
                    variants={patterns.sheet}
                    className="ml-3 flex flex-col overflow-hidden border-l border-border"
                  >
                    {l.sections.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          className="flex min-h-(--h-sm) items-center py-1 pr-2 pl-3 text-sm text-muted-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground"
                        >
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </m.ul>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </div>
      ))}
    </nav>
  )
}
