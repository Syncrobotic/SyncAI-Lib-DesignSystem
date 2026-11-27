// @syncrobotic/segmented-control v0.51.0 · update: npx shadcn add @syncrobotic/segmented-control --overwrite
"use client"

import * as React from "react"
import { ToggleGroup } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * The selected segment's place in the track. Radix sets data-state="on" controlled or not, so a MutationObserver sees
 * every change; a ResizeObserver follows size changes. Null until measured.
 */
function useThumb(root: React.RefObject<HTMLDivElement | null>) {
  // `travel` is true only when the selection moved: a segment that changes width (a web font arriving, a count) places
  // the thumb at once. Movement marks a change of state, and a resize is not one.
  const [thumb, setThumb] = React.useState<{ x: number; w: number; travel: boolean } | null>(null)
  React.useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    // offsetLeft / offsetWidth are the item's layout box inside the track (its offset parent), unaffected by the press
    // scale, so the thumb is exactly the selected segment's box. Unchanged values keep the same state, so no re-render.
    const measure = (travel: boolean) => {
      const on = el.querySelector<HTMLElement>(':scope > [data-slot="segmented-control-item"][data-state="on"]')
      setThumb((t) => {
        if (!on) return null
        const next = { x: on.offsetLeft, w: on.offsetWidth, travel }
        return t && t.x === next.x && t.w === next.w ? t : next
      })
    }
    measure(false)
    const mo = new MutationObserver(() => measure(true))
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"] })
    // Every segment is watched as well as the track: a label that changes width (a web font arriving, a count) moves
    // the segments inside a track whose own size stays the same.
    const ro = new ResizeObserver(() => measure(false))
    ro.observe(el)
    el.querySelectorAll<HTMLElement>(':scope > [data-slot="segmented-control-item"]').forEach((i) => ro.observe(i))
    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [root])
  return thumb
}

/**
 * Pick one of a few views. The selected segment is inverted and its thumb moves between segments (--motion-base); before
 * it is measured the segment fills itself, so it never shows unselected.
 */
export function SegmentedControl({
  className,
  children,
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: Omit<ToggleGroup.ToggleGroupSingleProps, "type" | "value" | "defaultValue" | "onValueChange"> & {
  /** The selected segment, controlled. One always stays selected: pressing it again does not clear it. */
  value?: string
  /** The segment selected at first, when `value` is not given. */
  defaultValue?: string
  /** Called with the newly selected segment's value, never with an empty one. */
  onValueChange?: (value: string) => void
}) {
  const root = React.useRef<HTMLDivElement>(null)
  // One choice always stays selected: a toggle group lets the selected item be pressed off (value ""), a segmented
  // control does not. So the group is always controlled here, and an empty value is ignored.
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const value = valueProp ?? inner
  const select = (next: string) => {
    if (!next) return
    setInner(next)
    onValueChange?.(next)
  }
  const thumb = useThumb(root)
  // The first measurement places the thumb without travelling; later ones animate.
  const [placed, setPlaced] = React.useState(false)
  React.useEffect(() => {
    if (!thumb || placed) return
    const id = requestAnimationFrame(() => setPlaced(true))
    return () => cancelAnimationFrame(id)
  }, [thumb, placed])
  return (
    <ToggleGroup.Root
      ref={root}
      data-slot="segmented-control"
      data-thumb={thumb ? "" : undefined}
      type="single"
      value={value}
      onValueChange={select}
      // The muted track has no edge of its own (1.35:1 on the card); in high contrast it takes the 3:1 field edge.
      className={cn(
        "group/segmented relative inline-flex h-(--h-md) w-full items-center gap-1 rounded-sm bg-muted p-1 in-data-[contrast=more]:ring-1 in-data-[contrast=more]:ring-input in-data-[contrast=more]:ring-inset",
        className,
      )}
      {...props}
    >
      {thumb && (
        <span
          aria-hidden="true"
          data-slot="segmented-control-thumb"
          className={cn(
            "pointer-events-none absolute inset-y-1 left-0 rounded-xs bg-primary",
            placed && thumb.travel && "transition-[translate,width] duration-(--motion-base) ease-(--ease-standard)",
          )}
          style={{ translate: `${thumb.x}px 0`, width: thumb.w }}
        />
      )}
      {children}
    </ToggleGroup.Root>
  )
}

export function SegmentedControlItem({ className, ...props }: React.ComponentProps<typeof ToggleGroup.Item>) {
  return (
    <ToggleGroup.Item
      data-slot="segmented-control-item"
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xs px-3 text-sm text-muted-foreground",
        // The segment draws 36 px inside the 44 px track; its hit area reaches the track's edges, so a finger gets 44.
        "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        // The label's colour changes with the thumb's travel (--motion-base), not ahead of it.
        "press duration-(--motion-base) ease-(--ease-standard) hover:text-foreground",
        "data-[state=on]:font-medium data-[state=on]:text-primary-foreground",
        // Until the thumb is measured, the selected segment fills itself; then the thumb behind it does.
        "data-[state=on]:bg-primary group-data-[thumb]/segmented:data-[state=on]:bg-transparent",
        "disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export type ChartViewSwitchLabels = {
  /** Names the switch: "Show as". */
  view: string
  chart: string
  table: string
}

export const defaultChartViewSwitchLabels: ChartViewSwitchLabels = { view: "Show as", chart: "Chart", table: "Table" }

/**
 * The Chart / Table (or Map / List) switch in a data card's header: a SegmentedControl at `--h-sm` (36 px, 44 on touch).
 * Beside a field use a plain SegmentedControl at `--h-md`. Kept here so a block without recharts can use it.
 */
export function ChartViewSwitch({
  value,
  onValueChange,
  views,
  labels,
  className,
}: {
  /** The view shown: "chart" or "table", or one of `views`. */
  value: string
  onValueChange: (value: string) => void
  /** Other views than Chart and Table, in order: `[{ value: "map", label: "Map" }, { value: "list", label: "List" }]`. */
  views?: { value: string; label: string }[]
  /** The words it says, to translate them. With `views`, only `view` (the switch's name) is used. */
  labels?: Partial<ChartViewSwitchLabels>
  className?: string
}) {
  const l = { ...defaultChartViewSwitchLabels, ...labels }
  const items = views ?? [
    { value: "chart", label: l.chart },
    { value: "table", label: l.table },
  ]
  return (
    <SegmentedControl data-slot="chart-view-switch" value={value} onValueChange={onValueChange} aria-label={l.view} className={cn("h-(--h-sm) w-auto", className)}>
      {items.map((v) => (
        <SegmentedControlItem key={v.value} value={v.value}>
          {v.label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}
