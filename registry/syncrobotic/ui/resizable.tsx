// @syncrobotic/resizable v0.25.0 · update: npx shadcn add @syncrobotic/resizable --overwrite
"use client"

import * as React from "react"
import { Group, Panel, Separator, useDefaultLayout, type LayoutStorage } from "react-resizable-panels"
import { cn } from "@/lib/utils"

// Version 4 sizes a panel in pixels when given a number; the kit has always meant percent, so a number becomes a
// percentage here and a string ("240px", "20rem", "30%") passes through with its unit.
const percent = (size: number | string | undefined) => (typeof size === "number" ? `${size}%` : size)

// localStorage when there is a window to read it from, and nothing on the server, where the library would otherwise
// read the global and fail before the page has a layout to remember.
const browserStorage: LayoutStorage = {
  getItem: (key) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key, value) => {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value)
  },
}
// The hook runs on every group so the rules of hooks hold; a group without autoSaveId reads and writes nothing.
const noStorage: LayoutStorage = { getItem: () => null, setItem: () => {} }

/**
 * Panels the user resizes by dragging the line between them, or with the keyboard: focus the handle and use the arrow
 * keys (react-resizable-panels 4). For a map beside a list, a camera above a log, an editor beside its preview.
 * `autoSaveId` remembers the sizes per browser.
 */
export function ResizablePanelGroup({
  direction,
  orientation,
  autoSaveId,
  onLayoutChanged,
  resizeTargetMinimumSize,
  className,
  ...props
}: React.ComponentProps<typeof Group> & {
  /**
   * The version 3 name for `orientation`, still read so existing layouts keep their direction.
   * @deprecated Use `orientation`, react-resizable-panels 4's name for it.
   */
  direction?: "horizontal" | "vertical"
  /** Remembers the panel sizes in localStorage under this key. */
  autoSaveId?: string
}) {
  const saved = useDefaultLayout({ id: autoSaveId ?? "resizable", storage: autoSaveId ? browserStorage : noStorage })
  return (
    <Group
      data-slot="resizable-panel-group"
      orientation={orientation ?? direction}
      defaultLayout={autoSaveId ? saved.defaultLayout : undefined}
      onLayoutChanged={(layout, meta) => {
        if (autoSaveId) saved.onLayoutChanged(layout, meta)
        onLayoutChanged?.(layout, meta)
      }}
      // Version 4 finds the handle under the pointer from the handle's box, not from what the pointer is over, so the
      // pseudo-element below no longer widens the area a drag starts from. These match it: 16 px with a mouse, and on a
      // touch screen the control height in gloves (48), which also covers the 44 px of the default density.
      resizeTargetMinimumSize={resizeTargetMinimumSize ?? { fine: 16, coarse: 48 }}
      className={cn("flex size-full", className)}
      {...props}
    />
  )
}

/** A panel. `defaultSize`, `minSize`, `maxSize` and `collapsedSize` are percentages as numbers, or strings with a unit. */
export function ResizablePanel({ defaultSize, minSize, maxSize, collapsedSize, ...props }: React.ComponentProps<typeof Panel>) {
  return (
    <Panel
      data-slot="resizable-panel"
      defaultSize={percent(defaultSize)}
      minSize={percent(minSize)}
      maxSize={percent(maxSize)}
      collapsedSize={percent(collapsedSize)}
      {...props}
    />
  )
}

/**
 * The line between two panels. The hit area is wider than the line; `withHandle` shows a grip pill in the middle, which
 * tells touch users it can be dragged. The grip is --input (3:1, like any control edge) ringed in the card colour, and keeps
 * its 6 px however thin the line it sits on.
 */
export function ResizableHandle({ withHandle, className, ...props }: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) {
  // Version 4 names neither the group's direction nor the drag on the handle as version 3 did. A handle in a vertical
  // group is a horizontal line, which aria-orientation says; data-separator is "active" while it is dragged.
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "group/handle relative flex w-px shrink-0 items-center justify-center bg-border transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        // The hit area is 16 px for a mouse; on a touch screen it is the control height (44, 48 in gloves).
        "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 any-pointer-coarse:after:w-(--h-md)",
        "hover:bg-muted-foreground data-[separator=active]:bg-ring",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full",
        "aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:inset-y-auto aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-4 any-pointer-coarse:aria-[orientation=horizontal]:after:h-(--h-md) aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <span
          aria-hidden="true"
          className="z-10 h-8 w-1.5 shrink-0 rounded-full bg-input ring-2 ring-card group-hover/handle:bg-muted-foreground group-aria-[orientation=horizontal]/handle:h-1.5 group-aria-[orientation=horizontal]/handle:w-8 group-data-[separator=active]/handle:bg-ring"
        />
      )}
    </Separator>
  )
}
