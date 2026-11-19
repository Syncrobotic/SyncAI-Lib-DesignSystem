"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"
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
export function Sidebar({ scopes, switcher = false }: { scopes: Scope[]; switcher?: boolean }) {
  const path = usePathname()
  const active = scopes[scopeFor(scopes, path)]
  // The home page belongs to no area: in the drawer, Home is current and no area is selected.
  const home = path === "/"
  const nav = React.useRef<HTMLElement>(null)
  // Open where you are: if the current page's link is out of view in its scrolling column (or the drawer), centre it.
  // Only that box scrolls, never the page.
  React.useEffect(() => {
    const link = nav.current?.querySelector<HTMLElement>('a[aria-current="page"]')
    const box = link?.closest<HTMLElement>("[data-scroll]")
    if (!link || !box) return
    const l = link.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    if (l.top >= b.top && l.bottom <= b.bottom) return
    box.scrollTop += l.top - b.top - b.height / 2 + l.height / 2
  }, [path])
  return (
    <nav ref={nav} aria-label={`${active.label} navigation`} className="flex flex-col gap-6 text-sm">
      {!switcher && <p className="px-3 text-sm font-medium text-muted-foreground">{active.label}</p>}
      {switcher && (
        <Link
          href="/"
          aria-current={home ? "page" : undefined}
          className={cn(
            "press flex h-(--h-sm) items-center rounded-xs px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
            home ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Home
        </Link>
      )}
      {switcher && (
        <div role="list" aria-label="Areas" className="grid grid-cols-2 gap-1 rounded-sm bg-muted p-1">
          {scopes.map((s) => (
            <Link
              key={s.key}
              role="listitem"
              href={s.href}
              aria-current={!home && s.key === active.key ? "true" : undefined}
              className={cn(
                "press relative flex h-(--h-sm) items-center justify-center rounded-xs text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard)",
                !home && s.key === active.key ? "font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {!home && s.key === active.key && <m.span layoutId="area-marker" aria-hidden className="absolute inset-0 rounded-xs bg-primary" />}
              <span className="relative">{s.label}</span>
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
                aria-current={path === l.href ? "page" : undefined}
                className={cn(
                  "press relative flex h-(--h-sm) items-center rounded-xs px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
                  path === l.href ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* The current-page marker slides to the page you open. */}
                {path === l.href && <m.span layoutId={`${switcher ? "m-" : ""}sidebar-marker`} aria-hidden className="absolute inset-0 rounded-xs bg-muted" />}
                <span className="relative">{l.label}</span>
              </Link>
              {/* The open page's examples grow in under it (the sheet pattern: height and opacity, --motion-sheet). */}
              <AnimatePresence initial={false}>
                {path === l.href && l.sections && l.sections.length > 1 && (
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
                        <a
                          href={s.href}
                          className="flex min-h-(--h-sm) items-center py-1 pr-2 pl-3 text-sm text-muted-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground"
                        >
                          {s.label}
                        </a>
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
