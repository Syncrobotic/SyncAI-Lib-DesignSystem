// @syncrobotic/sheet-robot-detail v0.10.0 · update: npx shadcn add @syncrobotic/sheet-robot-detail --overwrite
"use client"

import * as React from "react"
import { Camera, HousePlug } from "lucide-react"
import { StatusEyebrow } from "@/registry/syncrobotic/shell/status-eyebrow"
import { Button } from "@/registry/syncrobotic/ui/button"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Meter } from "@/registry/syncrobotic/ui/meter"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/syncrobotic/ui/sheet"
import { Timeline, TimelineItem } from "@/registry/syncrobotic/ui/timeline"

/**
 * One robot in a side panel, over the list or map it was picked from, so you never lose your place. State and name
 * first, the levels that decide the next action, the last events, and the actions at the bottom in thumb reach.
 */
export function SheetRobotDetail({
  defaultOpen,
  focusOnOpen = true,
}: {
  defaultOpen?: boolean
  /** false for previews that open on load, so the page around them keeps its focus. */
  focusOnOpen?: boolean
}) {
  return (
    <div className="flex min-h-dvh items-start bg-background p-6">
      <Sheet defaultOpen={defaultOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary">Open Patrol dog 9E37</Button>
        </SheetTrigger>
        <SheetContent side="right" onOpenAutoFocus={focusOnOpen ? undefined : (e) => e.preventDefault()}>
          <SheetHeader>
            <StatusEyebrow tone="warning">Needs attention</StatusEyebrow>
            <SheetTitle className="text-xl">Patrol dog 9E37</SheetTitle>
            <SheetDescription>Loading bay · stopped 6 min ago at door C3</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            <Meter label="Battery" value={14} low={30} critical={15} />
            <Meter label="Signal" value={62} low={40} critical={20} />
          </div>

          <DescriptionList
            columns={2}
            items={[
              { label: "Mission", value: "Loading bay sweep" },
              { label: "Checkpoints", value: "2 of 6" },
              { label: "Firmware", value: "2.4.0" },
              { label: "Last service", value: "2 Nov 2026" },
            ]}
          />

          <section aria-labelledby="robot-events" className="flex flex-col gap-3">
            <h3 id="robot-events" className="text-sm font-medium">
              Last events
            </h3>
            <Timeline density="dense">
              <TimelineItem time="21:46" dateTime="2026-11-17T21:46" tone="warning" title="Stopped: door C3 closed" />
              <TimelineItem time="21:41" dateTime="2026-11-17T21:41" title="Checkpoint 2 passed" />
              <TimelineItem time="21:33" dateTime="2026-11-17T21:33" title="Left Dock 1" />
            </Timeline>
          </section>

          <SheetFooter className="mt-auto">
            <Button>
              <HousePlug aria-hidden="true" />
              Send to dock
            </Button>
            <Button variant="secondary">
              <Camera aria-hidden="true" />
              Open camera
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
