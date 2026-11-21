// @syncrobotic/app-shell v0.22.3 · update: npx shadcn add @syncrobotic/app-shell --overwrite
"use client"

import * as React from "react"
import {
  Bell,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge, CountBadge } from "@/registry/syncrobotic/ui/badge"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
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
import { InputGroup, InputGroupAddon } from "@/registry/syncrobotic/ui/input-group"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

export type AppNavItem = { label: string; href: string; icon: LucideIcon; /** A count, e.g. unacknowledged alarms. */ count?: number }
export type AppNavGroup = { label?: string; items: AppNavItem[] }
export type AppUser = { name: string; initials: string; email?: string }
/** One row of the user menu. Sign out goes last; it is not destructive, so it is not red. */
export type AppUserMenuItem = { label: string; icon?: LucideIcon; href?: string; onSelect?: () => void; separatorBefore?: boolean }

export type AppSearchItem = {
  label: string
  icon?: LucideIcon
  /** Right-aligned detail, e.g. a robot's state. */
  hint?: string
  /** A state hint gets its status shape, so "Stopped" never reads like "Docked". */
  status?: React.ComponentProps<typeof StatusGlyph>["status"]
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
  /** The hint in the palette's input, e.g. "Search robots, pages and actions". */
  placeholder?: string
  /** The short word in the field that opens the palette, where a long placeholder would be cut. Default "Search". */
  label?: string
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
      { label: "Schedule", href: "#schedule", icon: CalendarDays },
      { label: "Agents", href: "#agents", icon: Sparkles },
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
        { label: "Patrol dog 7F3A", icon: Bot, hint: "Patrolling", status: "active", href: "#robots/7F3A", keywords: ["7F3A"] },
        { label: "Patrol dog 2B10", icon: Bot, hint: "Docked", status: "offline", href: "#robots/2B10", keywords: ["2B10"] },
        { label: "Patrol dog 4D21", icon: Bot, hint: "Stopped", status: "danger", href: "#robots/4D21", keywords: ["4D21"] },
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
        { label: "Review alarms", icon: Bell, href: "#alarms" },
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

/** The signed-in person every sample screen shows: the sidebar's foot is the same avatar, name and email on every block. */
export const sampleUser: AppUser = { name: "Mei Lin", initials: "ML", email: "mei.lin@example.com" }

// Which backend this is, as a neutral outline. Not a status colour: the badge is on every page, all day, and a colour
// that never goes away stops meaning anything (and would dull the warnings and alarms that do need someone).
const environments = {
  production: { tone: "outline", label: "Production" },
  staging: { tone: "outline", label: "Staging" },
  local: { tone: "outline", label: "Local" },
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
  /** Levels above this page, shown before the title (a Breadcrumb's links). The title is the current page. */
  breadcrumb?: React.ReactNode
  /** Buttons at the right of the top bar. */
  actions?: React.ReactNode
  /** Which backend the tool talks to, named in a neutral outline badge next to the title. */
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
   * inset (default): see below. flush: sidebar, top bar and content share one surface, split by hairlines.
   * inset: raised panels on the page, 8 px apart and 8 px from its edge, each with 16 px inside (the same as the gap between the cards in it): the sidebar, the top bar, and the content with its footer.
   * The top bar is as tall as the sidebar's brand row, so their edges line up across the gap.
   */
  layout?: "flush" | "inset"
  /** End of the content: version, copyright, links. Scrolls with the page, never overlaps it. */
  footer?: React.ReactNode
  children: React.ReactNode
}

/**
 * Text beside the rail's icons. It is always rendered, so opening the rail never moves the icons or the logo: the
 * column of icons stays on the rail's centre line and the words fade in (--motion-base). The frame's width is what moves.
 */
const reveal = (shown: boolean) =>
  cn("whitespace-nowrap transition-opacity duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none", shown ? "opacity-100" : "opacity-0")

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
          {g.label && (
            // Collapsed, the group's name gives way to a short centred line, so groups stay apart on the rail without a
            // clipped word; the two cross-fade as the rail opens. The line sits 4 px into the 20 px row so it is 20 px from
            // the icon above (16 px group gap + 4) and 20 px from the icon below (16 + the 4 px item gap): even on both sides.
            <div className="relative h-5">
              <p className={cn("px-3 text-xs font-medium text-muted-foreground", reveal(!collapsed))}>{g.label}</p>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1 left-3 h-px w-6 bg-border transition-opacity duration-(--motion-base) ease-(--ease-standard)",
                  collapsed ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          )}
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
                  "press relative flex h-(--h-md) items-center gap-2 rounded-sm px-3 text-sm",
                  // Current page: muted fill and weight. Hover: the lighter accent, so the two never look alike.
                  active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {/* 24 px box 12 px into a 48 px item: the icon's centre sits on the rail's centre line (36 px). */}
                <span className="flex size-6 shrink-0 items-center justify-center">
                  <item.icon aria-hidden="true" className="size-5" />
                </span>
                <span className={cn("flex-1", reveal(!collapsed))}>{item.label}</span>
                {item.count ? (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-2 left-8 size-2 rounded-full bg-danger-subtle ring-1 ring-danger transition-opacity duration-(--motion-base) ease-(--ease-standard)",
                        !collapsed && "opacity-0",
                      )}
                    />
                    <CountBadge count={item.count} className={reveal(!collapsed)} />
                  </>
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
          aria-label={collapsed ? `${user.name}, ${user.initials}, account menu` : undefined}
          className={cn(
            "press flex w-full items-center gap-3 rounded-xs px-3 text-left hover:bg-accent data-[state=open]:bg-accent",
            // As a rail only the avatar shows, so the row is 44 px; opening it grows to 56 for the name and email (--motion-sheet).
            "transition-[height] duration-(--motion-sheet) ease-(--ease-standard) motion-reduce:transition-none",
            collapsed ? "h-(--h-md)" : "h-(--h-row)",
          )}
        >
          <Avatar>
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <span className={cn("flex min-w-0 flex-1 flex-col", reveal(!collapsed))}>
            <span className="truncate text-sm font-medium">{user.name}</span>
            {user.email && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
          </span>
          <ChevronsUpDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground", reveal(!collapsed))} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
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

// The platform never changes while the page is open, so there is nothing to subscribe to.
const subscribeNothing = () => () => {}
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform)

/**
 * The top bar's search. The field shows the scope and ⌘K; pressing it (or the shortcut anywhere) opens the palette,
 * where typing narrows the results and the scope narrows the groups. The scope can be changed in the field or the palette.
 */
export function ShellSearch({ search, linkAs: Link = "a" }: { search: AppSearch; linkAs?: React.ElementType }) {
  const [open, setOpen] = React.useState(false)
  const scopes = search.scopes ?? [{ value: "all", label: "Everything" }]
  const [scope, setScope] = React.useState(scopes[0].value)
  const scopeLabel = scopes.find((s) => s.value === scope)?.label
  // The platform is read on the client only; the server, and the hydrating render, say "Ctrl K" as before.
  const mac = React.useSyncExternalStore(subscribeNothing, isMac, () => false)
  React.useEffect(() => {
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
          className="press mx-1 flex h-(--h-sm) shrink-0 items-center gap-2 rounded-xs px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
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
      <div className="hidden h-(--h-md) w-80 items-center rounded-sm bg-card ring-1 ring-input ring-inset lg:flex">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press flex h-full min-w-0 flex-1 items-center gap-2 rounded-l-sm pl-3 text-left text-sm text-muted-foreground hover:text-foreground"
        >
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{search.label ?? "Search"}</span>
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
                      {item.hint && (
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.status && <StatusGlyph status={item.status} />}
                          {item.hint}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <>
                      {item.icon && <item.icon aria-hidden="true" />}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.status && <StatusGlyph status={item.status} />}
                          {item.hint}
                        </span>
                      )}
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

/**
 * The pin button's icon: a panel whose sidebar column is filled while the sidebar is kept open and hollow when it is a
 * rail. The fill swaps at --motion-fast (the swap pattern), 2 px stroke like every icon.
 */
function SidebarIcon({ pinned }: { pinned: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path
        d="M4 4h5v16H4z"
        stroke="none"
        fill="currentColor"
        className={cn("transition-opacity duration-(--motion-fast) ease-(--ease-standard)", pinned ? "opacity-100" : "opacity-0")}
      />
      <path d="M9 3v18" />
    </svg>
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
  breadcrumb,
  actions,
  environment,
  user,
  userMenu,
  onSearch,
  search,
  linkAs,
  bleed,
  layout = "inset",
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

  // The logo sits in a 48 px box 12 px in, so its centre is the rail's centre line, open or closed; only the name moves.
  const brand = (
    <span className="flex min-w-0 items-center">
      <span className="flex w-12 shrink-0 items-center justify-center">
        {logo ?? (
          <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground">
            {product.slice(0, 1)}
          </span>
        )}
      </span>
      <span className={cn("truncate text-sm font-bold", reveal(expanded))}>{product}</span>
    </span>
  )

  return (
    // The screen's height, unless the page puts something above the shell (a banner): it sets --app-shell-height.
    <div className={cn("flex h-[var(--app-shell-height,100dvh)] bg-background text-foreground", inset && "gap-2 p-2")}>
      {/* The sidebar's place in the layout: as wide as the pinned state. When the rail peeks open, the panel grows over the content. */}
      <div className={cn("relative hidden shrink-0 transition-[width] duration-(--motion-sheet) ease-(--ease-standard) sm:block", open ? "w-60" : "w-18")}>
        <aside
          ref={aside}
          aria-label="Sidebar"
          onMouseEnter={() => !open && hover && setPeek("hover")}
          onMouseLeave={() => peek === "hover" && !menuOpen && setPeek("closed")}
          onPointerDown={(e) => tapMode && peek === "closed" && !isControl(e.target) && setPeek("tap")}
          className={cn(
            "absolute inset-y-0 left-0 z-30 flex flex-col overflow-hidden bg-card",
            "transition-[width,box-shadow] duration-(--motion-sheet) ease-(--ease-standard)",
            expanded ? "w-60" : "w-18",
            inset ? "rounded-md ring-1 ring-border" : "border-r border-border",
            peek !== "closed" && "shadow-float",
          )}
        >
          {/* Flush: lined, level with the top bar's line. Inset: no lines; on the rail, groups are set apart by short lines
              where their names were. */}
          <div className={cn("flex h-(--h-row) shrink-0 items-center gap-2 border-b px-3", inset ? "border-transparent" : "border-border")}>
            <span className="min-w-0 flex-1">{brand}</span>
            <span inert={!expanded} className={cn("shrink-0", reveal(expanded))}>
              <button
                type="button"
                aria-label={open ? "Collapse sidebar" : "Keep sidebar open"}
                aria-pressed={open}
                onClick={() => {
                  setPinned(!open)
                  setPeek("closed")
                }}
                className="press flex size-(--h-md) shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <SidebarIcon pinned={open} />
              </button>
            </span>
          </div>
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">
            <Nav nav={nav} current={current} collapsed={!expanded} linkAs={linkAs} onNavigate={onNavigate} />
          </div>
          {user && (
            <div className={cn("shrink-0 border-t p-2", inset ? "border-transparent" : "border-border")}>
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
        <header
          className={cn(
            "flex h-(--h-row) shrink-0 items-center gap-3",
            inset ? "px-4" : "px-6",
            inset ? "rounded-md bg-card ring-1 ring-border" : "border-b border-border",
          )}
        >
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
          {breadcrumb && <div className="hidden min-w-0 shrink items-center gap-1 md:flex">{breadcrumb}</div>}
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {/* On phones the title keeps the room; the environment shows from 640 px. */}
          {env && (
            <Badge tone={env.tone} className="max-sm:hidden">
              {env.label}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            {search && <ShellSearch search={search} linkAs={linkAs} />}
            {onSearch && (
              <InputGroup className="hidden w-64 lg:flex">
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <Input type="search" aria-label="Search" placeholder="Search" onChange={(e) => onSearch(e.target.value)} />
              </InputGroup>
            )}
            {actions}
          </div>
        </header>
        <main className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", inset && "rounded-md bg-card ring-1 ring-border")}>
          <div className={cn("flex-1", !bleed && (inset ? "p-4" : "p-6"))}>{children}</div>
          {footer && (
            <footer
              className={cn("flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 text-xs text-muted-foreground", inset ? "px-4" : "px-6")}
            >
              {footer}
            </footer>
          )}
        </main>
      </div>
    </div>
  )
}
