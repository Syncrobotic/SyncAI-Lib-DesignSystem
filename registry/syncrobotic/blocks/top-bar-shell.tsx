// @syncrobotic/top-bar-shell v0.32.0 · update: npx shadcn add @syncrobotic/top-bar-shell --overwrite
"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShellSearch, sampleUserMenu, type AppSearch, type AppUser, type AppUserMenuItem } from "@/registry/syncrobotic/blocks/app-shell"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

export type TopBarLink = { label: string; href: string }

export type TopBarShellLabels = {
  /** The navigation landmark around the links, in the bar and in the phone drawer. */
  nav: string
  /** The menu button that opens the drawer on phones. */
  openNav: string
  /** Read after the user's name and initials on the account button: "Ada Lovelace, AL, account menu". */
  accountMenu: string
}

export const defaultTopBarShellLabels: TopBarShellLabels = { nav: "Main", openNav: "Open navigation", accountMenu: "account menu" }

/**
 * The page's scroll-padding-top: the bar's bottom edge once it floats (--shell-top: its row and the 8 px it moves down)
 * and 8 px of air, plus a pinned tab row (--h-md) while one is stuck under it. Tokens, so density changes it too.
 */
const scrollPadding = {
  bar: "calc(var(--h-row) + var(--spacing, 0.25rem) * 4)",
  withTabs: "calc(var(--h-row) + var(--h-md) + var(--spacing, 0.25rem) * 4)",
}

/** A sticky tab row is pinned once the tabs' own section has scrolled up past it (as tabs measures it). */
const stuck = (list: HTMLElement) => {
  const section = list.parentElement
  return !!section && section.getBoundingClientRect().top < list.getBoundingClientRect().top - 1
}

type TopBarShellProps = {
  product: string
  /** Mark before the name, at 28 px. */
  logo?: React.ReactNode
  links: TopBarLink[]
  /** href of the current section. */
  current?: string
  search?: AppSearch
  /** Buttons at the right end, before the user. */
  actions?: React.ReactNode
  user?: AppUser
  userMenu?: AppUserMenuItem[]
  linkAs?: React.ElementType
  /** Where the logo and name link to. Defaults to the first link's href. */
  home?: string
  /** The id on `<main>`, for a skip link (`<a href="#main">`). */
  mainId?: string
  /** End of the page: version, copyright, links. No line above it. */
  footer?: React.ReactNode
  /** The words it says to screen readers, to translate them (topBarShellLabels in labels-zh-tw). */
  labels?: Partial<TopBarShellLabels>
  children: React.ReactNode
}

/**
 * The frame for a tool or site without a sidebar: a top bar and the content. At the top of the page the bar is part of it,
 * full width with no line; once the page scrolls it gathers into a floating panel whose edges line up with the content below,
 * 8 px down, in the card surface with a hairline, the same panel as the app shell's top bar. Only colour, edge and a
 * transform change (--motion-base), so nothing below moves. Phones put the links in a drawer.
 */
export function TopBarShell({
  product,
  logo,
  links,
  current,
  search,
  actions,
  user,
  userMenu = sampleUserMenu,
  linkAs: Link = "a",
  home = links[0]?.href ?? "#",
  mainId = "main",
  footer,
  labels,
  children,
}: TopBarShellProps) {
  const l = { ...defaultTopBarShellLabels, ...labels }
  const [scrolled, setScrolled] = React.useState(false)
  // The drawer is controlled so that following a link closes it: a client router (Next.js, React Router) keeps the
  // shell mounted, and the drawer would stay open over the new page. Modified clicks open a new tab, so it stays.
  const [drawer, setDrawer] = React.useState(false)
  const closeOnLink = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (e.target instanceof Element && e.target.closest("a[href]")) setDrawer(false)
  }
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  // The page scrolls under the sticky bar, so a control that takes focus near the top (Shift+Tab back up a table) would
  // stop under it. The page's scroll padding keeps focus clear of the bar, and of a sticky tab row while it is pinned
  // (WCAG 2.4.11), from the same tokens the bar is built of.
  const frame = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = frame.current
    const root = document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null
    if (!el || !root) return
    const before = root.style.scrollPaddingTop
    const update = () => {
      const pinned = Array.from(el.querySelectorAll<HTMLElement>('[data-slot="tabs-list"][data-sticky]')).some(stuck)
      const next = pinned ? scrollPadding.withTabs : scrollPadding.bar
      if (root.style.scrollPaddingTop !== next) root.style.scrollPaddingTop = next
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      window.removeEventListener("scroll", update)
      root.style.scrollPaddingTop = before
    }
  }, [])

  const nav = (vertical?: boolean) => (
    <nav aria-label={l.nav}className={cn("flex gap-1 text-sm", vertical ? "flex-col" : "items-center")}>
      {links.map((l) => {
        const active = l.href === current
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "press flex items-center rounded-sm px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard)",
              vertical ? "h-(--h-md)" : "h-(--h-sm)",
              active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    // --shell-top is the bar's bottom edge once it floats (its height and the 8 px it moves down): a sticky tab row
    // (TabsList sticky) or a product's filter bar pins there, on --shell-surface.
    <div
      ref={frame}
      className="flex min-h-[var(--app-shell-height,100dvh)] flex-col bg-background text-foreground [--shell-surface:var(--color-background)] [--shell-top:calc(var(--h-row)+--spacing(2))]"
    >
      <header className="pointer-events-none sticky top-0 z-20 mx-auto h-(--h-row) w-full max-w-6xl px-6">
        <div
          className={cn(
            "pointer-events-auto flex h-(--h-row) items-center gap-6 rounded-md px-4 ring-1",
            "transition-[background-color,box-shadow,translate,margin] duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none",
            // At the top the bar is invisible and 16 px wider each side, so the menu icon or the logo starts on the
            // content's edge, in line with the page's text. On scroll it gathers: its edges come in to the content column.
            scrolled ? "mx-0 translate-y-2 bg-card ring-border" : "-mx-4 translate-y-0 bg-transparent ring-transparent",
          )}
        >
          <Sheet open={drawer} onOpenChange={setDrawer}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={l.openNav}
                className="press -ml-3 flex size-(--h-md) items-center justify-center rounded-sm hover:bg-accent md:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72" onClick={closeOnLink}>
              <SheetTitle className="pb-4">{product}</SheetTitle>
              {nav(true)}
            </SheetContent>
          </Sheet>
          {/* The brand is a link home: a full-height target (44, 48 in gloves), not the 28 px of the logo. */}
          <Link href={home} className="flex min-h-(--h-md) shrink-0 items-center gap-2 rounded-xs">
            {logo}
            <span className="text-sm font-bold">{product}</span>
          </Link>
          <div className="hidden md:block">{nav()}</div>
          <div className="ml-auto flex items-center gap-2">
            {search && <ShellSearch search={search} linkAs={Link} />}
            {actions}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${user.name}, ${user.initials}, ${l.accountMenu}`}
                    className="press flex size-(--h-md) items-center justify-center rounded-sm hover:bg-accent"
                  >
                    <Avatar>
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate">{user.name}</span>
                    {user.email && <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userMenu.map((item) => (
                    <React.Fragment key={item.label}>
                      {item.separatorBefore && <DropdownMenuSeparator />}
                      <DropdownMenuItem asChild={!!item.href} onSelect={item.onSelect}>
                        {item.href ? (
                          <Link href={item.href}>
                            {item.icon && <item.icon aria-hidden="true" />}
                            {item.label}
                          </Link>
                        ) : (
                          <>
                            {item.icon && <item.icon aria-hidden="true" />}
                            {item.label}
                          </>
                        )}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
      <main id={mainId} className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      {footer && (
        <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-6 text-xs text-muted-foreground">
          {footer}
        </footer>
      )}
    </div>
  )
}
