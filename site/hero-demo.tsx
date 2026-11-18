"use client"

import * as React from "react"
import { Dock } from "@/registry/syncrobotic/shell/dock"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { StopButton } from "@/registry/syncrobotic/shell/stop-button"
import { SlideToRelease } from "@/registry/syncrobotic/shell/slide-to-release"

type Phase = "moving" | "sending" | "stopped"

/**
 * The home page's exhibit: the robot shell itself, working. One touch stops the robot (the command is sent, then
 * confirmed), and release takes a deliberate slide. Nothing is mocked up: these are the registry's components.
 */
export function HeroDemo() {
  const [phase, setPhase] = React.useState<Phase>("moving")
  const timer = React.useRef<number>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const stop = () => {
    setPhase("sending")
    // The robot confirms; the shell waits for it rather than pretending.
    timer.current = window.setTimeout(() => setPhase("stopped"), 700)
  }

  const moving = phase !== "stopped"
  return (
    <figure className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-4 rounded-xl bg-background p-4 ring-1 ring-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <StatusEyebrow tone={moving ? "info" : "neutral"}>{moving ? "Patrolling" : "Stopped by you"}</StatusEyebrow>
            <span className="text-lg font-bold">Patrol dog 7F3A</span>
          </div>
          <span className="text-sm text-muted-foreground">North gate</span>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col gap-1 rounded-sm bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Speed</dt>
            <dd className="font-medium tabular-nums">{moving ? "1.2 m/s" : "0 m/s"}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-sm bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Battery</dt>
            <dd className="font-medium tabular-nums">72 %</dd>
          </div>
        </dl>
        <Dock
          className="static"
          state={
            phase === "stopped" ? (
              <SlideToRelease tag="7F3A" onRelease={() => (timer.current = window.setTimeout(() => setPhase("moving"), 500))} />
            ) : (
              <StopButton tag="7F3A" state={phase === "sending" ? "sending" : "ready"} onStop={stop} />
            )
          }
        />
      </div>
      <figcaption className="text-sm text-muted-foreground">
        Live components, not a picture. Press stop; then slide to release, the way an operator does with one thumb.
      </figcaption>
    </figure>
  )
}
