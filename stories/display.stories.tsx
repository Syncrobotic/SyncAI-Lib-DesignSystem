import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Battery, Bell, Bot, CalendarDays, CircleAlert, Info, Lock, MapPinOff, Radar, RotateCw, SearchX, TriangleAlert, Wifi, WifiOff } from "lucide-react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarImage } from "@/registry/syncrobotic/ui/avatar"
import { Badge, ResultBadge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle } from "@/registry/syncrobotic/ui/card"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { IconTile } from "@/registry/syncrobotic/ui/icon-tile"
import { Progress } from "@/registry/syncrobotic/ui/progress"
import { Separator } from "@/registry/syncrobotic/ui/separator"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuMoreTrigger, DropdownMenuSeparator } from "@/registry/syncrobotic/ui/dropdown-menu"
import { Table, TableActionsCell, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { TextDiff } from "@/registry/syncrobotic/ui/text-diff"
import { Thumbnail } from "@/registry/syncrobotic/ui/thumbnail"
import { TierBadge, type Tier } from "@/registry/syncrobotic/ui/tier-badge"
import { cn } from "@/lib/utils"
import { placeholderPhoto } from "./placeholder-photos"

const meta: Meta = { title: "Display" }
export default meta
type S = StoryObj

/**
 * A badge labels something that does not change while you look at it: a release channel, a version, the environment, a
 * licence tier. Neutral grey, or an outline for the environment (a colour on every page all day stops meaning anything).
 */
export const BadgeAttributes: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Beta</Badge>
      <Badge tone="outline">v2.4.1</Badge>
      <Badge tone="outline">Production</Badge>
      <Badge>
        <span className="font-mono">T1</span>
      </Badge>
    </div>
  ),
}

export const CardDefault: S = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Night patrol</CardTitle>
        <CardDescription>Perimeter · every 2 h from 22:00</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last run</span>
          <span>02:00 · 41 min</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Events</span>
          <CountBadge count={2} />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="flex-1">
          Edit
        </Button>
        <Button className="flex-1">Run now</Button>
      </CardFooter>
    </Card>
  ),
}


export const AlertTones: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle>Update available</AlertTitle>
        <AlertDescription>Firmware 2.5 installs while the robot is docked.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>Licence expires in 5 days</AlertTitle>
        <AlertDescription>Patrols stop when it expires.</AlertDescription>
      </Alert>
      <Alert tone="danger">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>Map out of date</AlertTitle>
        <AlertDescription>Remap Gate B before the next patrol.</AlertDescription>
      </Alert>
    </div>
  ),
}

export const ProgressDefault: S = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span>Uploading video</span>
          <span className="text-muted-foreground tabular-nums">64 %</span>
        </div>
        <Progress value={64} aria-label="Uploading video" />
      </div>
      {/* Progress is for a process someone waits on. A level (battery, storage) is a Meter. */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span>Installing firmware 2.4.1</span>
          <span className="text-muted-foreground tabular-nums">18 %</span>
        </div>
        <Progress value={18} aria-label="Installing firmware 2.4.1" />
      </div>
    </div>
  ),
}

export const SpinnerDefault: S = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner delay={0} className="size-4" /> Connecting to 7F3A…
    </div>
  ),
}

// Every empty-state example at one width, the size of a panel, so the examples line up down the page.
const emptyWidth = "w-md max-w-full"

export const EmptyStateDefault: S = {
  render: () => (
    <Card className={emptyWidth}>
      <EmptyState
        icon={MapPinOff}
        title="No routes yet"
        description="Walk the robot along a path once to record your first route."
        action={<Button>Record a route</Button>}
      />
    </Card>
  ),
}

export const TableDefault: S = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Robot</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Battery</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { id: "7F3A", tone: "active" as const, s: "Patrolling", b: 72 },
          { id: "2B10", tone: "normal" as const, s: "Docked", b: 100 },
          { id: "9C44", tone: "warning" as const, s: "Low battery", b: 12 },
        ].map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.id}</TableCell>
            <TableCell>
              <InlineStatus status={r.tone}>{r.s}</InlineStatus>
            </TableCell>
            <TableCell className="text-right">{r.b} %</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

/** A row's actions: a ghost ⋯ in TableActionsCell, named after its row ("More actions for Patrol dog 7F3A"). */
export const TableRowActions: S = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Robot</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-0 pr-2 pl-0 sm:px-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { name: "Patrol dog 7F3A", tone: "active" as const, s: "Patrolling" },
          { name: "Patrol dog 2B10", tone: "normal" as const, s: "Docked" },
        ].map((r) => (
          <TableRow key={r.name}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell>
              <InlineStatus status={r.tone}>{r.s}</InlineStatus>
            </TableCell>
            <TableActionsCell>
              <DropdownMenu modal={false}>
                <DropdownMenuMoreTrigger name={r.name} size="icon-sm" />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Show on map</DropdownMenuItem>
                  <DropdownMenuItem>Rename</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive>Remove from fleet</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableActionsCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

/**
 * Beside a title: at most one status, as an InlineStatus (its shape and word, no box), then the badges, then a count as a
 * CountBadge. The badges never carry the state.
 */
export const BadgeWithStatusAndCount: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-lg font-bold">Patrol dog 7F3A</span>
      <InlineStatus status="active">Patrolling</InlineStatus>
      <Badge tone="outline">Production</Badge>
      <Badge>Beta</Badge>
      <span className="inline-flex items-center gap-2 text-sm">
        Events <CountBadge count={12} />
      </span>
    </div>
  ),
}

export const CardWithList: S = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Docks</CardTitle>
        <CardDescription>3 docks · 2 in use</CardDescription>
      </CardHeader>
      <CardContent className="gap-0">
        {[
          { n: "Dock A", m: "2B10 charging · 64 %", t: "normal" as const, s: "In use" },
          { n: "Dock B", m: "Free", t: "offline" as const, s: "Idle" },
          { n: "Dock C", m: "Power fault since 01:12", t: "danger" as const, s: "Fault" },
        ].map((d) => (
          <div key={d.n} className="flex min-h-(--h-row) items-center justify-between border-b border-border last:border-b-0">
            <span className="flex flex-col">
              <span className="text-sm font-medium">{d.n}</span>
              <span className="text-xs text-muted-foreground">{d.m}</span>
            </span>
            <InlineStatus status={d.t}>{d.s}</InlineStatus>
          </div>
        ))}
      </CardContent>
    </Card>
  ),
}

/** A cover picture (CardMedia), edge to edge at the top with the card's own corners, or `inset` at the image radius; the whole card is one link. */
export const CardWithMedia: S = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { id: "aisles", title: "Forklift aisles v3", meta: "12,480 images · T1", inset: false, seed: 1 },
        { id: "docks", title: "Dock cameras v2", meta: "8,200 images · T0", inset: true, seed: 4 },
      ].map((c) => (
        <Card key={c.id} className="group/card press relative hover:ring-muted-foreground has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
          <CardMedia inset={c.inset}>
            <img src={placeholderPhoto(c.seed, c.title)} alt="" />
          </CardMedia>
          <CardHeader>
            <CardTitle>
              {/* focus-ring: the card draws the ring (has-[a:focus-visible]), since the link covers it. */}
              <a href={`#datasets/${c.id}`} className="underline-offset-4 outline-none group-hover/card:underline after:absolute after:inset-0 after:rounded-[inherit]">
                {c.title}
              </a>
            </CardTitle>
            <CardDescription>{c.meta}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  ),
}

type Collection = { id: string; title: string; facts: string[]; tier: Tier; covers: number[]; reason?: string }

const collections: Collection[] = [
  { id: "aisles", title: "Warehouse aisles", facts: ["12,400 items", "Updated 3 d ago"], tier: "T1", covers: [1, 2, 3, 5] },
  { id: "hall-b", title: "Hall B people", facts: ["3,912 items", "Updated today"], tier: "T2", covers: [], reason: "Restricted · faces" },
  { id: "docks", title: "Dock cameras v2", facts: ["8,200 items", "Updated 2 w ago"], tier: "T0", covers: [4] },
  { id: "night", title: "Night patrol, Hall A and the loading yard", facts: ["1,104 items", "Updated 5 d ago"], tier: "T0", covers: [6, 7] },
]

/**
 * A media card: a pattern, not a component. CardMedia holds one cover or a mosaic of up to four Thumbnails (filling it),
 * then the title as the card's one link (metric-card's stretched link, underlined while the card is hovered), one or two facts and a tier badge. A restricted
 * collection shows Thumbnail's restricted placeholder and fetches nothing. Grid columns as many as fit at 16 rem.
 */
function MediaCard({ c }: { c: Collection }) {
  const mosaic = c.covers.length > 1
  return (
    <Card className="group/card press relative hover:ring-muted-foreground has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <CardMedia className={cn(mosaic && "grid grid-cols-2 gap-0.5")}>
        {c.reason ? (
          <Thumbnail restricted reason={c.reason} className="flex size-full rounded-none" />
        ) : (
          c.covers.slice(0, 4).map((seed, i) => (
            // Two pictures fill a column each; three take one tall picture and two small; four a 2 × 2 mosaic.
            <Thumbnail
              key={seed}
              src={placeholderPhoto(seed, `${c.id}-${i + 1}`)}
              alt=""
              className={cn("flex size-full rounded-none", mosaic && c.covers.length < 4 && i === 0 && "row-span-2", c.covers.length === 2 && "row-span-2")}
            />
          ))
        )}
      </CardMedia>
      <CardHeader className="min-w-0">
        <CardTitle className="truncate">
          {/* focus-ring: the card draws the ring (has-[a:focus-visible]), since the link covers it. */}
          <a href={`#collections/${c.id}`} className="underline-offset-4 outline-none group-hover/card:underline after:absolute after:inset-0 after:rounded-[inherit]">
            {c.title}
          </a>
        </CardTitle>
        <CardDescription className="tabular-nums">{c.facts.join(" · ")}</CardDescription>
      </CardHeader>
      <div>
        <TierBadge tier={c.tier} />
      </div>
    </Card>
  )
}

/** Media cards in a responsive grid: one link per card (the title), a cover or a mosaic, a restricted collection's placeholder. */
export const CardMediaGallery: S = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
      {collections.map((c) => (
        <MediaCard key={c.id} c={c} />
      ))}
    </div>
  ),
}

export const CardStat: S = {
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <Card className="gap-1">
        <span className="text-sm text-muted-foreground">Distance today</span>
        <span className="text-3xl font-bold">
          12.4 <span className="text-sm font-normal text-muted-foreground">km</span>
        </span>
      </Card>
      <Card className="gap-1">
        <span className="text-sm text-muted-foreground">Uptime</span>
        <span className="text-3xl font-bold">
          99.2 <span className="text-sm font-normal text-muted-foreground">%</span>
        </span>
      </Card>
    </div>
  ),
}


export const SeparatorInToolbar: S = {
  render: () => (
    <div className="flex h-(--h-md) w-fit items-center gap-3 rounded-md bg-card px-4 text-sm ring-1 ring-border">
      <span className="flex items-center gap-2">
        <Wifi aria-hidden="true" className="size-4" /> Good
      </span>
      <Separator orientation="vertical" className="h-5" />
      <span className="flex items-center gap-2">
        <Battery aria-hidden="true" className="size-4" /> 72 %
      </span>
      <Separator orientation="vertical" className="h-5" />
      <span className="text-muted-foreground">Firmware 2.4.1</span>
    </div>
  ),
}

export const ProgressSteps: S = {
  render: () => (
    <div className="flex flex-col gap-3 text-sm">
      {[
        { n: "Map upload", v: 100, t: "neutral" as const, s: "Done" },
        { n: "Route check", v: 45, t: "info" as const, s: "45 %" },
        { n: "Firmware", v: 0, t: "neutral" as const, s: "Waiting" },
      ].map((x) => (
        <div key={x.n} className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>{x.n}</span>
            <span className="text-muted-foreground">{x.s}</span>
          </div>
          <Progress value={x.v} tone={x.t} aria-label={x.n} />
        </div>
      ))}
    </div>
  ),
}

export const SpinnerInButtonAndPanel: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button loading>Syncing map</Button>
      <Card className="h-32 items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner delay={0} className="size-4" /> Loading camera feed…
        </span>
      </Card>
    </div>
  ),
}

export const AlertWithAction: S = {
  render: () => (
    <Alert tone="warning">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>2B10 has not reported for 5 minutes</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        Last seen at the north gate. It may be out of Wi-Fi range.
        <Button size="sm" variant="secondary">
          <RotateCw aria-hidden="true" /> Ping robot
        </Button>
      </AlertDescription>
    </Alert>
  ),
}

export const EmptyStateNoResults: S = {
  render: () => (
    <Card className={emptyWidth}>
      <EmptyState
        icon={SearchX}
        title="No events match “gate b”"
        description="Try a shorter search or a wider date range."
        action={<Button variant="secondary">Clear search</Button>}
      />
    </Card>
  ),
}

export const EmptyStateError: S = {
  render: () => (
    <Card className={emptyWidth}>
      <EmptyState
        icon={CircleAlert}
        title="Could not load events"
        description="The server did not answer. Your robots keep patrolling."
        action={<Button>Try again</Button>}
      />
    </Card>
  ),
}

export const TableWithStatusAndSelectedRow: S = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Event</TableHead>
          <TableHead className="text-right">Robot</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>02:14</TableCell>
          <TableCell>
            <InlineStatus status="warning">Door left open</InlineStatus>
          </TableCell>
          <TableCell className="text-right">7F3A</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell>01:52</TableCell>
          <TableCell>
            <InlineStatus status="danger">Person detected</InlineStatus>
          </TableCell>
          <TableCell className="text-right">9C44</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

/**
 * Normal is neutral; past `low` it turns warning, past `critical` danger, and the value is always written. A low battery
 * needs attention, never danger, so battery takes only `low`; danger is for a level that breaks something, like full storage.
 */
export const MeterLevels: S = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Meter value={72} low={15} label="Battery" />
      <Meter value={9} low={15} label="Battery" />
      <Meter value={86} low={80} critical={95} higherIsWorse label="Storage" />
      <Meter value={97} low={80} critical={95} higherIsWorse label="Storage" />
    </div>
  ),
}

/** One line for table cells: bar and value; the label is read, not shown. */
export const MeterInline: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Meter value={72} low={15} label="Battery, Patrol dog 7F3A" inline />
      <Meter value={12} low={15} label="Battery, Patrol dog 9C44" inline />
    </div>
  ),
}

export const DescriptionListPlain: S = {
  render: () => (
    <DescriptionList
      items={[
        { label: "Site", value: "North gate" },
        { label: "Firmware", value: "2.4.0" },
        { label: "Last seen", value: "now" },
      ]}
    />
  ),
}

/** The few numbers that matter most, each in its own tile. */
export const DescriptionListTiles: S = {
  render: () => (
    <DescriptionList
      variant="tiles"
      columns={2}
      items={[
        { label: "Patrols today", value: "14" },
        { label: "Distance", value: "41 km" },
        { label: "Events", value: "3" },
        { label: "Uptime", value: "99.2 %" },
      ]}
    />
  ),
}

/** Danger tint when the count needs attention, neutral otherwise; 99+ past the maximum. */
export const BadgeCount: S = {
  render: () => (
    <div className="flex flex-col gap-3 text-sm">
      <span className="flex items-center gap-2">
        Alarms <CountBadge count={2} />
      </span>
      <span className="flex items-center gap-2">
        Unread messages <CountBadge count={7} tone="neutral" />
      </span>
      <span className="flex items-center gap-2">
        Events <CountBadge count={240} />
      </span>
    </div>
  ),
}

const fleet = [
  { name: "Patrol dog 7F3A", battery: 72 },
  { name: "Patrol dog 9C44", battery: 18 },
  { name: "Patrol dog 2B10", battery: 100 },
]

/** Sortable columns: the label is a button, the header announces its order, an arrow shows it. */
export const TableSortable: S = {
  render: function Render() {
    const [sort, setSort] = React.useState<{ key: "name" | "battery"; dir: "asc" | "desc" }>({ key: "name", dir: "asc" })
    const rows = [...fleet].sort((a, b) => (sort.key === "name" ? a.name.localeCompare(b.name) : a.battery - b.battery) * (sort.dir === "asc" ? 1 : -1))
    const head = (key: "name" | "battery") => ({
      sort: sort.key === key ? sort.dir : (false as const),
      onSort: () => setSort({ key, dir: sort.key === key && sort.dir === "asc" ? "desc" : "asc" }),
    })
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead {...head("name")}>Robot</TableHead>
            <TableHead {...head("battery")} className="text-right">
              Battery
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-right tabular-nums">{r.battery} %</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  },
}

export const BadgeOutline: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="outline">Firmware 4.8</Badge>
      <Badge tone="outline">Hall B</Badge>
      <Badge tone="outline">Night shift</Badge>
    </div>
  ),
}

/** An icon says what kind of label it is, 4 px from the word inside the 24 px badge. Still a category, still grey. */
export const BadgeWithIcon: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>
        <Lock aria-hidden="true" /> Internal only
      </Badge>
      <Badge tone="outline">
        <Bot aria-hidden="true" /> Simulation
      </Badge>
      <Badge>
        <CalendarDays aria-hidden="true" /> Night shift
      </Badge>
    </div>
  ),
}

/**
 * Do: a state as an InlineStatus, colour only when it needs someone, and the fixed attributes as grey badges. Don't: a
 * state in a tinted badge. A box with a colour on every state reads as an alarm, and the state changes under its label.
 */
export const BadgeDoAndDont: S = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <figure className="flex flex-col gap-3 rounded-md p-4 ring-1 ring-border">
        <figcaption className="text-sm font-medium">Do</figcaption>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <InlineStatus status="offline">Offline</InlineStatus>
          <InlineStatus status="warning">Low battery</InlineStatus>
          <Badge tone="outline">Production</Badge>
          <Badge>Beta</Badge>
        </div>
      </figure>
      <figure className="flex flex-col gap-3 rounded-md p-4 ring-1 ring-border">
        <figcaption className="text-sm font-medium text-danger">Don't</figcaption>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">Updating</Badge>
          <Badge tone="warning">Low battery</Badge>
          <Badge>Offline</Badge>
          <Badge tone="danger">Production</Badge>
        </div>
      </figure>
    </div>
  ),
}

/**
 * Test and audit results: a pass is calm grey with a check, a failure is a danger outline with danger text, and too few
 * samples to judge is a grey outline with a dashed circle. Each has its own icon and edge, so none relies on colour.
 */
export const BadgeTestResults: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ResultBadge result="passed" />
      <ResultBadge result="failed" />
      <ResultBadge result="insufficient" />
    </div>
  ),
}

/** An evaluation of a fine-tuned model, one row per check. The score says why; the badge says what it means. */
export const BadgeTestResultsInTable: S = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Check</TableHead>
          <TableHead>Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(
          [
            ["Caption accuracy", "0.91", 400, "pass"],
            ["Counting objects", "0.62", 250, "fail"],
            ["Night images", "0.88", 12, "few"],
            ["Safety refusals", "0.99", 300, "pass"],
          ] as const
        ).map(([check, score, n, result]) => (
          <TableRow key={check}>
            <TableCell>
              <span className="flex flex-col">
                <span className="font-medium">{check}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {score} · n = {n}
                </span>
              </span>
            </TableCell>
            <TableCell>
              <ResultBadge result={result === "pass" ? "passed" : result === "fail" ? "failed" : "insufficient"} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const BadgeInHeading: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        North gate patrol <Badge tone="outline">Draft</Badge>
      </h3>
      <h3 className="flex items-center gap-2 text-lg font-bold">
        Site map <Badge>v12 · live</Badge>
      </h3>
    </div>
  ),
}

// The badge is 24 px, too small to tap: the link around it is the target, the control height (36, 44 on touch, 48 in
// gloves), and the badge inside answers its hover and press.
export const BadgeAsLink: S = {
  render: () => (
    <a href="#tag-hall-b" className="group/badge press inline-flex min-h-(--h-sm) items-center rounded-xs">
      <Badge tone="outline" className="group-hover/badge:bg-accent">
        Hall B
      </Badge>
    </a>
  ),
}



export const CardWithAction: S = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Lidar cleaning due</CardTitle>
        <CardDescription>Courier 2B19 · every 200 h, last 212 h ago</CardDescription>
      </CardHeader>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm">
          Snooze
        </Button>
        <Button size="sm">Schedule</Button>
      </CardFooter>
    </Card>
  ),
}

export const CardInteractive: S = {
  render: () => (
    <a
      href="#site-hall-b"
      className="press group block rounded-md transition-colors duration-(--motion-fast) ease-(--ease-standard) [&>[data-slot=card]]:hover:ring-muted-foreground"
    >
      <Card>
        <CardHeader>
          <CardTitle>Hall B</CardTitle>
          <CardDescription>6 robots · 2 patrolling · 1 needs attention</CardDescription>
        </CardHeader>
      </Card>
    </a>
  ),
}

export const CardEmpty: S = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled missions</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Missions you schedule for this site appear here." />
      </CardContent>
    </Card>
  ),
}

// A card right under the page's h1 is an h2, so the outline skips no level. The size does not change with the level.
export const CardHeadingLevel: S = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Storage</CardTitle>
        <CardDescription>Right under the page title, so its title is an h2</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Recordings</span>
          <span className="tabular-nums">412 GB of 1 TB</span>
        </div>
      </CardContent>
    </Card>
  ),
}

export const SeparatorVertical: S = {
  render: () => (
    <div className="flex h-6 items-center gap-3 text-sm">
      <span>Hall B</span>
      <Separator orientation="vertical" />
      <span className="text-muted-foreground">6 robots</span>
      <Separator orientation="vertical" />
      <span className="text-muted-foreground">Floor 2</span>
    </div>
  ),
}

export const SeparatorWithLabel: S = {
  render: () => (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      Yesterday
      <Separator className="flex-1" />
    </div>
  ),
}

export const ProgressTones: S = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm">
      {[
        { label: "Map upload", value: 40, tone: "info" as const },
        { label: "Firmware update", value: 100, tone: "neutral" as const },
      ].map((p) => (
        <div key={p.label} className="flex flex-col gap-2">
          <span className="flex justify-between">
            {p.label}
            <span className="text-muted-foreground tabular-nums">{p.value} %</span>
          </span>
          <Progress value={p.value} tone={p.tone} aria-label={p.label} />
        </div>
      ))}
    </div>
  ),
}

export const ProgressInCard: S = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Inventory scan</CardTitle>
        <CardDescription>Aisle 14 of 24 · about 6 min left</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={58} aria-label="Inventory scan" />
      </CardContent>
    </Card>
  ),
}

export const SpinnerInline: S = {
  render: () => (
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner delay={0} className="size-4" label="Syncing" />
      Syncing route to 4 robots…
    </p>
  ),
}

export const SpinnerSizes: S = {
  render: () => (
    <div className="flex items-end gap-4">
      <Spinner delay={0} className="size-4" />
      <Spinner delay={0} className="size-5" />
      <Spinner delay={0} className="size-6" />
    </div>
  ),
}

export const MeterHigherIsWorse: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Meter label="Motor temperature" value={48} max={90} low={60} critical={75} higherIsWorse unit="°C" />
      <Meter label="Motor temperature" value={68} max={90} low={60} critical={75} higherIsWorse unit="°C" />
      <Meter label="Motor temperature" value={81} max={90} low={60} critical={75} higherIsWorse unit="°C" />
    </div>
  ),
}

export const MeterStorage: S = {
  // Storage warns when 90 % full and is critical at 95 %; showMax writes the total beside what is used.
  render: () => <Meter label="Recording storage" value={412} max={512} low={461} critical={486} higherIsWorse unit="GB" showMax />,
}

export const MeterGrid: S = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Meter label="Battery" value={72} low={15} />
      <Meter label="Signal" value={54} low={40} critical={20} />
      <Meter label="Storage used" value={81} low={80} critical={95} higherIsWorse />
      <Meter label="CPU" value={36} low={80} critical={95} higherIsWorse />
    </div>
  ),
}

export const MeterThresholds: S = {
  // A tick at low and at critical shows how close the level is before it crosses; colour still means crossed.
  render: () => (
    <div className="flex flex-col gap-4">
      <Meter label="Storage used" value={78} low={80} critical={95} higherIsWorse showThresholds />
      <Meter label="Storage used" value={88} low={80} critical={95} higherIsWorse showThresholds />
      <Meter label="Battery" value={72} low={15} showThresholds />
      <Meter label="Battery, Patrol dog 7F3A" value={72} low={15} showThresholds inline />
    </div>
  ),
}

export const MeterFormatted: S = {
  // Counts in the hundreds of thousands: locale writes the separators, format can shorten them.
  render: () => (
    <div className="flex flex-col gap-4">
      <Meter label="Labelled images" value={412345} max={1000000} low={900000} higherIsWorse unit="items" showMax locale="en-US" />
      <Meter label="Labelled images" value={412345} max={1000000} low={900000} higherIsWorse unit="items" showMax locale="en-US" format={{ notation: "compact" }} />
    </div>
  ),
}

export const DescriptionListTwoColumns: S = {
  render: () => (
    <DescriptionList
      columns={2}
      items={[
        { label: "Robot", value: "Patrol dog 7F3A" },
        { label: "Firmware", value: "4.8.0" },
        { label: "Site", value: "North gate" },
        { label: "Last contact", value: "14:02:31" },
      ]}
    />
  ),
}

export const DescriptionListWithStatus: S = {
  render: () => (
    <DescriptionList
      columns={2}
      items={[
        { label: "State", value: <InlineStatus status="warning">Needs attention</InlineStatus> },
        { label: "Licence", value: <Badge tone="outline">Pro</Badge> },
        { label: "Battery", value: "12 %" },
        { label: "Odometer", value: "1,284 km" },
      ]}
    />
  ),
}

export const StatusGlyphTones: S = {
  render: () => (
    <ul className="flex flex-col gap-2 text-sm">
      {(
        [
          ["active", "Busy"],
          ["normal", "Normal"],
          ["warning", "Needs attention"],
          ["danger", "Stopped"],
          ["offline", "Offline"],
        ] as const
      ).map(([t, l]) => (
        <li key={t} className="flex items-center gap-2">
          <StatusGlyph status={t} /> {l}
        </li>
      ))}
    </ul>
  ),
}

export const StatusGlyphSizes: S = {
  render: () => (
    <div className="flex items-end gap-4">
      {(["size-3", "size-4", "size-5"] as const).map((s) => (
        <StatusGlyph key={s} status="warning" className={s} />
      ))}
    </div>
  ),
}

export const StatusGlyphInTable: S = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Robot</TableHead>
          <TableHead>State</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          ["7F3A", "active", "Patrolling"],
          ["2B10", "normal", "Docked"],
          ["9C44", "warning", "Needs attention"],
          ["4D21", "danger", "Stopped"],
          ["1A08", "offline", "Offline"],
        ].map(([id, status, label]) => (
          <TableRow key={id}>
            <TableCell className="font-medium">{id}</TableCell>
            <TableCell>
              <InlineStatus status={status as "active"}>{label}</InlineStatus>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

/** First run: the main action, and a second way in for people who already have data. */
export const EmptyStateFirstRun: S = {
  render: () => (
    <Card className={emptyWidth}>
      <EmptyState
        icon={Bot}
        title="Add your first robot"
        description="Pair a robot over Wi-Fi, or import a fleet from a CSV file."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button>Pair a robot</Button>
            <Button variant="outline">Import CSV</Button>
          </div>
        }
      />
    </Card>
  ),
}

/** Filters hide everything: say how many are hidden and offer to clear them. */
export const EmptyStateFiltered: S = {
  render: () => (
    <Card className={emptyWidth}>
      <EmptyState
        icon={SearchX}
        title="No robots match these filters"
        description="12 robots are hidden by Site: Hall B and Status: Offline."
        action={<Button variant="secondary">Clear filters</Button>}
      />
    </Card>
  ),
}

/** No access: who can give it, not a dead end. */
export const EmptyStateNoPermission: S = {
  render: () => (
    <Card className={emptyWidth}>
      <EmptyState
        icon={Lock}
        title="You can’t see camera clips"
        description="Ask a site admin for the Viewer role on Taipei warehouse."
        action={<Button variant="outline">Request access</Button>}
      />
    </Card>
  ),
}

/** Offline: what still works, and a retry. */
export const EmptyStateOffline: S = {
  render: () => (
    <Card className={emptyWidth}>
      <EmptyState
        icon={WifiOff}
        title="You’re offline"
        description="Robots keep running their schedules. Live positions return when you reconnect."
        action={
          <Button variant="secondary">
            <RotateCw aria-hidden="true" /> Retry
          </Button>
        }
      />
    </Card>
  ),
}

/** Inside a table, a list or a small panel: `size="inline"`, a bare icon and 14 px words. */
export const EmptyStateCompact: S = {
  render: () => (
    <div className={`${emptyWidth} rounded-md bg-card ring-1 ring-border`}>
      <div className="border-b border-border px-4 py-3 text-sm font-medium">Open alarms</div>
      <EmptyState size="inline" icon={Bell} title="No open alarms" description="New alarms show up here as they happen." />
    </div>
  ),
}

/** Over a canvas or a picture: `variant="overlay"`, placed by the viewport's overlay layer; the canvas still pans under it. */
export const EmptyStateOverlay: S = {
  render: () => (
    <div className={`${emptyWidth} relative h-64 overflow-hidden rounded-md bg-card ring-1 ring-border`}>
      <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
        <EmptyState variant="overlay" icon={Radar} title="No scan yet" description="Points appear when the lidar sends its first scan." />
      </div>
    </div>
  ),
}

export const AvatarDefault: S = {
  render: () => (
    <div className="flex items-end gap-3">
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarFallback>ML</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
}

export const AvatarPeopleAndRobots: S = {
  render: () => (
    <ul className="flex flex-col gap-3">
      <li className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>ML</AvatarFallback>
        </Avatar>
        <span className="flex flex-col">
          <span className="text-sm font-medium">Mei Lin</span>
          <span className="text-xs text-muted-foreground">Operator</span>
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Avatar size="lg" shape="square">
          <AvatarFallback>
            <Bot aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <span className="flex flex-col">
          <span className="text-sm font-medium">Patrol dog 7F3A</span>
          <span className="text-xs text-muted-foreground">Robot · Hall B</span>
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Avatar size="lg" shape="square">
          <AvatarFallback>NS</AvatarFallback>
        </Avatar>
        <span className="flex flex-col">
          <span className="text-sm font-medium">North site</span>
          <span className="text-xs text-muted-foreground">Site · 14 robots</span>
        </span>
      </li>
    </ul>
  ),
}

/** A robot without a picture: its short ID in mono on a square avatar, with the corner of the icon tile beside it. */
export const AvatarRobotId: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["md", "lg", "xl"] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          <Avatar size={size} shape="square">
            <AvatarFallback className="font-mono">{size === "md" ? "PD" : "7F3A"}</AvatarFallback>
          </Avatar>
          <IconTile variant="muted" size={size === "md" ? "sm" : size === "lg" ? "md" : "lg"}>
            <Bot aria-hidden="true" />
          </IconTile>
        </div>
      ))}
    </div>
  ),
}

export const AvatarStatus: S = {
  render: () => (
    <ul className="flex flex-col gap-3">
      {(
        [
          { i: "ML", name: "Mei Lin", status: "active", word: "On shift" },
          { i: "AR", name: "Arjun Rao", status: "normal", word: "Away" },
          { i: "SK", name: "Sara Kim", status: "warning", word: "Shift ends in 10 min" },
          { i: "TW", name: "Tom Wu", status: "offline", word: "Off shift" },
        ] as const
      ).map((p) => (
        <li key={p.i} className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{p.i}</AvatarFallback>
            <AvatarBadge status={p.status} />
          </Avatar>
          <span className="flex flex-col">
            <span className="text-sm font-medium">{p.name}</span>
            <span className="text-xs text-muted-foreground">{p.word}</span>
          </span>
        </li>
      ))}
    </ul>
  ),
}

export const AvatarCount: S = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="lg" shape="square" aria-label="Patrol dog 7F3A, 3 open alarms">
        <AvatarFallback>
          <Bot aria-hidden="true" />
        </AvatarFallback>
        <AvatarBadge aria-hidden="true" className="bg-danger-subtle text-danger">
          3
        </AvatarBadge>
      </Avatar>
      <span className="flex flex-col">
        <span className="text-sm font-medium">Patrol dog 7F3A</span>
        <span className="text-xs text-danger">3 open alarms</span>
      </span>
    </div>
  ),
}

export const AvatarGroupOverflow: S = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AvatarGroup max={3} label="On shift: Mei Lin, Arjun Rao, Sara Kim, Tom Wu and Lea Park">
          {["ML", "AR", "SK", "TW", "LP"].map((i) => (
            <Avatar key={i}>
              <AvatarFallback>{i}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">5 on shift</span>
      </div>
      <div className="flex items-center gap-3">
        <AvatarGroup max={4} label="Robots on this route: 7F3A, 2B19, 4C02, 9C44, 8F15 and 3 more">
          {["7F", "2B", "4C", "9C", "8F", "1A", "5D", "6E"].map((i) => (
            <Avatar key={i} size="sm" shape="square">
              <AvatarFallback>{i}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">8 robots on this route</span>
      </div>
    </div>
  ),
}

export const AvatarImageFallback: S = {
  render: () => (
    <div className="flex items-center gap-3">
      {/* The picture does not load, so the initials show: never an empty circle. */}
      <Avatar size="lg">
        <AvatarImage src="/avatars/missing.png" alt="" />
        <AvatarFallback>ML</AvatarFallback>
      </Avatar>
      <span className="flex flex-col">
        <span className="text-sm font-medium">Mei Lin</span>
        <span className="text-xs text-muted-foreground">Picture not available: initials instead</span>
      </span>
    </div>
  ),
}

/** A base model's caption against the fine-tuned one: inserted words are a grey block with an underline, removed ones struck through. */
export const TextDiffCaption: S = {
  render: () => (
    <TextDiff
      before="A forklift carries two pallets across the warehouse floor."
      after="A yellow forklift carries three pallets past the loading dock."
    />
  ),
}

/** The same pair side by side: the base model's text with its removals on the left, the fine-tuned text with its insertions on the right. */
export const TextDiffSideBySide: S = {
  render: () => (
    <TextDiff
      mode="side-by-side"
      beforeLabel="Base model"
      afterLabel="Fine-tuned"
      before="A forklift carries two pallets across the warehouse floor."
      after="A yellow forklift carries three pallets past the loading dock."
    />
  ),
}

export const TextDiffLongParagraph: S = {
  render: () => (
    <TextDiff
      before="The image shows an indoor warehouse aisle with tall metal shelves on both sides. A worker in a dark jacket walks towards the camera while a small robot waits near the left shelf. Boxes are stacked on the lower shelves and the floor is clear of obstacles. The lighting is bright and even."
      after="The image shows an indoor warehouse aisle with tall metal shelves on both sides. A worker in a high-visibility vest walks away from the camera while a delivery robot waits near the left shelf. Boxes are stacked on the lower shelves and one box lies on the floor in the robot's path. The lighting is bright and even."
    />
  ),
}

export const TextDiffNoChange: S = {
  render: () => <TextDiff before="Two people stand next to a charging dock." after="Two people stand next to a charging dock." />,
}

export const TextDiffAllDifferent: S = {
  render: () => <TextDiff before="A cat sleeps on a sofa." after="Empty parking lot at night, three cars." />,
}
