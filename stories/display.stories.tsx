import type { Meta, StoryObj } from "@storybook/react"
import { CircleAlert, Info, MapPinOff, TriangleAlert } from "lucide-react"
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

const meta: Meta = { title: "Display" }
export default meta
type S = StoryObj

export const BadgeTones: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="info">Patrolling</Badge>
      <Badge tone="success">Docked</Badge>
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
              <Badge tone={r.tone}>{r.s}</Badge>
            </TableCell>
            <TableCell className="text-right">{r.b}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
