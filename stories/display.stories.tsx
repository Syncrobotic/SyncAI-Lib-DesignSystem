import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Battery, Bot, CircleAlert, FilterX, Info, Lock, MapPinOff, RefreshCw, SearchX, TriangleAlert, Wifi, WifiOff } from "lucide-react"
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

export const BadgeOutline: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="outline">Firmware 4.8</Badge>
      <Badge tone="outline">Hall B</Badge>
      <Badge tone="outline">Night shift</Badge>
    </div>
  ),
}

export const BadgeWithIcon: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="warning">
        <TriangleAlert aria-hidden="true" /> Low battery
      </Badge>
      <Badge>
        <Wifi aria-hidden="true" /> Online
      </Badge>
      <Badge tone="danger">
        <CircleAlert aria-hidden="true" /> 2 faults
      </Badge>
    </div>
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

export const BadgeAsLink: S = {
  render: () => (
    <Badge asChild tone="outline" className="press hover:bg-accent">
      <a href="#tag-hall-b">Hall B</a>
    </Badge>
  ),
}

export const AvatarGroup: S = {
  render: () => (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2" aria-label="On shift: Mei Lin, Arjun Rao, Sara Kim and 2 more">
        {["ML", "AR", "SK"].map((i) => (
          <Avatar key={i} className="ring-2 ring-background">
            <AvatarFallback>{i}</AvatarFallback>
          </Avatar>
        ))}
        <Avatar className="ring-2 ring-background">
          <AvatarFallback>+2</AvatarFallback>
        </Avatar>
      </div>
      <span className="text-sm text-muted-foreground">5 on shift</span>
    </div>
  ),
}

export const AvatarWithName: S = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar className="size-10">
        <AvatarFallback>ML</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">Mei Lin</span>
        <span className="text-xs text-muted-foreground">Operator · night shift</span>
      </div>
    </div>
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
        <EmptyState icon={SearchX} title="Nothing scheduled" description="Missions you schedule for this site appear here." />
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
        { label: "Firmware update", value: 100, tone: "success" as const },
        { label: "Battery", value: 18, tone: "warning" as const },
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
      <Meter label="Motor temperature" value={48} max={90} low={60} critical={75} higherIsWorse unit=" °C" />
      <Meter label="Motor temperature" value={68} max={90} low={60} critical={75} higherIsWorse unit=" °C" />
      <Meter label="Motor temperature" value={81} max={90} low={60} critical={75} higherIsWorse unit=" °C" />
    </div>
  ),
}

export const MeterStorage: S = {
  render: () => <Meter label="Recording storage" value={412} max={512} low={0} critical={0} higherIsWorse unit=" GB" />,
}

export const MeterGrid: S = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Meter label="Battery" value={72} low={30} critical={15} />
      <Meter label="Signal" value={54} low={40} critical={20} />
      <Meter label="Storage used" value={81} low={80} critical={95} higherIsWorse />
      <Meter label="CPU" value={36} low={80} critical={95} higherIsWorse />
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
        { label: "State", value: <InlineStatus tone="warning">Needs attention</InlineStatus> },
        { label: "Licence", value: <Badge tone="outline">Pro</Badge> },
        { label: "Battery", value: "18 %" },
        { label: "Odometer", value: "1 284 km" },
      ]}
    />
  ),
}

export const StatusGlyphTones: S = {
  render: () => (
    <ul className="flex flex-col gap-2 text-sm">
      {(
        [
          ["info", "In progress"],
          ["success", "Normal"],
          ["warning", "Needs attention"],
          ["danger", "Stopped"],
          ["neutral", "Offline"],
        ] as const
      ).map(([t, l]) => (
        <li key={t} className="flex items-center gap-2">
          <StatusGlyph tone={t} /> {l}
        </li>
      ))}
    </ul>
  ),
}

export const StatusGlyphSizes: S = {
  render: () => (
    <div className="flex items-end gap-4">
      {(["size-3", "size-4", "size-5"] as const).map((s) => (
        <StatusGlyph key={s} tone="warning" className={s} />
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
          ["7F3A", "info", "Patrolling"],
          ["2B10", "success", "Docked"],
          ["9C44", "warning", "Needs attention"],
          ["4D21", "danger", "Stopped"],
          ["1A08", "neutral", "Offline"],
        ].map(([id, tone, label]) => (
          <TableRow key={id}>
            <TableCell className="font-medium">{id}</TableCell>
            <TableCell>
              <InlineStatus tone={tone as "info"}>{label}</InlineStatus>
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
    <Card>
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
    <Card>
      <EmptyState
        icon={FilterX}
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
    <Card>
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
    <Card>
      <EmptyState
        icon={WifiOff}
        title="You’re offline"
        description="Robots keep running their schedules. Live positions return when you reconnect."
        action={
          <Button variant="secondary">
            <RefreshCw aria-hidden="true" /> Retry
          </Button>
        }
      />
    </Card>
  ),
}

/** Inside a table or a small panel: no icon, less padding. */
export const EmptyStateCompact: S = {
  render: () => (
    <div className="rounded-md ring-1 ring-border">
      <div className="border-b border-border px-4 py-3 text-sm font-medium">Open alarms</div>
      <EmptyState className="py-6" title="No open alarms" description="New alarms show up here as they happen." />
    </div>
  ),
}
