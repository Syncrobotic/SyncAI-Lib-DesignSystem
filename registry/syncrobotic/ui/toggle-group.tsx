// @syncrobotic/toggle-group v0.9.0 · update: npx shadcn add @syncrobotic/toggle-group --overwrite
"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

type Variant = "ghost" | "outline"
type Size = "sm" | "md"
const Ctx = React.createContext<{ variant: Variant; size: Size; joined: boolean }>({ variant: "outline", size: "md", joined: true })

/**
 * A set of toggles: one on at a time (`type="single"`, a view or a time range) or any mix (`type="multiple"`, layers,
 * channels). On is inverted, like a selected segment. Joined into one strip by default; `joined={false}` spaces them.
 * SegmentedControl is the single-choice form on a muted track; use it for switching views of the same data.
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
        joined &&
          (orientation === "horizontal"
            ? "[&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none"
            : "[&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none"),
        className,
      )}
      {...props}
    >
      <Ctx.Provider value={{ variant, size, joined }}>{children}</Ctx.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

export function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const { variant, size } = React.useContext(Ctx)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "press inline-flex shrink-0 items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium whitespace-nowrap focus-visible:relative focus-visible:z-10",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
        variant === "outline" && "ring-1 ring-border ring-inset",
        "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:ring-primary data-[state=on]:hover:bg-primary",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        size === "sm" ? "h-(--h-sm) min-w-(--h-sm)" : "h-(--h-md) min-w-(--h-md)",
        className,
      )}
      {...props}
    />
  )
}
