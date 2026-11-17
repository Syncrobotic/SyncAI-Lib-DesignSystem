// @syncrobotic/app-shell v0.7.0 · update: npx shadcn add @syncrobotic/app-shell --overwrite
"use client"

import * as React from "react"
import {
  Bell,
  Bot,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Search,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

export type AppNavItem = { label: string; href: string; icon: LucideIcon; /** A count, e.g. unacknowledged alarms. */ count?: number }
export type AppNavGroup = { label?: string; items: AppNavItem[] }
export type AppUser = { name: string; initials: string; email?: string }
/** One row of the user menu. Sign out goes last; it is not destructive, so it is not red. */
export type AppUserMenuItem = { label: string; icon?: LucideIcon; href?: string; onSelect?: () => void; separatorBefore?: boolean }

/** Navigation shared by the engineering-tool templates. Replace with your own. */
export const sampleNav: AppNavGroup[] = [
  {
    items: [
      { label: "Overview", href: "#overview", icon: LayoutDashboard },
      { label: "Robots", href: "#robots", icon: Bot },
      { label: "Map", href: "#map", icon: Map },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Alarms", href: "#alarms", icon: Bell, count: 2 },
      { label: "Event log", href: "#events", icon: ScrollText },
      { label: "Settings", href: "#settings", icon: Settings },
    ],
  },
]

/** The user menu every tool starts with. Replace the hrefs, or pass your own `userMenu`. */
export const sampleUserMenu: AppUserMenuItem[] = [
  { label: "Account", icon: UserRound, href: "#account" },
  { label: "Preferences", icon: Settings, href: "#preferences" },
  { label: "Sign out", icon: LogOut, href: "#sign-out", separatorBefore: true },
]

const environments = {
  production: { tone: "danger", label: "Production" },
  staging: { tone: "warning", label: "Staging" },
  local: { tone: "neutral", label: "Local" },
} as const

type AppShellProps = {
  /** The tool's name, top of the sidebar. */
  product: string
  /** Mark before the name, at 28 px (e.g. the SYNCROBOTIC mark). */
  logo?: React.ReactNode
  nav: AppNavGroup[]
  /** href of the current page. */
  current?: string
  /** Page title in the top bar. */
  title: string
  /** Buttons at the right of the top bar. */
  actions?: React.ReactNode
  /** Which backend the tool talks to. Production is red so nobody mistakes it for a test. */
  environment?: keyof typeof environments
  /** Bottom of the sidebar: who is signed in, and a menu for account, preferences and sign out. */
  user?: AppUser
  userMenu?: AppUserMenuItem[]
  /** Shown as a search field in the top bar when set. */
  onSearch?: (query: string) => void
  /** Swap in your router's link (e.g. next/link). */
  linkAs?: React.ElementType
  /** Content fills the area edge to edge, for maps and video. */
  bleed?: boolean
  /**
   * flush: sidebar, top bar and content share one surface, split by hairlines.
   * inset: two raised panels on the page with an 8 px margin: the sidebar, and the top bar with content and footer.
   * Their top rows are the same height and their hairlines meet in one line across the gap.
   */
  layout?: "flush" | "inset"
  /** End of the content: version, copyright, links. Scrolls with the page, never overlaps it. */
  footer?: React.ReactNode
  children: React.ReactNode
}

function Nav({ nav, current, collapsed, linkAs: Link = "a" }: { nav: AppNavGroup[]; current?: string; collapsed?: boolean; linkAs?: React.ElementType }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-4">
      {nav.map((g, i) => (
        <div key={g.label ?? i} className="flex flex-col gap-1">
          {g.label && !collapsed && <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{g.label}</p>}
          {g.items.map((item) => {
            const active = item.href === current
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? (item.count ? `${item.label}, ${item.count}` : item.label) : undefined}
                className={cn(
                  "press flex h-(--h-md) items-center gap-3 rounded-sm px-3 text-sm",
                  active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <item.icon aria-hidden="true" className="size-5 shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.count ? <span className="text-xs font-medium text-danger tabular-nums">{item.count}</span> : null}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

/**
 * Who is signed in, at the foot of the sidebar: one button with avatar, name and email that opens the account menu
 * upwards. Collapsed, only the avatar shows and the name is its label. The same control in every tool.
 */
export function SidebarUserMenu({ user, items = sampleUserMenu, collapsed, linkAs: Link = "a" }: { user: AppUser; items?: AppUserMenuItem[]; collapsed?: boolean; linkAs?: React.ElementType }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={collapsed ? `${user.name}, account menu` : undefined}
          className={cn(
            "press flex h-(--h-row) w-full items-center gap-3 rounded-sm px-3 text-left hover:bg-accent data-[state=open]:bg-accent",
            collapsed && "justify-center px-0",
          )}
        >
          <Avatar>
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{user.name}</span>
                {user.email && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
              </span>
              <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{user.name}</span>
          {user.email && <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
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
  )
}

/**
 * The frame of an internal tool, in three zones: the sidebar (navigation, collapsible on desktop, a sheet on phones,
 * with the user menu at its foot), the top bar (page title, environment, search, actions), and the content with its footer.
 * `layout="inset"` floats the sidebar and the content as two panels with a margin, top rows level.
 */
export function AppShell({
  product,
  logo,
  nav,
  current,
  title,
  actions,
  environment,
  user,
  userMenu,
  onSearch,
  linkAs,
  bleed,
  layout = "flush",
  footer,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const env = environment ? environments[environment] : null
  const inset = layout === "inset"
  return (
    <div className={cn("flex h-dvh bg-background text-foreground", inset && "gap-2 p-2")}>
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-card transition-[width] duration-(--motion-base) ease-(--ease-standard) md:flex",
          inset ? "overflow-hidden rounded-md ring-1 ring-border" : "border-r border-border",
          collapsed ? "w-18" : "w-60",
        )}
      >
        {/* Same height as the top bar, so the brand row and the bar read as one line across the screen. */}
        <div className={cn("flex h-(--h-row) shrink-0 items-center gap-2 border-b border-border px-3", collapsed && "justify-center")}>
          {!collapsed && (
            <span className="flex min-w-0 flex-1 items-center gap-2 pl-3">
              {logo}
              <span className="truncate text-sm font-bold">{product}</span>
            </span>
          )}
          <button
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((v) => !v)}
            className="press flex size-(--h-sm) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" className="size-5" /> : <PanelLeftClose aria-hidden="true" className="size-5" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <Nav nav={nav} current={current} collapsed={collapsed} linkAs={linkAs} />
        </div>
        {user && (
          <div className="shrink-0 border-t border-border p-3">
            <SidebarUserMenu user={user} items={userMenu} collapsed={collapsed} linkAs={linkAs} />
          </div>
        )}
      </aside>

      <div className={cn("flex min-w-0 flex-1 flex-col", inset && "overflow-hidden rounded-md bg-card ring-1 ring-border")}>
        <header className="flex h-(--h-row) shrink-0 items-center gap-3 border-b border-border px-6">
          <Sheet>
            <SheetTrigger asChild>
              <button type="button" aria-label="Open navigation" className="press -ml-3 flex size-(--h-md) items-center justify-center rounded-sm hover:bg-accent md:hidden">
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetTitle className="pb-4">{product}</SheetTitle>
              <Nav nav={nav} current={current} linkAs={linkAs} />
              {user && (
                <div className="mt-auto border-t border-border pt-3">
                  <SidebarUserMenu user={user} items={userMenu} linkAs={linkAs} />
                </div>
              )}
            </SheetContent>
          </Sheet>
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {env && <Badge tone={env.tone}>{env.label}</Badge>}
          <div className="ml-auto flex items-center gap-2">
            {onSearch && (
              <div className="relative hidden lg:block">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" aria-label="Search" placeholder="Search" className="w-64 pl-(--h-sm)" onChange={(e) => onSearch(e.target.value)} />
              </div>
            )}
            {actions}
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className={cn("flex-1", !bleed && "p-6")}>{children}</div>
          {footer && (
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-border px-6 py-3 text-xs text-muted-foreground">
              {footer}
            </footer>
          )}
        </main>
      </div>
    </div>
  )
}
