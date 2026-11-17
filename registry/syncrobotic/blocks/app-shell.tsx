// @syncrobotic/app-shell v0.7.0 · update: npx shadcn add @syncrobotic/app-shell --overwrite
"use client"

import * as React from "react"
import {
  Bell,
  Bot,
  ChevronDown,
  ChevronsUpDown,
  CirclePlus,
  CheckCheck,
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
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/registry/syncrobotic/ui/command"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

export type AppNavItem = { label: string; href: string; icon: LucideIcon; /** A count, e.g. unacknowledged alarms. */ count?: number }
export type AppNavGroup = { label?: string; items: AppNavItem[] }
export type AppUser = { name: string; initials: string; email?: string }
/** One row of the user menu. Sign out goes last; it is not destructive, so it is not red. */
export type AppUserMenuItem = { label: string; icon?: LucideIcon; href?: string; onSelect?: () => void; separatorBefore?: boolean }

export type AppSearchItem = {
  label: string
  icon?: LucideIcon
  /** Right-aligned detail, e.g. a robot's state. */ hint?: string
  href?: string
  onSelect?: () => void
  keywords?: string[]
}
export type AppSearchGroup = {
  heading: string
  /** The scope this group belongs to; groups outside the chosen scope are hidden. */ scope: string
  items: AppSearchItem[]
}
export type AppSearch = {
  placeholder?: string
  /** What the search covers. The first is the default, e.g. "Everything". */
  scopes?: { value: string; label: string }[]
  groups: AppSearchGroup[]
}

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

/** A search to start from: pages, robots and actions, scoped. Replace with your data. */
export const sampleSearch: AppSearch = {
  placeholder: "Search robots, pages and actions",
  scopes: [
    { value: "all", label: "Everything" },
    { value: "robots", label: "Robots" },
    { value: "pages", label: "Pages" },
    { value: "actions", label: "Actions" },
  ],
  groups: [
    {
      heading: "Robots",
      scope: "robots",
      items: [
        { label: "Patrol dog 7F3A", icon: Bot, hint: "Patrolling", href: "#robots/7F3A", keywords: ["7F3A"] },
        { label: "Patrol dog 2B10", icon: Bot, hint: "Docked", href: "#robots/2B10", keywords: ["2B10"] },
        { label: "Patrol dog 4D21", icon: Bot, hint: "Stopped", href: "#robots/4D21", keywords: ["4D21"] },
      ],
    },
    {
      heading: "Pages",
      scope: "pages",
      items: [
        { label: "Overview", icon: LayoutDashboard, href: "#overview" },
        { label: "Map", icon: Map, href: "#map" },
        { label: "Event log", icon: ScrollText, href: "#events" },
      ],
    },
    {
      heading: "Actions",
      scope: "actions",
      items: [
        { label: "New mission", icon: CirclePlus, href: "#missions/new" },
        { label: "Acknowledge all alarms", icon: CheckCheck, href: "#alarms" },
      ],
    },
  ],
}

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
  /** A plain filter field in the top bar, for a page that filters what it shows. */
  onSearch?: (query: string) => void
  /** The tool's search: a field in the top bar with a scope, opening a palette (also on ⌘K / Ctrl+K). */
  search?: AppSearch
  /** Swap in your router's link (e.g. next/link). */
  linkAs?: React.ElementType
  /** Content fills the area edge to edge, for maps and video. */
  bleed?: boolean
  /**
   * flush: sidebar, top bar and content share one surface, split by hairlines.
   * inset: raised panels on the page, 8 px apart: the sidebar, the top bar, and the content with its footer.
   * The top bar is as tall as the sidebar's brand row, so their edges line up across the gap.
   */
  layout?: "flush" | "inset"
  /** End of the content: version, copyright, links. Scrolls with the page, never overlaps it. */
  footer?: React.ReactNode
  children: React.ReactNode
}

function Nav({
  nav,
  current,
  collapsed,
  linkAs: Link = "a",
  onNavigate,
}: {
  nav: AppNavGroup[]
  current?: string
  collapsed?: boolean
  linkAs?: React.ElementType
  onNavigate?: (e: React.MouseEvent) => void
}) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-4">
      {nav.map((g, i) => (
        <div key={g.label ?? i} className="flex flex-col gap-1">
          {/* Collapsed, a group label would be a clipped word; keep its height so icons do not jump when the rail opens. */}
          {g.label && <p className={cn("h-5 truncate px-3 text-xs font-medium text-muted-foreground", collapsed && "invisible")}>{g.label}</p>}
          {g.items.map((item) => {
            const active = item.href === current
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? (item.count ? `${item.label}, ${item.count}` : item.label) : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "press relative flex h-(--h-md) items-center gap-3 rounded-sm px-3 text-sm",
                  active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon aria-hidden="true" className="size-5 shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {item.count ? (
                  collapsed ? (
                    <span aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-danger" />
                  ) : (
                    <span className="text-xs font-medium text-danger tabular-nums">{item.count}</span>
                  )
                ) : null}
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
export function SidebarUserMenu({
  user,
  items = sampleUserMenu,
  collapsed,
  linkAs: Link = "a",
  onOpenChange,
}: {
  user: AppUser
  items?: AppUserMenuItem[]
  collapsed?: boolean
  linkAs?: React.ElementType
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={collapsed ? `${user.name}, account menu` : undefined}
          className={cn("press flex h-(--h-row) w-full items-center gap-3 rounded-sm px-2 text-left hover:bg-accent data-[state=open]:bg-accent")}
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
 * The top bar's search. The field shows the scope and ⌘K; pressing it (or the shortcut anywhere) opens the palette,
 * where typing narrows the results and the scope narrows the groups. The scope can be changed in the field or the palette.
 */
function ShellSearch({ search, linkAs: Link = "a" }: { search: AppSearch; linkAs?: React.ElementType }) {
  const [open, setOpen] = React.useState(false)
  const scopes = search.scopes ?? [{ value: "all", label: "Everything" }]
  const [scope, setScope] = React.useState(scopes[0].value)
  const scopeLabel = scopes.find((s) => s.value === scope)?.label
  const [mac, setMac] = React.useState(false)
  React.useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform))
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  const shortcut = mac ? "⌘K" : "Ctrl K"
  const groups = search.groups.filter((g) => scope === scopes[0].value || g.scope === scope)

  const scopeMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Search scope: ${scopeLabel}`}
          className="press flex h-(--h-sm) shrink-0 items-center gap-1 rounded-xs px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {scopeLabel}
          <ChevronDown aria-hidden="true" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {scopes.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onSelect={() => setScope(s.value)}
            aria-current={s.value === scope || undefined}
            className={cn(s.value === scope && "font-medium")}
          >
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {/* Wide screens: a field with the scope inside. Narrow: an icon button. Both open the palette. */}
      <div className="hidden h-(--h-sm) w-80 items-center rounded-sm bg-background pr-1 ring-1 ring-input ring-inset lg:flex">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press flex h-full min-w-0 flex-1 items-center gap-2 rounded-l-sm pl-3 text-left text-sm text-muted-foreground hover:text-foreground"
        >
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{search.placeholder ?? "Search"}</span>
          <CommandShortcut className="mr-1">{shortcut}</CommandShortcut>
        </button>
        {scopes.length > 1 && scopeMenu}
      </div>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="press flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description={search.placeholder}>
        <CommandInput placeholder={search.placeholder ?? "Search"} end={scopes.length > 1 ? scopeMenu : undefined} />
        <CommandList>
          <CommandEmpty>No match in {scopeLabel?.toLowerCase()}. Try another word, or search everything.</CommandEmpty>
          {groups.map((g) => (
            <CommandGroup key={g.heading} heading={g.heading}>
              {g.items.map((item) => (
                <CommandItem
                  key={item.label}
                  value={[item.label, ...(item.keywords ?? [])].join(" ")}
                  onSelect={() => {
                    setOpen(false)
                    item.onSelect?.()
                  }}
                  asChild={!!item.href}
                >
                  {item.href ? (
                    <Link href={item.href}>
                      {item.icon && <item.icon aria-hidden="true" />}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                    </Link>
                  ) : (
                    <>
                      {item.icon && <item.icon aria-hidden="true" />}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                    </>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}

/** Which way the collapsed rail opens: by hover where there is a mouse, by a tap on touch tablets. */
function usePointerMode() {
  const [mode, setMode] = React.useState<{ hover: boolean; wide: boolean }>({ hover: true, wide: true })
  React.useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)")
    const wide = window.matchMedia("(min-width: 1280px)")
    const update = () => setMode({ hover: hover.matches, wide: wide.matches })
    update()
    hover.addEventListener("change", update)
    wide.addEventListener("change", update)
    return () => {
      hover.removeEventListener("change", update)
      wide.removeEventListener("change", update)
    }
  }, [])
  return mode
}

const isControl = (el: EventTarget | null) => el instanceof Element && !!el.closest("a, button, input, select, textarea, [role=button], [role=menuitem]")

/**
 * The frame of an internal tool, in three zones: the sidebar (navigation, with the user menu at its foot), the top bar
 * (page title, environment, search, actions), and the content with its footer.
 *
 * Sidebar: open on wide screens (1280 px and up); a 72 px rail of icons below that, showing the logo at the top.
 * The rail opens over the content without moving it: on hover with a mouse, on a tap on touch tablets (a tap on an
 * icon opens the rail first, the next one navigates; a tap outside closes it). The pin button keeps it open.
 * Phones get a drawer from the menu button. `layout="inset"` floats the sidebar, the top bar and the content as separate panels.
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
  search,
  linkAs,
  bleed,
  layout = "flush",
  footer,
  children,
}: AppShellProps) {
  const { hover, wide } = usePointerMode()
  // null: follow the screen (open when wide). A press of the pin button makes it the person's choice.
  const [pinned, setPinned] = React.useState<boolean | null>(null)
  const open = pinned ?? wide
  const [peek, setPeek] = React.useState<"closed" | "hover" | "tap">("closed")
  const [menuOpen, setMenuOpen] = React.useState(false)
  const expanded = open || peek !== "closed"
  const aside = React.useRef<HTMLElement>(null)
  const env = environment ? environments[environment] : null
  const inset = layout === "inset"

  // A tap outside closes a rail opened by tap.
  React.useEffect(() => {
    if (peek !== "tap") return
    const close = (e: PointerEvent) => {
      if (!aside.current?.contains(e.target as Node)) setPeek("closed")
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [peek])

  const tapMode = !open && !hover
  const onNavigate = (e: React.MouseEvent) => {
    if (tapMode && peek === "closed") {
      e.preventDefault()
      setPeek("tap")
      return
    }
    setPeek("closed")
  }

  const brand = (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex size-7 shrink-0 items-center justify-center">
        {logo ?? (
          <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground">
            {product.slice(0, 1)}
          </span>
        )}
      </span>
      {expanded && <span className="truncate text-sm font-bold">{product}</span>}
    </span>
  )

  return (
    <div className={cn("flex h-dvh bg-background text-foreground", inset && "gap-2 p-2")}>
      {/* The sidebar's place in the layout: as wide as the pinned state. When the rail peeks open, the panel grows over the content. */}
      <div className={cn("relative hidden shrink-0 transition-[width] duration-(--motion-base) ease-(--ease-standard) sm:block", open ? "w-60" : "w-18")}>
        <aside
          ref={aside}
          aria-label="Sidebar"
          onMouseEnter={() => !open && hover && setPeek("hover")}
          onMouseLeave={() => peek === "hover" && !menuOpen && setPeek("closed")}
          onPointerDown={(e) => tapMode && peek === "closed" && !isControl(e.target) && setPeek("tap")}
          className={cn(
            "absolute inset-y-0 left-0 z-30 flex flex-col overflow-hidden bg-card",
            "transition-[width,box-shadow] duration-(--motion-base) ease-(--ease-standard)",
            expanded ? "w-60" : "w-18",
            inset ? "rounded-md ring-1 ring-border" : "border-r border-border",
            peek !== "closed" && "shadow-overlay",
          )}
        >
          {/* Flush: always lined, level with the top bar's line. Inset: lined only as a rail, where the logo and the avatar
              need setting apart from a column of bare icons; open, the labels and group names do that. */}
          <div className={cn("flex h-(--h-row) shrink-0 items-center gap-2 border-b pr-3 pl-6", !inset || !expanded ? "border-border" : "border-transparent")}>
            <span className="min-w-0 flex-1">{brand}</span>
            {expanded && (
              <button
                type="button"
                aria-label={open ? "Collapse sidebar" : "Keep sidebar open"}
                aria-pressed={open}
                onClick={() => {
                  setPinned(!open)
                  setPeek("closed")
                }}
                className="press flex size-(--h-sm) shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {open ? <PanelLeftClose aria-hidden="true" className="size-5" /> : <PanelLeftOpen aria-hidden="true" className="size-5" />}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">
            <Nav nav={nav} current={current} collapsed={!expanded} linkAs={linkAs} onNavigate={onNavigate} />
          </div>
          {user && (
            <div className={cn("shrink-0 border-t p-3", !inset || !expanded ? "border-border" : "border-transparent")}>
              <SidebarUserMenu
                user={user}
                items={userMenu}
                collapsed={!expanded}
                linkAs={linkAs}
                onOpenChange={(o) => {
                  setMenuOpen(o)
                  if (!o && peek === "hover" && !aside.current?.matches(":hover")) setPeek("closed")
                }}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Inset: the top bar and the content are two panels, 8 px apart, so the bar never reads as part of the page.
          The bar's panel is as tall as the sidebar's brand row, so their bottom edges line up across the gap. */}
      <div className={cn("flex min-w-0 flex-1 flex-col", inset && "gap-2")}>
        <header className={cn("flex h-(--h-row) shrink-0 items-center gap-3 px-6", inset ? "rounded-md bg-card ring-1 ring-border" : "border-b border-border")}>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="press -ml-3 flex size-(--h-md) items-center justify-center rounded-sm hover:bg-accent sm:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetTitle className="pb-4">{product}</SheetTitle>
              <Nav nav={nav} current={current} linkAs={linkAs} />
              {user && (
                <div className="mt-auto pt-3">
                  <SidebarUserMenu user={user} items={userMenu} linkAs={linkAs} />
                </div>
              )}
            </SheetContent>
          </Sheet>
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {env && <Badge tone={env.tone}>{env.label}</Badge>}
          <div className="ml-auto flex items-center gap-2">
            {search && <ShellSearch search={search} linkAs={linkAs} />}
            {onSearch && (
              <div className="relative hidden lg:block">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" aria-label="Search" placeholder="Search" className="w-64 pl-(--h-sm)" onChange={(e) => onSearch(e.target.value)} />
              </div>
            )}
            {actions}
          </div>
        </header>
        <main className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", inset && "rounded-md bg-card ring-1 ring-border")}>
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
