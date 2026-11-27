// @syncrobotic/resizable v0.53.0 · update: npx shadcn add @syncrobotic/resizable --overwrite
"use client"

import * as React from "react"
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type GroupImperativeHandle,
  type GroupProps,
  type LayoutStorage,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels"
import { cn } from "@/lib/utils"

type Orientation = "horizontal" | "vertical"

// autoSaveId keeps sizes in localStorage, read and written only in the browser and never throwing (a private window, blocked
// site data, a value that is not JSON). Without it nothing is read or written. Sizes saved by version 3 under the same name
// are read too, when the panels have the same ids.
const browserStorage: LayoutStorage = {
  getItem(key) {
    try {
      const value = typeof window === "undefined" ? null : window.localStorage.getItem(key)
      if (value !== null) JSON.parse(value)
      return value
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {}
  },
}
const noStorage: LayoutStorage = { getItem: () => null, setItem: () => {} }

const MOUSE_HIT = 16
const COARSE = "(any-pointer: coarse)"

/** The handle's hit area in px: 16 for a mouse, the control height on any touch screen (--h-md: 44, 48 in gloves). */
function hitArea(id: string) {
  const el = typeof document === "undefined" ? null : document.getElementById(id)
  if (!el || typeof matchMedia !== "function" || !matchMedia(COARSE).matches) return MOUSE_HIT
  const value = getComputedStyle(el).getPropertyValue("--h-md").trim()
  const n = parseFloat(value)
  if (!Number.isFinite(n)) return MOUSE_HIT
  return value.endsWith("rem") ? n * parseFloat(getComputedStyle(document.documentElement).fontSize) : n
}
const noSubscribe = () => () => {}
function onPointerChange(notify: () => void) {
  if (typeof matchMedia !== "function") return () => {}
  const query = matchMedia(COARSE)
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}

export type ResizablePanelGroupProps = Omit<GroupProps, "orientation"> & {
  /** "horizontal" (side by side, the default) or "vertical" (stacked). */
  orientation?: Orientation
  /** The name react-resizable-panels 3 used; the same as `orientation`. */
  direction?: Orientation
  /** Remembers the sizes in this browser under this name. Give each Panel an `id` so a saved size finds its panel. */
  autoSaveId?: string
}

/**
 * Panels resized by dragging the line between them or with the arrow keys, horizontal, vertical or nested
 * (react-resizable-panels). The arrow keys work on the focused handle; `autoSaveId` remembers the sizes per browser.
 */
export function ResizablePanelGroup({
  id,
  className,
  orientation,
  direction,
  autoSaveId,
  defaultLayout,
  onLayoutChanged,
  groupRef,
  resizeTargetMinimumSize,
  ...props
}: ResizablePanelGroupProps) {
  const fallbackId = React.useId()
  const groupId = String(id ?? fallbackId)
  // Measured once the group is in the page (the snapshot is checked again after mount), and again when a pointer comes or goes.
  const hit = React.useSyncExternalStore(onPointerChange, () => hitArea(groupId), () => MOUSE_HIT)
  // A saved layout is never read while hydrating: the panels' first sizes are drawn from it, and the server had none.
  const inBrowser = React.useSyncExternalStore(noSubscribe, () => true, () => false)
  const saved = useDefaultLayout({ id: autoSaveId ?? "", storage: autoSaveId && inBrowser ? browserStorage : noStorage })
  const savedLayout = autoSaveId ? saved.defaultLayout : undefined
  const group = React.useRef<GroupImperativeHandle | null>(null)
  React.useImperativeHandle(groupRef, () => ({ getLayout: () => group.current!.getLayout(), setLayout: (l) => group.current!.setLayout(l) }), [])
  // After hydration the group is already laid out, so the saved sizes are applied once, as version 3 did.
  const hydrated = React.useRef({ fromServer: false, applied: false })
  React.useEffect(() => {
    const h = hydrated.current
    if (!inBrowser) h.fromServer = true
    else if (h.fromServer && !h.applied && savedLayout) {
      h.applied = true
      group.current?.setLayout(savedLayout)
    }
  }, [inBrowser, savedLayout])
  const o = orientation ?? direction ?? "horizontal"
  return (
    <Group
      data-slot="resizable-panel-group"
      data-orientation={o}
      orientation={o}
      className={cn("size-full", className)}
      id={groupId}
      groupRef={group}
      resizeTargetMinimumSize={resizeTargetMinimumSize ?? { fine: hit, coarse: hit }}
      defaultLayout={defaultLayout ?? savedLayout}
      onLayoutChanged={(layout, meta) => {
        if (autoSaveId) saved.onLayoutChanged(layout, meta)
        onLayoutChanged?.(layout, meta)
      }}
      {...props}
    />
  )
}

type Size = number | string | undefined
// A bare number is a percentage of the group, as it was in react-resizable-panels 3 (version 4 reads it as pixels).
// Strings pass through: "240px", "20rem", "30%".
const pct = (s: Size) => (typeof s === "number" ? `${s}%` : s)

export type ResizablePanelProps = Omit<PanelProps, "defaultSize" | "minSize" | "maxSize" | "collapsedSize" | "collapsedThreshold"> & {
  /** The first size: a number is a percentage of the group (40 is 40%); a string takes a unit ("240px", "20rem"). */
  defaultSize?: Size
  /** The smallest it can be dragged to, as `defaultSize`. */
  minSize?: Size
  /** The largest it can be dragged to, as `defaultSize`. */
  maxSize?: Size
  /** Its size when collapsed (with `collapsible`), as `defaultSize`; 0 by default. */
  collapsedSize?: Size
  /** How far past `minSize` a drag must go to collapse it, as `defaultSize`. */
  collapsedThreshold?: Size
}

/** One panel. Its sizes are percentages of the group when they are numbers, as in react-resizable-panels 3. */
export function ResizablePanel({ defaultSize, minSize, maxSize, collapsedSize, collapsedThreshold, ...props }: ResizablePanelProps) {
  return (
    <Panel
      data-slot="resizable-panel"
      defaultSize={pct(defaultSize)}
      minSize={pct(minSize)}
      maxSize={pct(maxSize)}
      collapsedSize={pct(collapsedSize)}
      collapsedThreshold={pct(collapsedThreshold)}
      {...props}
    />
  )
}

/**
 * The line between two panels; its hit area is wider (16 px, the control height on touch). `withHandle` adds a grip that
 * tells touch users it drags: --input (3:1, like a control edge), 6 px however thin the line. A vertical group's handle is
 * a horizontal separator.
 */
export function ResizableHandle({ withHandle, className, ...props }: SeparatorProps & { withHandle?: boolean }) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "group/handle relative flex w-px shrink-0 items-center justify-center bg-border transition-colors duration-(--motion-fast) ease-(--ease-standard)",
        "hover:bg-muted-foreground data-[separator=hover]:bg-muted-foreground data-[separator=active]:bg-ring",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <span
          aria-hidden="true"
          className="z-10 h-8 w-1.5 shrink-0 rounded-full bg-input ring-2 ring-card group-hover/handle:bg-muted-foreground group-data-[separator=hover]/handle:bg-muted-foreground group-aria-[orientation=horizontal]/handle:h-1.5 group-aria-[orientation=horizontal]/handle:w-8 group-data-[separator=active]/handle:bg-ring"
        />
      )}
    </Separator>
  )
}
