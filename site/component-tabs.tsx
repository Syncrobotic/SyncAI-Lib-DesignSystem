"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as m from "motion/react-m"
import { patterns } from "@/site/motion"
import { cn } from "@/lib/utils"

export type ComponentTab = { href: string; label: string }

/** A component page's address without its tab: /docs/components/x/properties → /docs/components/x. */
export const componentBase = (path: string) => path.replace(/^(\/docs\/components\/[^/]+)\/(properties|accessibility)$/, "$1")

// Where the underline was on the last component page. Switching tab remounts the tabs (the docs template does), so the
// underline starts from here and travels, instead of appearing under the new tab.
let last: { base: string; x: number; w: number } | null = null

/** The tab a path is on: the longest tab href it starts with, so /x/properties is not taken for /x. */
function current(path: string, tabs: ComponentTab[]) {
  return [...tabs].sort((a, b) => b.href.length - a.href.length).find((t) => path === t.href || path.startsWith(`${t.href}/`))?.href
}

/**
 * Overview · Properties · Accessibility, one page each (a link, so each has its own URL, is prerendered and can be
 * shared). Drawn like the kit's Tabs: the underline travels to the tab you pick (the Move pattern, --motion-base), and the
 * head of the page above stays where it is.
 */
export function ComponentTabs({ tabs }: { tabs: ComponentTab[] }) {
  const path = usePathname()
  const active = current(path, tabs)
  const base = tabs[0].href
  const list = React.useRef<HTMLDivElement>(null)
  // Read once, on mount: the underline the tab before left behind, if it belongs to this set of tabs.
  const [carried] = React.useState(() => (last?.base === base ? { x: last.x, w: last.w } : null))
  const [line, setLine] = React.useState<{ x: number; w: number } | null>(carried)
  // The first measurement places the underline without travelling; later ones animate. Carried over from the tab before,
  // it is already placed, and travels from there.
  const [placed, setPlaced] = React.useState(carried !== null)
  React.useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const measure = () => {
      const on = el.querySelector<HTMLElement>('[aria-current="page"]')
      const next = on ? { x: on.offsetLeft, w: on.offsetWidth } : null
      setLine(next)
      last = next ? { base, ...next } : null
    }
    // Paint the old position once before moving, or there is nothing to travel from.
    const frame = carried ? requestAnimationFrame(() => requestAnimationFrame(measure)) : (measure(), 0)
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
    // `carried` is state that never changes, so listing it re-runs nothing.
  }, [active, base, carried])
  React.useEffect(() => {
    if (line && !placed) requestAnimationFrame(() => setPlaced(true))
  }, [line, placed])

  return (
    <nav aria-label="Page sections" className="pb-6">
      <div ref={list} className="relative flex gap-4 overflow-x-auto overflow-y-hidden border-b border-border" data-underline={line ? "" : undefined}>
        {tabs.map((t) => {
          const on = t.href === active
          return (
            <Link
              key={t.href}
              href={t.href}
              scroll={false}
              aria-current={on ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex h-(--h-md) items-center border-b-2 border-transparent text-sm whitespace-nowrap text-muted-foreground",
                "transition-colors duration-(--motion-base) ease-(--ease-standard) hover:text-foreground",
                on && "font-medium text-foreground",
                // Until the underline is measured, the current tab draws its own; then the travelling one does.
                on && !line && "border-foreground",
              )}
            >
              {t.label}
            </Link>
          )
        })}
        {line && (
          <span
            aria-hidden="true"
            className={cn("pointer-events-none absolute bottom-0 left-0 h-0.5 bg-foreground", placed && "transition-[translate,width] duration-(--motion-base) ease-(--ease-standard)")}
            style={{ translate: `${line.x}px 0`, width: line.w }}
          />
        )}
      </div>
    </nav>
  )
}

/** A tab's content arrives (the Appear pattern: 8 px rise and fade, --motion-base); keyed by path, so each switch plays it. */
export function ComponentPanel({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    // A tab that opens on a heading does not add the heading's top space under the tabs.
    <m.div key={path} initial="hidden" animate="shown" variants={patterns.appear} className="[&>h2:first-child]:pt-0">
      {children}
    </m.div>
  )
}
