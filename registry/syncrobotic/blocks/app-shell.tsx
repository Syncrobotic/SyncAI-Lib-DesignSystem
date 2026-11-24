// @syncrobotic/app-shell v0.32.0 · update: npx shadcn add @syncrobotic/app-shell --overwrite
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
  ScrollText,
  Search,
  Settings,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/registry/syncrobotic/ui/badge"
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuTag,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
  type SidebarLabels,
} from "@/registry/syncrobotic/ui/sidebar"

/** A page under a nav item, shown under it while its section is current. */
export type AppNavSubItem = { label: string; href: string; count?: number; tag?: string }
export type AppNavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** A count, e.g. unacknowledged alarms. */
  count?: number
  /** A quiet word after the name: "Beta", "New". */
  tag?: string
  /** Pages of this section, listed under it while it (or one of them) is current. */
  items?: AppNavSubItem[]
}
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

/**
 * Navigation shared by the engineering-tool templates: every page a template shows is in it, so each one marks its own
 * place (a section's pages show under it while one of them is current). Replace with your own.
 */
export const sampleNav: AppNavGroup[] = [
  {
    items: [
      { label: "Overview", href: "#overview", icon: LayoutDashboard },
      {
        label: "Robots",
        href: "#robots",
        icon: Bot,
        items: [
          { label: "Maintenance", href: "#maintenance" },
          { label: "Rollouts", href: "#rollouts" },
        ],
      },
      { label: "Map", href: "#map", icon: Map },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Alarms", href: "#alarms", icon: Bell, count: 2, items: [{ label: "Incidents", href: "#incidents" }] },
      { label: "Schedule", href: "#schedule", icon: CalendarDays },
      { label: "Agents", href: "#agents", icon: Sparkles },
      { label: "Event log", href: "#events", icon: ScrollText },
      {
        label: "Settings",
        href: "#settings",
        icon: Settings,
        items: [
          { label: "Users", href: "#users" },
          { label: "Invitations", href: "#invitations" },
          { label: "Audit log", href: "#audit-log" },
        ],
      },
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
  /** The sidebar's words (its trigger, landmarks and phone sheet), e.g. sidebarProviderLabels from labels-zh-tw. */
  sidebarLabels?: Partial<SidebarLabels>
  children: React.ReactNode
}

function AppNav({ nav, current, linkAs: Link = "a" }: { nav: AppNavGroup[]; current?: string; linkAs?: React.ElementType }) {
  const { state, isMobile } = useSidebar()
  const rail = state === "collapsed" && !isMobile
  return nav.map((g, i) => (
    <SidebarGroup key={g.label ?? i}>
      {g.label && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
      <SidebarMenu>
        {g.items.map((item) => {
          const inSection = item.items?.some((s) => s.href === current) ?? false
          return (
            <SidebarMenuItem key={item.href}>
              {/* A page under this one is current: open, the section is in ink and its pages show below it; as a rail,
                  the section's icon takes the current look, since its pages are hidden. */}
              <SidebarMenuButton
                asChild
                isActive={item.href === current || (rail && inSection)}
                aria-current={item.href === current ? "page" : inSection ? "true" : undefined}
                tooltip={item.label}
                className={cn(inSection && "text-foreground")}
              >
                <Link href={item.href}>
                  <item.icon aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.tag && <SidebarMenuTag>{item.tag}</SidebarMenuTag>}
                  {item.count ? <SidebarMenuBadge count={item.count} /> : null}
                </Link>
              </SidebarMenuButton>
              {item.items && item.items.length > 0 && (item.href === current || inSection) && (
                <SidebarMenuSub>
                  {item.items.map((sub) => (
                    <SidebarMenuSubItem key={sub.href}>
                      <SidebarMenuSubButton asChild isActive={sub.href === current}>
                        <Link href={sub.href}>
                          <span>{sub.label}</span>
                          {sub.tag && <SidebarMenuTag>{sub.tag}</SidebarMenuTag>}
                          {sub.count ? <SidebarMenuBadge count={sub.count} /> : null}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  ))
}

/**
 * Who is signed in, at the foot of the sidebar: one button with avatar, name and email that opens the account menu
 * upwards. As a rail only the avatar shows, with the name as its tooltip. The same control in every tool. It reads the
 * sidebar's state, so it goes inside a SidebarProvider (the AppShell has one).
 */
export function SidebarUserMenu({ user, items = sampleUserMenu, linkAs: Link = "a" }: { user: AppUser; items?: AppUserMenuItem[]; linkAs?: React.ElementType }) {
  const { state, isMobile } = useSidebar()
  const rail = state === "collapsed" && !isMobile
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Named by what it shows (initials, name, email) and then what it opens, so speech input can say what is on screen
            (WCAG 2.5.3): no aria-label that would reorder the words. */}
        <SidebarMenuButton size="lg" tooltip={user.name} className="text-foreground">
          <Avatar>
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            {user.email && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
          </span>
          <span className="sr-only">, account menu</span>
          <ChevronsUpDown aria-hidden="true" className="text-muted-foreground" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={rail ? "right" : "top"} align={rail ? "end" : "start"} className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
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
  // The first scope is the widest one, which shows every group; an empty list falls back to the default's value.
  const widest = scopes[0]?.value ?? "all"
  const [scope, setScope] = React.useState(widest)
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
  const groups = search.groups.filter((g) => scope === widest || g.scope === scope)

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
          <CommandEmpty>{(query) => `No match for “${query}” in ${scopeLabel?.toLowerCase()}. Try another word, or search everything.`}</CommandEmpty>
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

// Open on wide screens (1280 px and up) and a rail below, until the person chooses: the sidebar keeps that in its cookie.
const WIDE = "(min-width: 1280px)"
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
const wideNow = () => window.matchMedia(WIDE).matches

/**
 * The frame of an internal tool, in three zones: the sidebar (navigation, with the user menu at its foot), the top bar
 * (sidebar trigger, page title, environment, search, actions), and the content with its footer.
 *
 * The sidebar is the kit's Sidebar: open on wide screens (1280 px and up) and a 72 px rail of icons with tooltips below
 * that, until the person toggles it; the choice is kept in a cookie. Collapse is on the sidebar itself: a quiet button at
 * the end of its brand row and, for a mouse, its edge (hover shows a hairline). While it is a rail, the expand button sits
 * at the start of the top bar, and the edge expands it too. ⌘B / Ctrl+B toggles it anywhere. Phones get it as a sheet
 * from the left, opened by the top bar's menu button. `layout="inset"` floats the sidebar, the top bar and the content as separate panels.
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
  sidebarLabels,
  children,
}: AppShellProps) {
  const wide = React.useSyncExternalStore(subscribeWide, wideNow, () => true)
  const env = environment ? environments[environment] : null
  const inset = layout === "inset"

  return (
    // The screen's height, unless the page puts something above the shell (a banner): it sets --app-shell-height.
    // The page scrolls inside <main>, below the top bar, so what pins to the top (TabsList sticky) pins at 0
    // (--shell-top), on the content panel's surface (--shell-surface).
    <SidebarProvider
      defaultOpen={wide}
      labels={sidebarLabels}
      className={cn(
        "h-[var(--app-shell-height,100dvh)] bg-background text-foreground [--shell-top:0]",
        inset ? "gap-2 p-2 [--shell-surface:var(--color-card)]" : "[--shell-surface:var(--color-background)]",
      )}
    >
      <Sidebar variant={inset ? "floating" : "sidebar"}>
        {/* The brand row is as tall as the top bar, so their edges line up across the gap. The logo sits in a 48 px box
            12 px in, so its centre is the rail's centre line, open or closed; only the name fades. Flush: lined, level
            with the top bar's line. */}
        <SidebarHeader className={cn("h-(--h-row) justify-center border-b py-0", inset ? "border-transparent" : "border-border")}>
          <span className="flex min-w-0 items-center gap-1">
            <span className="flex w-12 shrink-0 items-center justify-center">
              {logo ?? (
                <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground">
                  {product.slice(0, 1)}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold whitespace-nowrap transition-opacity duration-(--motion-base) ease-(--ease-standard) group-data-[collapsible=icon]/sidebar:opacity-0">
              {product}
            </span>
            {/* Collapse lives on the sidebar it collapses, at the end of the brand row, quiet (muted ink, no fill until
                hover). It shows only while the sidebar is open on a wide screen; the top bar's trigger takes over after. */}
            <SidebarTrigger show="expanded" className="-me-1" />
          </span>
        </SidebarHeader>
        <SidebarContent>
          <AppNav nav={nav} current={current} linkAs={linkAs} />
        </SidebarContent>
        {user && (
          <SidebarFooter className={cn("border-t", inset ? "border-transparent" : "border-border")}>
            <SidebarUserMenu user={user} items={userMenu} linkAs={linkAs} />
          </SidebarFooter>
        )}
        {/* The edge, for a mouse: hover shows a hairline, a click collapses or expands. */}
        <SidebarRail />
      </Sidebar>

      {/* Inset: the top bar and the content are two panels, 8 px apart, so the bar never reads as part of the page.
          The bar's panel is as tall as the sidebar's brand row, so their bottom edges line up across the gap. */}
      <SidebarInset className={cn(inset && "gap-2")}>
        <header
          className={cn(
            "flex h-(--h-row) shrink-0 items-center gap-3",
            inset ? "px-4" : "px-6",
            inset ? "rounded-md bg-card ring-1 ring-border" : "border-b border-border",
          )}
        >
          {/* Expand, while the sidebar is a rail; on phones, the menu button that opens the sheet. Hidden while open. */}
          <SidebarTrigger show="collapsed" className="-ms-2" />
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
      </SidebarInset>
    </SidebarProvider>
  )
}
