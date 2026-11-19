"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { site } from "./config"
import type { Scope } from "./scopes"
import { Sidebar } from "./sidebar"

/**
 * Phones and tablets (below 1024 px): a menu button in the header opens the navigation from the left, as on most docs sites. It
 * holds the four areas and the pages of the one you are in, opens scrolled to the page you are on, and closes when you
 * go somewhere. On every page, the home page included.
 */
export function NavDrawer({ scopes }: { scopes: Scope[] }) {
  const [open, setOpen] = React.useState(false)
  const path = usePathname()
  const [last, setLast] = React.useState(path)
  // Close when the page changes (a link was followed). Adjusting state during render, not in an effect.
  if (path !== last) {
    setLast(path)
    setOpen(false)
  }
  React.useEffect(() => {
    // An in-page link (an example on this page) changes only the hash; close for that too.
    const close = () => setOpen(false)
    window.addEventListener("hashchange", close)
    return () => window.removeEventListener("hashchange", close)
  }, [])
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open navigation"
        className="press flex size-(--h-md) shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" data-scroll className="w-[85vw] gap-6 p-4">
        <div className="flex items-center justify-between gap-2 pl-3">
          <SheetTitle className="text-base">Navigation</SheetTitle>
          <SheetDescription className="sr-only">The areas of the design system and the pages of the one you are in.</SheetDescription>
          <SheetClose aria-label="Close navigation" className="press flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </div>
        <Sidebar scopes={scopes} switcher />
        {/* On phones the header has no room for GitHub; it closes the drawer's list instead. */}
        <div className="shrink-0 border-t border-border pt-4 sm:hidden">
          <a
            href={site.repo}
            className="press flex h-(--h-sm) items-center rounded-xs px-3 text-sm text-muted-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
