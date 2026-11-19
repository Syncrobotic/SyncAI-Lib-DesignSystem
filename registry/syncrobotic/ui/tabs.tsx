// @syncrobotic/tabs v0.15.0 · update: npx shadcn add @syncrobotic/tabs --overwrite
"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** Sections of one page. To switch between views of the same data, use SegmentedControl. */
export function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

/**
 * Where the active tab sits in the list, kept in step with the DOM: Radix marks it data-state="active" whether the value
 * is controlled or not, and a ResizeObserver follows the list and the labels. Null until measured.
 */
function useUnderline(list: React.RefObject<HTMLDivElement | null>) {
  const [line, setLine] = React.useState<{ x: number; w: number } | null>(null)
  React.useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const measure = () => {
      const on = el.querySelector<HTMLElement>(':scope > [data-slot="tabs-trigger"][data-state="active"]')
      setLine(on ? { x: on.offsetLeft, w: on.offsetWidth } : null)
    }
    measure()
    const mo = new MutationObserver(measure)
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"] })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [list])
  return line
}

/** The tabs in a row over a hairline. The underline travels to the tab you pick: the Move pattern, --motion-base. */
export function TabsList({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const list = React.useRef<HTMLDivElement>(null)
  const line = useUnderline(list)
  // The first measurement places the underline without travelling; later ones animate.
  const [placed, setPlaced] = React.useState(false)
  React.useEffect(() => {
    if (line && !placed) requestAnimationFrame(() => setPlaced(true))
  }, [line, placed])
  return (
    <TabsPrimitive.List
      ref={list}
      data-slot="tabs-list"
      data-underline={line ? "" : undefined}
      className={cn("group/tabs relative flex gap-4 overflow-x-auto border-b border-border", className)}
      {...props}
    >
      {children}
      {line && (
        <span
          aria-hidden="true"
          data-slot="tabs-underline"
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 h-0.5 bg-foreground",
            placed && "transition-[translate,width] duration-(--motion-base) ease-(--ease-standard)",
          )}
          style={{ translate: `${line.x}px 0`, width: line.w }}
        />
      )}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "-mb-px inline-flex h-(--h-md) items-center gap-2 border-b-2 border-transparent text-sm whitespace-nowrap text-muted-foreground",
        "transition-colors duration-(--motion-base) ease-(--ease-standard) hover:text-foreground",
        "data-[state=active]:font-medium data-[state=active]:text-foreground",
        // Until the underline is measured, the active tab draws its own; then the travelling one does.
        "data-[state=active]:border-foreground group-data-[underline]/tabs:data-[state=active]:border-transparent",
        "disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none data-[state=active]:animate-appear", className)} {...props} />
}
