// @syncrobotic/robot-status-card v0.8.0 · update: npx shadcn add @syncrobotic/robot-status-card --overwrite
import * as React from "react"
import { Battery, BatteryCharging, MapPin, Navigation, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import type { Tone } from "@/registry/syncrobotic/shell/status-glyph"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { Progress } from "@/registry/syncrobotic/ui/progress"

export type RobotStatus = {
  name: string
  state: { tone: Tone; label: string }
  battery: number
  charging?: boolean
  online: boolean
  signal?: string
  location: string
  task?: { name: string; progress: number; eta: string }
}

export const sampleRobotStatus: RobotStatus = {
  name: "Patrol dog 7F3A",
  state: { tone: "info", label: "Patrolling" },
  battery: 72,
  online: true,
  signal: "Good",
  location: "North gate · 120 m from dock",
  task: { name: "Night patrol · Perimeter", progress: 64, eta: "14 min left" },
}

/**
 * One robot on a phone: state first, then the numbers that decide the next action, then the actions.
 * Pair it with the dock's emergency stop; this card never stops the robot itself.
 */
export function RobotStatusCard({
  robot = sampleRobotStatus,
  onOpenMap,
  onReturn,
  className,
}: {
  robot?: RobotStatus
  onOpenMap?: () => void
  onReturn?: () => void
  className?: string
}) {
  const low = robot.battery < 30
  const BatteryIcon = robot.charging ? BatteryCharging : Battery
  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-muted font-mono text-sm font-bold">{robot.name.slice(-4)}</span>
        <div className="flex min-w-0 flex-col">
          <StatusEyebrow tone={robot.state.tone}>{robot.state.label}</StatusEyebrow>
          <span className="truncate text-lg font-bold">{robot.name}</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col gap-1 rounded-sm bg-muted p-3">
          <dt className="text-xs text-muted-foreground">Battery</dt>
          <dd className={cn("flex items-center gap-2 font-medium", low && "text-warning")}>
            <BatteryIcon aria-hidden="true" className="size-4" />
            {robot.battery}%
          </dd>
        </div>
        <div className="flex flex-col gap-1 rounded-sm bg-muted p-3">
          <dt className="text-xs text-muted-foreground">Connection</dt>
          <dd className={cn("flex items-center gap-2 font-medium", !robot.online && "text-muted-foreground")}>
            {robot.online ? <Wifi aria-hidden="true" className="size-4" /> : <WifiOff aria-hidden="true" className="size-4" />}
            {robot.online ? (robot.signal ?? "Online") : "Offline"}
          </dd>
        </div>
      </dl>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin aria-hidden="true" className="size-4 shrink-0" />
        {robot.location}
      </p>

      {robot.task && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{robot.task.name}</span>
            <span className="text-muted-foreground">{robot.task.eta}</span>
          </div>
          <Progress value={robot.task.progress} aria-label={`${robot.task.name}, ${robot.task.progress}%`} />
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onReturn}>
          Return to dock
        </Button>
        <Button className="flex-1" onClick={onOpenMap}>
          <Navigation aria-hidden="true" /> Open map
        </Button>
      </div>
    </Card>
  )
}
