// @syncrobotic/resizable v0.17.2 · update: npx shadcn add @syncrobotic/resizable --overwrite
"use client"

import * as React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { cn } from "@/lib/utils"

/**
 * Panels the user resizes by dragging the line between them, or with the keyboard: focus the handle and use the arrow
 * keys (react-resizable-panels). For a map beside a list, a camera above a log, an editor beside its preview.
 * `autoSaveId` remembers the sizes per browser.
 */
export function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof PanelGroup>) {
  return <PanelGroup data-slot="resizable-panel-group" className={cn("flex size-full data-[panel-group-direction=vertical]:flex-col", className)} {...props} />
}

export const ResizablePanel = Panel

/**
 * The line between two panels. The hit area is wider than the line; `withHandle` shows a grip pill in the middle, which
 * tells touch users it can be dragged. The grip is --input (3:1, like any control edge) ringed in the card colour, and keeps
 * its 6 px however thin the line it sits on.
 */
export function ResizableHandle({ withHandle, className, ...props }: React.ComponentProps<typeof PanelResizeHandle> & { withHandle?: boolean }) {
  return (
    <PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "group/handle relative flex w-px shrink-0 items-center justify-center bg-border transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        // The hit area is 16 px for a mouse; on a touch screen it is the control height (44, 48 in gloves).
        "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 any-pointer-coarse:after:w-(--h-md)",
        "hover:bg-muted-foreground data-[resize-handle-state=drag]:bg-ring",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:inset-y-auto data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-4 any-pointer-coarse:data-[panel-group-direction=vertical]:after:h-(--h-md) data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <span
          aria-hidden="true"
          className="z-10 h-8 w-1.5 shrink-0 rounded-full bg-input ring-2 ring-card group-hover/handle:bg-muted-foreground group-data-[panel-group-direction=vertical]/handle:h-1.5 group-data-[panel-group-direction=vertical]/handle:w-8 group-data-[resize-handle-state=drag]/handle:bg-ring"
        />
      )}
    </PanelResizeHandle>
  )
}
