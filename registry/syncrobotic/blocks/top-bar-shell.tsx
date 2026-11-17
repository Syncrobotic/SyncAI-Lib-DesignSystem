// @syncrobotic/top-bar-shell v0.7.0 · update: npx shadcn add @syncrobotic/top-bar-shell --overwrite
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
  /** End of the page: version, copyright, links. No line above it. */
  footer?: React.ReactNode
  children: React.ReactNode
}

/**
 * The frame for a tool or site without a sidebar: a top bar and the content. At the top of the page the bar is part of it,
 * full width with no line; once the page scrolls it gathers into a floating panel as wide as the content (max 1152 px),
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
  footer,
  children,
}: TopBarShellProps) {
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  const nav = (vertical?: boolean) => (
    <nav aria-label="Main" className={cn("flex gap-1 text-sm", vertical ? "flex-col" : "items-center")}>
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
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="pointer-events-none sticky top-0 z-20 h-(--h-row) px-2">
        <div
          className={cn(
            "pointer-events-auto mx-auto flex h-(--h-row) max-w-6xl items-center gap-6 rounded-md px-6 ring-1",
            "transition-[background-color,box-shadow,translate] duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none",
            scrolled ? "translate-y-2 bg-card ring-border" : "translate-y-0 bg-transparent ring-transparent",
          )}
        >
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="press -ml-2 flex size-(--h-md) items-center justify-center rounded-sm hover:bg-accent md:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetTitle className="pb-4">{product}</SheetTitle>
              {nav(true)}
            </SheetContent>
          </Sheet>
          <Link href={links[0]?.href ?? "#"} className="flex shrink-0 items-center gap-2">
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
                    aria-label={`${user.name}, account menu`}
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      {footer && (
        <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-6 text-xs text-muted-foreground">
          {footer}
        </footer>
      )}
    </div>
  )
}
