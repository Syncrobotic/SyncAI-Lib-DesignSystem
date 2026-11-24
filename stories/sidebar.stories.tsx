import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bell, Bot, Check, ChevronsUpDown, LayoutDashboard, Map, Route, Settings, Sparkles, Warehouse } from "lucide-react"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/syncrobotic/ui/dropdown-menu"
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
} from "@/registry/syncrobotic/ui/sidebar"

const meta: Meta = { title: "Navigation/Sidebar" }
export default meta
type S = StoryObj

const sites = [
  { id: "hall-b", name: "Hall B", robots: "12 robots" },
  { id: "dock-north", name: "North dock", robots: "4 robots" },
]

/** The header's switcher: which site the console shows. A size="lg" button that opens a menu. */
function SiteSwitcher() {
  const { state, isMobile } = useSidebar()
  const rail = state === "collapsed" && !isMobile
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" tooltip="Hall B" className="text-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-muted">
            <Warehouse aria-hidden="true" className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="truncate text-sm font-medium">Hall B</span>
            <span className="truncate text-xs text-muted-foreground">12 robots</span>
          </span>
          <ChevronsUpDown aria-hidden="true" className="text-muted-foreground" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={rail ? "right" : "bottom"} align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <DropdownMenuLabel>Sites</DropdownMenuLabel>
        {sites.map((s) => (
          <DropdownMenuItem key={s.id}>
            <Warehouse aria-hidden="true" />
            <span className="flex-1">{s.name}</span>
            {s.id === "hall-b" && <Check aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Links of the sample console. The current page is Running, under Missions. */
function NavMain() {
  const { state, isMobile } = useSidebar()
  const rail = state === "collapsed" && !isMobile
  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Overview">
              <a href="#overview">
                <LayoutDashboard aria-hidden="true" />
                <span>Overview</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Robots">
              <a href="#robots">
                <Bot aria-hidden="true" />
                <span>Robots</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            {/* The section of the current page: in ink while open, the current look on the rail where its pages are hidden. */}
            <SidebarMenuButton asChild isActive={rail} aria-current="true" tooltip="Missions" className="text-foreground">
              <a href="#missions">
                <Route aria-hidden="true" />
                <span>Missions</span>
              </a>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#missions/scheduled">
                  <span>Scheduled</span>
                  <SidebarMenuBadge count={5} tone="neutral" />
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#missions/running" isActive>
                  <span>Running</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#missions/history">
                  <span>History</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Operations</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Alarms">
              <a href="#alarms">
                <Bell aria-hidden="true" />
                <span>Alarms</span>
                <SidebarMenuBadge count={2} />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Map">
              <a href="#map">
                <Map aria-hidden="true" />
                <span>Map</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Agents">
              <a href="#agents">
                <Sparkles aria-hidden="true" />
                <span>Agents</span>
                <SidebarMenuTag>Beta</SidebarMenuTag>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <a href="#settings">
                <Settings aria-hidden="true" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}

function Account() {
  const { state, isMobile } = useSidebar()
  const rail = state === "collapsed" && !isMobile
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" tooltip="Mei Lin" className="text-foreground">
          <Avatar>
            <AvatarFallback>ML</AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="truncate text-sm font-medium">Mei Lin</span>
            <span className="truncate text-xs text-muted-foreground">mei.lin@example.com</span>
          </span>
          <span className="sr-only">, account menu</span>
          <ChevronsUpDown aria-hidden="true" className="text-muted-foreground" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={rail ? "right" : "top"} align={rail ? "end" : "start"} className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <DropdownMenuItem>Account</DropdownMenuItem>
        <DropdownMenuItem>Preferences</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The sample console in a 672 px frame: the sidebar, and a page with a top bar. The frame is told whether it is a phone or
 * a desktop, so each story looks the same at any screen width; nothing is kept in a cookie.
 *
 * Collapse is on the sidebar (the default, as the app shell does it): a quiet trigger at the end of the header
 * (show="expanded"), the edge as a SidebarRail, and the expand trigger in the top bar only while it is a rail
 * (show="collapsed", the menu button on a phone). `single` is the older single trigger in the top bar, which still works.
 */
function Console({
  open = true,
  mobile = false,
  openMobile = false,
  shortcut = false,
  single = false,
}: {
  open?: boolean
  mobile?: boolean
  openMobile?: boolean
  shortcut?: boolean
  single?: boolean
}) {
  return (
    <SidebarProvider
      isMobile={mobile}
      defaultOpen={open}
      defaultOpenMobile={openMobile}
      cookieName={null}
      keyboardShortcut={shortcut ? "mod+b" : false}
      className="h-168 overflow-hidden rounded-md bg-background ring-1 ring-border"
    >
      <Sidebar>
        <SidebarHeader className="flex-row items-center gap-1">
          <div className="min-w-0 flex-1">
            <SiteSwitcher />
          </div>
          {!single && <SidebarTrigger show="expanded" />}
        </SidebarHeader>
        <SidebarContent>
          <NavMain />
        </SidebarContent>
        <SidebarFooter>
          <Account />
        </SidebarFooter>
        {!single && <SidebarRail />}
      </Sidebar>
      <SidebarInset>
        <header className="flex h-(--h-row) shrink-0 items-center gap-2 border-b border-border px-3">
          <SidebarTrigger show={single ? "always" : "collapsed"} />
          <h2 className="truncate text-lg font-bold">Running missions</h2>
        </header>
        <div className="flex-1 p-4">
          <div className="flex h-full items-center justify-center rounded-md text-sm text-muted-foreground ring-1 ring-border ring-dashed">Your page</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Open: a site switcher, groups with names, a section with its pages (with a count), a count and a Beta tag. Collapse is
 * the quiet button at the end of the header, or the edge (hover it for the hairline); ⌘B / Ctrl+B toggles it.
 */
export const SidebarExpanded: S = { render: () => <Console shortcut /> }

/**
 * Collapsed to the rail: icons on one centre line, a line where each group's name was, a dot for the alarms' count, names
 * in tooltips. Expand is the top bar's first button, or the edge.
 */
export const SidebarCollapsed: S = { render: () => <Console open={false} /> }

/** One trigger in the top bar that collapses and expands (`show="always"`, the default): for a page without a header row in its sidebar. */
export const SidebarSingleTrigger: S = { render: () => <Console single shortcut /> }

/** On a phone the trigger opens the sidebar as a sheet from the left; following a link closes it. */
export const SidebarMobile: S = { render: () => <Console mobile /> }

/** The phone sheet, open: for the visual tests. */
export const SidebarMobileOpen: S = { render: () => <Console mobile openMobile /> }
