import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Battery, CircleAlert, Info, MapPinOff, RefreshCw, SearchX, TriangleAlert, Wifi } from "lucide-react"
import { InlineStatus } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StatusGlyph } from "@/registry/syncrobotic/shell/status-glyph"
import { Alert, AlertDescription, AlertTitle } from "@/registry/syncrobotic/ui/alert"
import { Avatar, AvatarFallback } from "@/registry/syncrobotic/ui/avatar"
import { Badge } from "@/registry/syncrobotic/ui/badge"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/syncrobotic/ui/card"
import { EmptyState } from "@/registry/syncrobotic/ui/empty-state"
import { Progress } from "@/registry/syncrobotic/ui/progress"
import { Separator } from "@/registry/syncrobotic/ui/separator"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/syncrobotic/ui/table"
import { CountBadge } from "@/registry/syncrobotic/ui/badge"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Meter } from "@/registry/syncrobotic/ui/meter"

const meta: Meta = { title: "Display" }
export default meta
type S = StoryObj

export const BadgeTones: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="info">Updating</Badge>
      <Badge tone="success">Passed</Badge>
      <Badge tone="warning">Low battery</Badge>
      <Badge tone="danger">3 events</Badge>
      <Badge>Offline</Badge>
      <Badge tone="outline">v2.4.1</Badge>
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
          <Badge tone="danger">2</Badge>
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

export const AvatarDefault: S = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>NS</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarFallback>7F</AvatarFallback>
      </Avatar>
      <div className="flex -space-x-2">
        {["AL", "BK", "CW"].map((i) => (
          <Avatar key={i} className="ring-2 ring-background">
            <AvatarFallback>{i}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  ),
}

export const AlertTones: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert tone="info">
        <Info aria-hidden="true" />
        <AlertTitle>Update available</AlertTitle>
        <AlertDescription>Firmware 2.5 installs while the robot is docked.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>License expires in 5 days</AlertTitle>
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
          <span className="text-muted-foreground">64%</span>
        </div>
        <Progress value={64} aria-label="Uploading video" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span>Battery</span>
          <span className="text-warning">18%</span>
        </div>
        <Progress value={18} tone="warning" aria-label="Battery" />
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

export const EmptyStateDefault: S = {
  render: () => (
    <Card>
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
          { id: "7F3A", tone: "info" as const, s: "Patrolling", b: 72 },
          { id: "2B10", tone: "success" as const, s: "Docked", b: 100 },
          { id: "9C44", tone: "warning" as const, s: "Low battery", b: 18 },
        ].map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.id}</TableCell>
            <TableCell>
              <InlineStatus tone={r.tone}>{r.s}</InlineStatus>
            </TableCell>
            <TableCell className="text-right">{r.b}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const BadgeWithStatusAndCount: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="info">
        <StatusGlyph tone="info" /> Patrolling
      </Badge>
      <Badge tone="warning">
        <Battery aria-hidden="true" /> 18%
      </Badge>
      <span className="inline-flex items-center gap-2 text-sm">
        Events <Badge tone="danger">12</Badge>
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
          { n: "Dock A", m: "2B10 charging · 64%", t: "success" as const, s: "In use" },
          { n: "Dock B", m: "Free", t: "neutral" as const, s: "Idle" },
          { n: "Dock C", m: "Power fault since 01:12", t: "danger" as const, s: "Fault" },
        ].map((d) => (
          <div key={d.n} className="flex min-h-(--h-row) items-center justify-between border-b border-border last:border-b-0">
            <span className="flex flex-col">
              <span className="text-sm font-medium">{d.n}</span>
              <span className="text-xs text-muted-foreground">{d.m}</span>
            </span>
            <InlineStatus tone={d.t}>{d.s}</InlineStatus>
          </div>
        ))}
      </CardContent>
    </Card>
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

export const AvatarSizesAndStatus: S = {
  render: () => (
    <div className="flex items-end gap-4">
      {[
        { c: "size-6 text-[10px]", i: "AL" },
        { c: "size-8", i: "BK" },
        { c: "size-12 text-sm", i: "CW" },
      ].map((a) => (
        <span key={a.i} className="relative">
          <Avatar className={a.c}>
            <AvatarFallback>{a.i}</AvatarFallback>
          </Avatar>
          <StatusGlyph tone="success" className="absolute -right-0.5 -bottom-0.5 rounded-full bg-background" />
        </span>
      ))}
      <span className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>NS</AvatarFallback>
        </Avatar>
        <span className="flex flex-col">
          <span className="text-sm font-medium">Night shift</span>
          <span className="text-xs text-muted-foreground">Operator · online</span>
        </span>
      </span>
    </div>
  ),
}

export const SeparatorInToolbar: S = {
  render: () => (
    <div className="flex h-(--h-md) items-center gap-3 rounded-md bg-card px-4 text-sm ring-1 ring-border">
      <span className="flex items-center gap-1">
        <Wifi aria-hidden="true" className="size-4" /> Good
      </span>
      <Separator orientation="vertical" className="h-5" />
      <span className="flex items-center gap-1">
        <Battery aria-hidden="true" className="size-4" /> 72%
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
        { n: "Map upload", v: 100, t: "success" as const, s: "Done" },
        { n: "Route check", v: 45, t: "info" as const, s: "45%" },
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
          <RefreshCw aria-hidden="true" /> Ping robot
        </Button>
      </AlertDescription>
    </Alert>
  ),
}

export const EmptyStateNoResults: S = {
  render: () => (
    <Card>
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
    <Card>
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
            <InlineStatus tone="warning">Door left open</InlineStatus>
          </TableCell>
          <TableCell className="text-right">7F3A</TableCell>
        </TableRow>
        <TableRow data-state="selected">
          <TableCell>01:52</TableCell>
          <TableCell>
            <InlineStatus tone="danger">Person detected</InlineStatus>
          </TableCell>
          <TableCell className="text-right">9C44</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

/** Normal is neutral; below `low` it turns warning, below `critical` danger, and the value is always written. */
export const MeterLevels: S = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Meter value={72} low={30} critical={15} label="Battery" />
      <Meter value={24} low={30} critical={15} label="Battery" />
      <Meter value={9} low={30} critical={15} label="Battery" />
      <Meter value={86} low={80} critical={95} higherIsWorse label="Storage" />
    </div>
  ),
}

/** One line for table cells: bar and value; the label is read, not shown. */
export const MeterInline: S = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Meter value={72} low={30} critical={15} label="Battery, Patrol dog 7F3A" inline />
      <Meter value={18} low={30} critical={15} label="Battery, Patrol dog 9C44" inline />
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
