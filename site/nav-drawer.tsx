"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { site } from "./config"
import type { Scope } from "./scopes"
import { Sidebar } from "./sidebar"
import { quietNextPage } from "./page-transition"
import { Logo } from "./logo"

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
  // The list shows the page the drawer was opened on. Were it to follow the address, it would rearrange itself while the
  // drawer fades out (the marker sliding, the examples folding and unfolding, the column re-scrolling): the jump on phones.
  const [shown, setShown] = React.useState(path)
  const change = (next: boolean) => {
    if (next) setShown(path)
    setOpen(next)
  }
  // A tap marks its link at once, and the drawer stays until the next page has arrived under it (the path change above
  // closes it): it then slides away from the new page. Closing on the tap showed the old page through the sliding drawer
  // and then swapped it for the new one, two changes for one tap. A link to the page you are on just closes.
  const onLink = (e: React.MouseEvent) => {
    // Capture phase: next/link prevents the default in its own handler, so a bubbling handler would see every click as
    // already handled. Modified clicks open a new tab and leave this page alone.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]")
    if (!a || a.hasAttribute("target")) return
    const url = new URL(a.href)
    if (url.origin !== location.origin) return
    if (url.pathname === path) return setOpen(false)
    setShown(url.pathname)
    quietNextPage()
  }
  React.useEffect(() => {
    // An in-page link (an example on this page) changes only the hash; close for that too.
    const close = () => setOpen(false)
    window.addEventListener("hashchange", close)
    return () => window.removeEventListener("hashchange", close)
  }, [])
  return (
    <Sheet open={open} onOpenChange={change}>
      <SheetTrigger
        aria-label="Open navigation"
        className="press flex size-(--h-md) shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" data-scroll className="w-[85vw] gap-6 p-4" onClickCapture={onLink}>
        {/* The brand where the site's header has it; it is also the way home. */}
        <div className="flex items-center justify-between gap-2 pl-3">
          <Link href="/" aria-label="Design System home" className="flex items-center">
            <Logo />
          </Link>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">The areas of the design system and the pages of the one you are in.</SheetDescription>
          <SheetClose aria-label="Close navigation" className="press flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </div>
        <Sidebar scopes={scopes} switcher path={shown} />
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
