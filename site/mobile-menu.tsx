"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "motion/react"
import * as m from "motion/react-m"
import { ChevronDown } from "lucide-react"
import { patterns, t } from "./motion"

/** Phones: the sidebar folds into a panel under a Menu button. It opens with the sheet movement and closes when you navigate. */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const path = usePathname()
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
        Menu
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={t.base} aria-hidden>
          <ChevronDown className="size-4" />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div id={id} key="panel" initial="hidden" animate="shown" exit="hidden" variants={patterns.sheet} className="overflow-hidden">
            <div className="border-t border-border p-4">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
