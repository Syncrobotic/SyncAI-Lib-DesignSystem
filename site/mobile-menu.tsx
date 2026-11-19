"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { ChevronDown } from "lucide-react"
import { patterns, t } from "./motion"
import type { Scope } from "./scopes"
import { scopeFor } from "./sidebar"

/** Phones: the sidebar folds into a panel under a Menu button. It opens with the sheet movement and closes when you navigate. */
export function MobileMenu({ scopes, children }: { scopes: Scope[]; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const path = usePathname()
  // The button says where you are, not just "Menu": the area, then the page.
  const area = scopes[scopeFor(scopes, path)]
  const page = area.groups.flatMap((g) => g.links).find((l) => l.href === path)?.label
  const id = React.useId()
  React.useEffect(() => setOpen(false), [path])
  // An in-page link (an example on this page) changes only the hash; close for that too.
  React.useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener("hashchange", close)
    return () => window.removeEventListener("hashchange", close)
  }, [])
  return (
    <div className="mb-8 overflow-hidden rounded-md border border-border md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="press flex h-(--h-md) w-full items-center justify-between px-4 text-sm font-medium"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-muted-foreground">{area.label}</span>
          {page && <span className="truncate">{page}</span>}
          <span className="sr-only">, menu</span>
        </span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={t.base} aria-hidden>
          <ChevronDown className="size-4" />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div id={id} key="panel" initial="hidden" animate="shown" exit="hidden" variants={patterns.sheet} className="overflow-hidden">
            {/* Capped at most of the screen and scrolled inside, so opening it never pushes the page several screens down. */}
            <div className="max-h-[70dvh] overflow-y-auto overscroll-contain border-t border-border p-4">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
