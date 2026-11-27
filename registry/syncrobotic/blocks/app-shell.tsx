// @syncrobotic/app-shell v0.49.0 · update: npx shadcn add @syncrobotic/app-shell --overwrite
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
  /** The search's own words: the dialog's name, the scope button and the empty result, e.g. shellSearchLabels from labels-zh-tw. */
  labels?: Partial<ShellSearchLabels>
}

export type ShellSearchLabels = {
  /** The icon button's name, the dialog's title, and the field's word when `label` is not set. */
  search: string
  /** The scope button's name. */
  scope: (scope: string) => string
  /** No result for the query in the chosen scope. */
  empty: (query: string, scope: string) => string
}

export const defaultShellSearchLabels: ShellSearchLabels = {
  search: "Search",
  scope: (scope) => `Search scope: ${scope}`,
  empty: (query, scope) => `No match for “${query}” in ${scope.toLowerCase()}. Try another word, or search everything.`,
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
  /**
   * The sidebar as the person left it, read on the server from its cookies, so the first paint is already right instead
   * of the default (open on wide screens, 240 px) followed by a jump: `sidebarOpen` from the "sidebar_state" cookie
   * ("true" or "false"), `sidebarWidth` from "sidebar_state_width" (px). In Next.js, in the server component around it:
   * `const c = await cookies()`, then `sidebarOpen={c.get("sidebar_state") ? c.get("sidebar_state")?.value === "true" : undefined}`
   * and `sidebarWidth={Number(c.get("sidebar_state_width")?.value) || undefined}`.
   */
  sidebarOpen?: boolean
  sidebarWidth?: number
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
  const { state, isMobile, setOpen } = useSidebar()
  const rail = state === "collapsed" && !isMobile
  const [menuOpen, setMenuOpen] = React.useState(false)
  const trigger = React.useRef<HTMLButtonElement>(null)
  // On the rail the menu has no room for the name and email it repeats, so pressing the avatar opens the sidebar first and
  // the menu once the column has finished moving, where it is when the sidebar is open: above the button, as wide as it.
  // Without motion (or if the column is not moving) it opens at once; if the fold is reversed midway, it stays closed.
  const openFromRail = () => {
    const frame = trigger.current?.closest<HTMLElement>("[data-slot=sidebar]")
    setOpen(true)
    if (!frame || parseFloat(getComputedStyle(frame).transitionDuration) === 0) return setMenuOpen(true)
    const settle = (event: TransitionEvent) => {
      if (event.target !== frame || event.propertyName !== "width") return
      frame.removeEventListener("transitionend", settle)
      frame.removeEventListener("transitioncancel", settle)
      if (event.type === "transitionend") setMenuOpen(true)
    }
    frame.addEventListener("transitionend", settle)
    frame.addEventListener("transitioncancel", settle)
  }
  return (
    <DropdownMenu open={menuOpen} onOpenChange={(next) => (next && rail ? openFromRail() : setMenuOpen(next))}>
      <DropdownMenuTrigger ref={trigger} asChild>
        {/* Named by what it shows (initials, name, email) and then what it opens, so speech input can say what is on screen
            (WCAG 2.5.3): no aria-label that would reorder the words. */}
        {/* Open: 40 px (44 on touch), 8 px corners. As a rail: a 44 px square with 12 px corners, as the links' buttons;
            the height and the corners move with the fold, the width follows the column. The 28 px avatar stays 20 px in
            (pl-2) on the 34 px centre line all through it, and the name follows 8 px after it, as the brand's name after
            the mark. The chevron lines up with the counts above (pr-3). */}
        <SidebarMenuButton
          size="lg"
          tooltip={user.name}
          className={cn(
            "h-10 gap-2 rounded-xs pr-3 pl-2 text-foreground pointer-coarse:h-(--h-md)",
            "transition-[height,border-radius,background-color,color] duration-(--motion-sheet) ease-(--ease-standard) motion-reduce:transition-none",
            "group-data-[collapsible=icon]/sidebar:h-11 group-data-[collapsible=icon]/sidebar:rounded-sm",
          )}
        >
          {/* 28 px, as the mark at the top: both sit 14 px from their edges, on the 34 px centre line. */}
          <Avatar className="size-7">
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
      <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
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
  const l = { ...defaultShellSearchLabels, ...search.labels }
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

  // In the field it fits inside it (4 px in); in the palette it is a compact control.
  const scopeMenu = (inField: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-slot="shell-search-scope"
          aria-label={l.scope(scopeLabel ?? "")}
          className={cn(
            "press mx-1 flex shrink-0 items-center gap-2 rounded-xs px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
            inField ? "my-1 self-stretch" : "h-(--h-sm)",
          )}
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
      {/* Wide screens: a field with the scope inside, filled rather than outlined, so it is not a box inside the top
          bar's box. Narrow: an icon button. Both open the palette. */}
      <div className="hidden h-(--h-sm) w-80 items-center rounded-sm bg-muted lg:flex">
        <button
          type="button"
          data-slot="shell-search"
          onClick={() => setOpen(true)}
          className="press flex h-full min-w-0 flex-1 items-center gap-2 rounded-l-sm pl-3 text-left text-sm text-muted-foreground hover:text-foreground"
        >
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{search.label ?? l.search}</span>
          <CommandShortcut className="mr-1">{shortcut}</CommandShortcut>
        </button>
        {scopes.length > 1 && scopeMenu(true)}
      </div>
      <button
        type="button"
        data-slot="shell-search"
        aria-label={l.search}
        onClick={() => setOpen(true)}
        className="press flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title={l.search} description={search.placeholder}>
        <CommandInput placeholder={search.placeholder ?? l.search} end={scopes.length > 1 ? scopeMenu(false) : undefined} />
        <CommandList>
          <CommandEmpty>{(query) => l.empty(query, scopeLabel ?? "")}</CommandEmpty>
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
 * The sidebar is the kit's Sidebar: open on wide screens (1280 px and up) and a 68 px rail of icons with tooltips below
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
  sidebarOpen,
  sidebarWidth,
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
      defaultOpen={sidebarOpen ?? wide}
      defaultWidth={sidebarWidth}
      labels={sidebarLabels}
      className={cn(
        "h-[var(--app-shell-height,100dvh)] bg-background text-foreground [--shell-top:0]",
        inset ? "gap-2 p-2 [--shell-surface:var(--color-card)]" : "[--shell-surface:var(--color-background)]",
      )}
    >
      <Sidebar variant={inset ? "floating" : "sidebar"}>
        {/* The brand row is as tall as the top bar, so their edges line up across the gap. The 28 px logo sits 20 px
            in, so its centre is the rail's centre line (34 px), open or closed; the name follows 8 px after it, as the
            account's name after the avatar. Only the name fades. Flush: lined, level
            with the top bar's line. */}
        {/* The mark stays centred in the row in both states (14 px from the top), level with the page's title across the
            gap: raising it on the rail to mirror the avatar's 12 px broke that line, and the line reads first. */}
        <SidebarHeader
          className={cn(
            "h-(--h-row) justify-center border-b py-0",
            inset ? "border-transparent" : "border-border",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="ml-2 flex size-7 shrink-0 items-center justify-center">
              {logo ?? (
                <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-xs bg-primary text-sm font-bold text-primary-foreground">
                  {product.slice(0, 1)}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold whitespace-nowrap transition-opacity duration-(--motion-base) ease-(--ease-standard) group-data-[collapsible=icon]/sidebar:opacity-0">
              {product}
            </span>
          </span>
        </SidebarHeader>
        <SidebarContent>
          <AppNav nav={nav} current={current} linkAs={linkAs} />
        </SidebarContent>
        {user && (
          // Open: 56 px, as the brand row, 8 px around a 40 px account button, its 8 px corner concentric with the sidebar's
          // 16 (16 = 8 + 8). As a rail: a 44 px square like the links', 12 px from the bottom as from either side, so the
          // avatar sits 20 px in from three edges, as the mark does in its row. The fold moves the padding with the column.
          <SidebarFooter
            className={cn(
              "border-t py-2 transition-[padding] duration-(--motion-sheet) ease-(--ease-standard) group-data-[collapsible=icon]/sidebar:py-3 motion-reduce:transition-none",
              inset ? "border-transparent" : "border-border",
            )}
          >
            <SidebarUserMenu user={user} items={userMenu} linkAs={linkAs} />
          </SidebarFooter>
        )}
        {/* The handle beside the sidebar: drag to resize, click (or Enter) to collapse and expand; ⌘B / Ctrl+B anywhere.
            Inset it sits in the 8 px gap, over nothing; flush, on the hairline. */}
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
          {/* Phones only: the menu button that opens the sheet. Wide screens fold the sidebar at its edge. */}
          <SidebarTrigger show="mobile" className="-ms-2" />
          {breadcrumb && <div className="hidden min-w-0 shrink items-center gap-1 md:flex">{breadcrumb}</div>}
          {/* The page's title, 18 px: above its sections and cards (16), quiet in the 56 px bar. */}
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
              <InputGroup className={cn("hidden w-64 lg:flex", inset && "bg-muted ring-0")}>
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
