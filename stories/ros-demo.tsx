"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { createRosConnection, type RosConnection } from "@/registry/syncrobotic/lib/ros"
import { RosProvider, useRosService } from "@/registry/syncrobotic/hooks/use-ros"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"
import { createMockRosbridge, type MockRosbridge } from "./ros-mock"
import { Arm, Drive, RosConnectionLine, SiteMap } from "./ros-example"

// The "Connect to ROS" page's example (ros-example.tsx), live: the same components, pointed at a rosbridge played in the
// browser (ros-mock.ts) instead of ws://robot.local:9090, plus a service call and a button that cuts the link.

function Extras({ onDrop }: { onDrop: () => void }) {
  const dock = useRosService<Record<string, never>, { success: boolean; message: string }>("/dock", "std_srvs/Trigger", { timeoutMs: 5000 })
  const [answer, setAnswer] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const send = () => {
    setBusy(true)
    dock({}).then(
      (r) => setAnswer(r.message),
      (e: unknown) => setAnswer(e instanceof Error ? e.message : "Docking failed"),
    ).finally(() => setBusy(false))
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={send} disabled={busy}>
          {busy && <Spinner className="size-4 text-info" delay={0} />}
          Dock
        </Button>
        <Button variant="outline" onClick={onDrop}>
          Drop the link
        </Button>
      </div>
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {answer}
      </p>
    </div>
  )
}

/** The whole page's example, live: map, scans and pose in, drive commands, a goal and a service call out, the arm's joints in. */
export function RosConsoleDemo({ className }: { className?: string }) {
  const [{ ros, bridge }] = React.useState<{ ros: RosConnection; bridge: MockRosbridge }>(() => {
    // The screenshot run (and anyone who asked for reduced motion) gets an arm that holds still and no connect delay.
    const still = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const mock = createMockRosbridge({ still, connectDelayMs: still ? 0 : 400 })
    return { bridge: mock, ros: createRosConnection({ url: "ws://robot.local:9090", WebSocket: mock.WebSocket, heartbeat: { intervalMs: 3000 } }) }
  })
  React.useEffect(() => {
    ros.connect()
    return () => ros.close()
  }, [ros])
  return (
    <RosProvider connection={ros}>
      <div className={cn("@container flex flex-col gap-4", className)}>
        <RosConnectionLine />
        <div className="grid gap-6 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SiteMap />
          <div className="flex flex-col gap-4">
            <Drive />
            <Extras onDrop={() => bridge.drop()} />
          </div>
        </div>
        <Arm />
      </div>
    </RosProvider>
  )
}
