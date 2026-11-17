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
  return (
    <nav aria-label={`${active.label} navigation`} className="flex flex-col gap-6 text-sm">
      {!switcher && <p className="px-3 text-sm font-medium text-muted-foreground">{active.label}</p>}
      {switcher && (
        <div role="list" aria-label="Areas" className="grid grid-cols-3 gap-1 rounded-sm bg-muted p-1">
          {scopes.map((s) => (
            <Link
              key={s.key}
              role="listitem"
              href={s.href}
              aria-current={s.key === active.key ? "true" : undefined}
              className={cn(
                "press relative flex h-(--h-sm) items-center justify-center rounded-xs text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard)",
                s.key === active.key ? "font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.key === active.key && <m.span layoutId="area-marker" aria-hidden className="absolute inset-0 rounded-xs bg-primary" />}
              <span className="relative">{s.label}</span>
            </Link>
          ))}
        </div>
      )}
      {active.groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{g.title}</p>
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
