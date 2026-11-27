// @syncrobotic/button-group v0.53.0 · update: npx shadcn add @syncrobotic/button-group --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Buttons, a field or a menu joined into one strip: split buttons, steppers, prev / next, search with scope. It holds
 * no selection: for one choice among several use SegmentedControl or ToggleGroup.
 */
export function ButtonGroup({ className, orientation = "horizontal", ...props }: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        "flex w-fit items-stretch [&>*]:focus-visible:relative [&>*]:focus-visible:z-10",
        orientation === "horizontal"
          ? "[&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none"
          : "flex-col [&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none",
        // A field inside the strip draws its own edge; let it share the neighbours' like a button does.
        "[&>[data-slot=input]]:relative [&>[data-slot=input-group]]:relative [&>[data-slot=input]]:flex-1",
        className,
      )}
      {...props}
    />
  )
}

/** A non-interactive cell in the strip: a count, a unit, a label. */
export function ButtonGroupText({ className, asChild, ...props }: React.ComponentProps<"span"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="button-group-text"
      className={cn(
        "flex h-(--h-md) items-center gap-2 rounded-sm bg-muted px-3 text-sm font-medium text-muted-foreground tabular-nums ring-1 ring-border ring-inset [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}

/** A hairline between filled buttons, which have no edge of their own to share. */
export function ButtonGroupSeparator({ className, orientation = "vertical" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
  return (
    <span
      role="separator"
      aria-orientation={orientation}
      data-slot="button-group-separator"
      className={cn("relative z-10 shrink-0 self-stretch bg-primary-foreground/20", orientation === "vertical" ? "w-px" : "h-px", className)}
    />
  )
}
