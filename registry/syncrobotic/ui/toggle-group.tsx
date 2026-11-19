// @syncrobotic/toggle-group v0.17.3 · update: npx shadcn add @syncrobotic/toggle-group --overwrite
"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

type Variant = "ghost" | "outline"
type Size = "sm" | "md"
type Orientation = "horizontal" | "vertical"
const Ctx = React.createContext<{ variant: Variant; size: Size; joined: boolean; orientation: Orientation }>({
  variant: "outline",
  size: "md",
  joined: true,
  orientation: "horizontal",
})

/**
 * A set of toggles: one on at a time (`type="single"`, a view or a time range) or any mix (`type="multiple"`, layers,
 * channels). On is inverted, like a selected segment. Joined into one strip by default; `joined={false}` spaces them.
 * SegmentedControl is the single-choice form on a muted track; use it for switching views of the same data.
 * Joined outline items share their edges; two that are on side by side keep a 1 px line between them, so they read as
 * two choices, not one wide block. Ghost items have no edge to share, so they are never joined and keep their corners.
 */
export function ToggleGroup({
  className,
  variant = "outline",
  size = "md",
  joined = true,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & { variant?: Variant; size?: Size; joined?: boolean }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      orientation={orientation}
      className={cn(
        "flex w-fit items-stretch",
        orientation === "vertical" && "flex-col",
        !joined && "gap-2",
        // Ghost items have no outline to join: they sit 4 px apart and keep their own corners, so a selected one is a
        // whole rounded fill, never a square block.
        joined && variant === "ghost" && "gap-1",
        // Two selected neighbours keep a line between them, so they read as two choices, not one wide block.
        joined && variant === "outline" && orientation === "horizontal" && "[&>[data-state=on]+[data-state=on]]:border-l [&>[data-state=on]+[data-state=on]]:border-background",
        joined && variant === "outline" && orientation === "vertical" && "[&>[data-state=on]+[data-state=on]]:border-t [&>[data-state=on]+[data-state=on]]:border-background",
        joined &&
          variant === "outline" &&
          (orientation === "horizontal"
            ? "[&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none"
            : "[&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none"),
        className,
      )}
      {...props}
    >
      <Ctx.Provider value={{ variant, size, joined, orientation: orientation === "vertical" ? "vertical" : "horizontal" }}>{children}</Ctx.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

export function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const { variant, size, joined, orientation } = React.useContext(Ctx)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "press inline-flex shrink-0 items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium whitespace-nowrap focus-visible:relative focus-visible:z-10",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
        variant === "outline" && "ring-1 ring-border ring-inset",
        "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:ring-primary data-[state=on]:hover:bg-primary",
        // Two on side by side: a line in the on-text colour where they meet.
        joined &&
          variant === "outline" &&
          (orientation === "horizontal"
            ? "relative data-[state=on]:[[data-state=on]+&]:before:absolute data-[state=on]:[[data-state=on]+&]:before:inset-y-0 data-[state=on]:[[data-state=on]+&]:before:left-0 data-[state=on]:[[data-state=on]+&]:before:w-px data-[state=on]:[[data-state=on]+&]:before:bg-primary-foreground"
            : "relative data-[state=on]:[[data-state=on]+&]:before:absolute data-[state=on]:[[data-state=on]+&]:before:inset-x-0 data-[state=on]:[[data-state=on]+&]:before:top-0 data-[state=on]:[[data-state=on]+&]:before:h-px data-[state=on]:[[data-state=on]+&]:before:bg-primary-foreground"),
        "disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4",
        size === "sm" ? "h-(--h-sm) min-w-(--h-sm)" : "h-(--h-md) min-w-(--h-md)",
        className,
      )}
      {...props}
    />
  )
}
