// @syncrobotic/app-shell v0.6.0 · update: npx shadcn add @syncrobotic/app-shell --overwrite
"use client"

import * as React from "react"
import { Bell, Bot, LayoutDashboard, Map, Menu, PanelLeftClose, PanelLeftOpen, ScrollText, Search, Settings, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Input } from "@/registry/syncrobotic/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"

export type AppNavItem = { label: string; href: string; icon: LucideIcon; /** A count, e.g. unacknowledged alarms. */ count?: number }
export type AppNavGroup = { label?: string; items: AppNavItem[] }

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
  user?: { name: string; initials: string }
  /** Shown as a search field in the top bar when set. */
  onSearch?: (query: string) => void
  /** Swap in your router's link (e.g. next/link). */
  linkAs?: React.ElementType
  /** Content fills the area edge to edge, for maps and video. */
  bleed?: boolean
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
                {!collapsed && item.count ? (
                  <span className="text-xs font-medium text-danger tabular-nums">
                    {item.count}
                  </span>
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
 * The frame of an internal tool: sidebar navigation (collapsible on desktop, a sheet on phones),
 * a top bar with the page title, search, environment and user, and the page content.
 */
export function AppShell({ product, logo, nav, current, title, actions, environment, user, onSearch, linkAs, bleed, children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false)
  const env = environment ? environments[environment] : null
  return (
    <div className="flex h-dvh bg-background text-foreground">
      <aside className={cn("hidden shrink-0 flex-col border-r border-border bg-card md:flex", collapsed ? "w-18" : "w-60")}>
        {/* Same height and hairline as the top bar, so the brand row and the bar read as one line across the screen. */}
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
          <div className={cn("flex h-(--h-row) shrink-0 items-center gap-3 border-t border-border px-6", collapsed && "justify-center px-3")}>
            <Avatar>
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            {!collapsed && <span className="truncate text-sm">{user.name}</span>}
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
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
        <main className={cn("min-h-0 flex-1 overflow-y-auto", !bleed && "p-6")}>{children}</main>
      </div>
    </div>
  )
}
