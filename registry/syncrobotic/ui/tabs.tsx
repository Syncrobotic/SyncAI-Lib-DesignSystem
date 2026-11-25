// @syncrobotic/tabs v0.35.0 · update: npx shadcn add @syncrobotic/tabs --overwrite
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
  // `travel` is true only when the active tab changed: a tab that changes width (a web font arriving, a count) places the
  // underline at once. Movement marks a change of state, and a resize is not one.
  const [line, setLine] = React.useState<{ x: number; w: number; travel: boolean } | null>(null)
  React.useLayoutEffect(() => {
    const el = list.current
    if (!el) return
    const measure = (travel: boolean) => {
      const on = el.querySelector<HTMLElement>(':scope > [data-slot="tabs-trigger"][data-state="active"]')
      setLine((l) => {
        if (!on) return null
        const next = { x: on.offsetLeft, w: on.offsetWidth, travel }
        return l && l.x === next.x && l.w === next.w ? l : next
      })
    }
    measure(false)
    const mo = new MutationObserver(() => measure(true))
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"] })
    const ro = new ResizeObserver(() => measure(false))
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    return () => {
      mo.disconnect()
      ro.disconnect()
    }
  }, [list])
  return line
}

/** The nearest ancestor that scrolls, or null for the page itself. */
function scroller(el: HTMLElement) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p)
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) return p
  }
  return null
}

/**
 * A sticky list, picked while stuck: the reader was deep in the last tab, so the page scrolls back until the tabs sit in
 * their own place again and the new tab reads from its start. A jump, not an animation: it is where the content starts.
 */
function useBackToStart(list: React.RefObject<HTMLDivElement | null>, on: boolean) {
  React.useEffect(() => {
    const el = list.current
    if (!on || !el) return
    const activeNow = () => el.querySelector(':scope > [data-slot="tabs-trigger"][data-state="active"]')
    let active = activeNow()
    const mo = new MutationObserver(() => {
      const next = activeNow()
      if (next === active) return
      active = next
      const root = el.parentElement
      if (!root) return
      // Stuck: the tabs' own section has scrolled up past the list. Not stuck, the two tops are level and nothing moves.
      const by = root.getBoundingClientRect().top - el.getBoundingClientRect().top
      if (by > -1) return
      const box = scroller(el)
      if (box) box.scrollBy({ top: by })
      else window.scrollBy({ top: by })
    })
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["data-state"] })
    return () => mo.disconnect()
  }, [list, on])
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> & {
  /**
   * Keep the row in view while the page scrolls. It sticks under the shell's top bar (`--shell-top`, which the shells
   * set; 0 without one), on the shell's surface (`--shell-surface`, else the background), with its hairline, below the
   * bar. Picking a tab while it is stuck scrolls back to the start of the tabs.
   */
  sticky?: boolean
}

/** Hands the list's element to a caller's ref too (a function or an object), and returns its cleanup if it has one. */
function forward(ref: React.Ref<HTMLDivElement> | undefined, node: HTMLDivElement | null) {
  if (typeof ref === "function") return ref(node)
  if (ref) ref.current = node
}

/** The tabs in a row over a hairline. The underline travels to the tab you pick: the Move pattern, --motion-base. */
export function TabsList({ className, children, sticky, ref, ...props }: TabsListProps) {
  const list = React.useRef<HTMLDivElement>(null)
  // A ref passed in is merged with the one the underline measures; spread over it, it replaced it and the underline
  // never showed.
  const setList = React.useCallback(
    (node: HTMLDivElement | null) => {
      list.current = node
      const cleanup = forward(ref, node)
      return () => {
        list.current = null
        if (typeof cleanup === "function") cleanup()
        else forward(ref, null)
      }
    },
    [ref],
  )
  const line = useUnderline(list)
  useBackToStart(list, !!sticky)
  // The first measurement places the underline without travelling; later ones animate.
  const [placed, setPlaced] = React.useState(false)
  React.useEffect(() => {
    if (line && !placed) requestAnimationFrame(() => setPlaced(true))
  }, [line, placed])
  // overflow-x scrolls a row of many tabs. overflow-y must be hidden, not left to default: a scrolling x turns y to auto,
  // and the triggers sit 1 px past the list's border (-mb-px, so the underline covers it), which made the list scroll
  // 1 px vertically and phones show a scrollbar on it.
  return (
    <TabsPrimitive.List
      ref={setList}
      data-slot="tabs-list"
      data-underline={line ? "" : undefined}
      data-sticky={sticky ? "" : undefined}
      className={cn(
        "group/tabs flex gap-4 overflow-x-auto overflow-y-hidden border-b border-border",
        // Sticky is still a positioned box, so the underline measures from it as before. Under the bars (z-20), over the page.
        sticky ? "sticky top-[var(--shell-top,0)] z-10 bg-[var(--shell-surface,var(--color-background))]" : "relative",
        className,
      )}
      {...props}
    >
      {children}
      {line && (
        <span
          aria-hidden="true"
          data-slot="tabs-underline"
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 h-0.5 bg-foreground",
            placed && line.travel && "transition-[translate,width] duration-(--motion-base) ease-(--ease-standard)",
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
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("rounded-xs data-[state=active]:animate-appear", className)} {...props} />
}
