import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bell, Bot, ChevronDown, Ellipsis, House, Settings } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/registry/syncrobotic/ui/dropdown-menu"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/syncrobotic/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from "@/registry/syncrobotic/ui/breadcrumb"
import { Pagination } from "@/registry/syncrobotic/ui/pagination"

const meta: Meta = { title: "Navigation" }
export default meta
type S = StoryObj

export const TabsDefault: S = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sensors">Sensors</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="admin" disabled>
          Admin
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-muted-foreground">
        Patrol dog 7F3A · firmware 2.4.1 · 412 h in service
      </TabsContent>
      <TabsContent value="sensors" className="text-sm text-muted-foreground">
        LiDAR, depth camera, thermal camera
      </TabsContent>
      <TabsContent value="logs" className="text-sm text-muted-foreground">
        No logs in the last 24 h
      </TabsContent>
    </Tabs>
  ),
}

export const AccordionDefault: S = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="stop">
      <AccordionItem value="stop">
        <AccordionTrigger>What does the emergency stop do?</AccordionTrigger>
        <AccordionContent>It cuts motor torque within 200 ms. The robot sits down and holds still until released.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="bt">
        <AccordionTrigger>What if Wi-Fi drops?</AccordionTrigger>
        <AccordionContent>The app falls back to Bluetooth. Stop and device status still work within about 10 m.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="release">
        <AccordionTrigger>Who can release a stop?</AccordionTrigger>
        <AccordionContent>Operators and admins. Viewers see the stop but cannot release it.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const TabsWithIconsAndCounts: S = {
  render: () => (
    <Tabs defaultValue="events">
      <TabsList>
        <TabsTrigger value="robots">
          <Bot aria-hidden="true" /> Robots
        </TabsTrigger>
        <TabsTrigger value="events">
          <Bell aria-hidden="true" /> Events <Badge tone="danger">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings aria-hidden="true" /> Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="robots" className="text-sm text-muted-foreground">
        12 robots on this site
      </TabsContent>
      <TabsContent value="events" className="text-sm text-muted-foreground">
        3 events need review
      </TabsContent>
      <TabsContent value="settings" className="text-sm text-muted-foreground">
        Site settings
      </TabsContent>
    </Tabs>
  ),
}

// Sticky: the row stays at the top while the long tab scrolls (here inside a box; in a shell, under its top bar at
// --shell-top). Scroll down, then pick Sensors: the page goes back to the start of the tabs.
export const TabsSticky: S = {
  render: () => (
    <div className="h-80 overflow-y-auto rounded-md bg-background px-4 ring-1 ring-border">
      <Tabs defaultValue="events">
        <TabsList sticky aria-label="Robot 7F3A">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <div className="flex flex-col text-sm">
            {Array.from({ length: 16 }, (_, i) => (
              <p key={i} className="flex min-h-(--h-row) items-center justify-between gap-3 border-b border-border last:border-b-0">
                <span>Patrol lap {16 - i} finished</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{`${String(21 - Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`}</span>
              </p>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="sensors" className="text-sm text-muted-foreground">
          LiDAR, 4 cameras, IMU
        </TabsContent>
        <TabsContent value="logs" className="text-sm text-muted-foreground">
          12 lines since 06:00
        </TabsContent>
      </Tabs>
    </div>
  ),
}

export const AccordionMultiple: S = {
  render: () => (
    <Accordion type="multiple" defaultValue={["night", "weekend"]}>
      <AccordionItem value="night">
        <AccordionTrigger>Night patrol · 22:00–06:00</AccordionTrigger>
        <AccordionContent>Perimeter every 2 h, 4 robots.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="weekend">
        <AccordionTrigger>Weekend patrol · all day</AccordionTrigger>
        <AccordionContent>Parking lot and warehouse, 2 robots.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="holiday" disabled>
        <AccordionTrigger>Holiday schedule · not set</AccordionTrigger>
        <AccordionContent>—</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const BreadcrumbDefault: S = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbLink href="#catalog">Catalog</BreadcrumbLink>
      <BreadcrumbLink href="#people">people</BreadcrumbLink>
      <BreadcrumbPage>night-parking@v3</BreadcrumbPage>
    </Breadcrumb>
  ),
}

function PaginationDemo({ pages = false, total = 48 }: { pages?: boolean; total?: number }) {
  const [page, setPage] = React.useState(0)
  return <Pagination page={page} pageSize={10} total={total} onPageChange={setPage} pages={pages} />
}

/** Range and previous / next: the default for tables. */
export const PaginationSimple: S = { render: () => <PaginationDemo /> }

// Pagination is a container: under 36rem its numbered pages fold to the current one. A wide box lets the numbered demos
// show their pages wherever the preview has the room; PaginationCompact shows the folded row on purpose.
const wide = "w-2xl max-w-full"

/** Numbered pages, with gaps, for long lists you jump around in. */
export const PaginationPages: S = {
  render: () => (
    <div className={wide}>
      <PaginationDemo pages total={240} />
    </div>
  ),
}

/** In a narrow space (a card, a sheet, a phone) the numbered pages fold to the current one between previous and next. */
export const PaginationCompact: S = {
  render: () => (
    <div className="w-72 max-w-full">
      <PaginationDemo pages total={240} />
    </div>
  ),
}

export const BreadcrumbWithIcon: S = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbLink href="#home" className="flex items-center gap-2">
        <House aria-hidden="true" className="size-4" />
        <span>Sites</span>
      </BreadcrumbLink>
      <BreadcrumbLink href="#taipei">Taipei warehouse</BreadcrumbLink>
      <BreadcrumbPage>Hall B</BreadcrumbPage>
    </Breadcrumb>
  ),
}

/** Deep paths fold the middle levels into a menu, keeping the first and the last two. */
export const BreadcrumbCollapsed: S = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbLink href="#sites">Sites</BreadcrumbLink>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="press flex size-(--h-sm) items-center justify-center rounded-sm hover:bg-muted hover:text-foreground"
          aria-label="Show 2 more levels"
        >
          <Ellipsis aria-hidden="true" className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem asChild>
            <a href="#taipei">Taipei warehouse</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="#hall-b">Hall B</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BreadcrumbLink href="#robots">Robots</BreadcrumbLink>
      <BreadcrumbPage>Patrol dog 7F3A</BreadcrumbPage>
    </Breadcrumb>
  ),
}

/** The current level switches between siblings, e.g. one robot to another. */
export const BreadcrumbWithSwitcher: S = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbLink href="#robots">Robots</BreadcrumbLink>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="press flex h-(--h-sm) items-center gap-2 rounded-sm px-2 text-foreground hover:bg-muted"
          aria-label="Patrol dog 7F3A, switch robot"
        >
          <span aria-current="page">Patrol dog 7F3A</span>
          <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {["Patrol dog 7F3A", "Patrol dog DAA6", "Courier 9E37"].map((r) => (
            <DropdownMenuItem key={r}>{r}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Breadcrumb>
  ),
}

/** In a narrow space each level truncates; the full name stays in the link. */
export const BreadcrumbTruncated: S = {
  render: () => (
    <div className="w-64">
      <Breadcrumb>
        <BreadcrumbLink href="#sites" title="Sites">
          Sites
        </BreadcrumbLink>
        <BreadcrumbLink href="#site" title="Taipei Neihu distribution warehouse">
          Taipei Neihu distribution warehouse
        </BreadcrumbLink>
        <BreadcrumbPage title="Night patrol, north perimeter">Night patrol, north perimeter</BreadcrumbPage>
      </Breadcrumb>
    </div>
  ),
}

function PaginationAt({ start = 0, ...props }: { start?: number } & Omit<React.ComponentProps<typeof Pagination>, "page" | "onPageChange">) {
  const [page, setPage] = React.useState(start)
  return <Pagination page={page} onPageChange={setPage} {...props} />
}

/** Everything fits on one page: both arrows are off, the range still says how many. */
export const PaginationSinglePage: S = { render: () => <PaginationAt pageSize={10} total={7} /> }

/** Nothing to page through. */
export const PaginationEmpty: S = { render: () => <PaginationAt pageSize={10} total={0} labels={{ empty: "No events" }} /> }

/** Deep in a long list: the first and last pages stay reachable, gaps fold the rest. */
export const PaginationMiddle: S = {
  render: () => (
    <div className={wide}>
      <PaginationAt pages pageSize={20} total={1240} start={30} />
    </div>
  ),
}

/** In a table footer, with the noun in the range. */
/** Link mode: every page is a URL (?page=3), so it can be shared, Back works, and it needs no JavaScript. */
export const PaginationLinks: S = {
  render: () => (
    <div className={wide}>
      <Pagination page={2} pageSize={20} total={240} pages href={(p) => `?page=${p + 1}`} onNavigate={() => {}} />
    </div>
  ),
}

export const PaginationTableFooter: S = {
  render: () => (
    <div className="flex flex-col rounded-lg ring-1 ring-border">
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">Table rows</div>
      <div className="border-t border-border px-3 py-2">
        <PaginationAt pageSize={25} total={312} start={2} labels={{ range: (f, t, n) => `Events ${f}–${t} of ${n}` }} />
      </div>
    </div>
  ),
}

/** Two levels only: the parent and this page. */
export const BreadcrumbTwoLevels: S = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbLink href="#robots">Robots</BreadcrumbLink>
      <BreadcrumbPage>Patrol dog 7F3A</BreadcrumbPage>
    </Breadcrumb>
  ),
}

/** Above a page title, with the page's actions on the right. */
export const BreadcrumbPageHeader: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Breadcrumb>
        <BreadcrumbLink href="#sites">Sites</BreadcrumbLink>
        <BreadcrumbLink href="#taipei">Taipei warehouse</BreadcrumbLink>
        <BreadcrumbPage>Maps</BreadcrumbPage>
      </Breadcrumb>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Maps</h2>
        <span className="text-sm text-muted-foreground">4 maps · updated 2 h ago</span>
      </div>
    </div>
  ),
}
