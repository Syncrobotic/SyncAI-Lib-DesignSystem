// @syncrobotic/segmented-control v0.15.0 · update: npx shadcn add @syncrobotic/segmented-control --overwrite
"use client"

import * as React from "react"
import { ToggleGroup } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Where the selected segment sits inside the track, kept in step with the DOM: Radix marks it data-state="on" whether
 * the value is controlled or not, so a MutationObserver sees every change, and a ResizeObserver keeps it right when the
 * track or a label changes size. Null until measured (and when nothing is selected).
 */
function useThumb(root: React.RefObject<HTMLDivElement | null>) {
  const [thumb, setThumb] = React.useState<{ x: number; w: number } | null>(null)
  React.useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const measure = () => {
      const on = el.querySelector<HTMLElement>(':scope > [data-slot="segmented-control-item"][data-state="on"]')
      setThumb(on ? { x: on.offsetLeft, w: on.offsetWidth } : null)
    }
    measure()
    const mo = new MutationObserver(measure)
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"] })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [root])
  return thumb
}

/**
 * Pick one of a few views. The selected segment is inverted (white on black in dark mode), and the inverted thumb travels
 * from the old segment to the new one: the Move pattern, --motion-base. Before it is measured (server render, first
 * paint) the selected segment fills itself, so it never shows unselected.
 */
export function SegmentedControl({ className, children, ...props }: Omit<ToggleGroup.ToggleGroupSingleProps, "type">) {
  const root = React.useRef<HTMLDivElement>(null)
  const thumb = useThumb(root)
  // The first measurement places the thumb without travelling; later ones animate.
  const [placed, setPlaced] = React.useState(false)
  React.useEffect(() => {
    if (thumb && !placed) requestAnimationFrame(() => setPlaced(true))
  }, [thumb, placed])
  return (
    <ToggleGroup.Root
      ref={root}
      data-slot="segmented-control"
      data-thumb={thumb ? "" : undefined}
      type="single"
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
            placed && "transition-[translate,width] duration-(--motion-base) ease-(--ease-standard)",
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
