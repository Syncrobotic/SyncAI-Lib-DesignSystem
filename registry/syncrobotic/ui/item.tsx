// @syncrobotic/item v0.53.0 · update: npx shadcn add @syncrobotic/item --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { iconTileVariants } from "@/registry/syncrobotic/ui/icon-tile"

export const itemVariants = cva(
  "group/item flex w-full items-center gap-3 rounded-sm text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard) [a&]:press [a&]:hover:bg-accent",
  {
    variants: {
      variant: {
        default: "",
        outline: "ring-1 ring-border ring-inset",
        muted: "bg-muted",
      },
      size: {
        md: "min-h-(--h-row) px-3 py-2",
        sm: "min-h-(--h-md) px-3 py-1",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
)

/** Rows in a list. Wrap each Item in an element with role="listitem" when there is more than one. */
export function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="list" data-slot="item-group" className={cn("flex flex-col gap-1", className)} {...props} />
}

/**
 * A row of content (media, title and description, trailing actions) whose links draw the hover fill. Only a link
 * (`asChild`) draws it, so a static row never looks clickable; for robot rows with a live status use the shell's List.
 */
export function Item({ className, variant, size, asChild, ...props }: React.ComponentProps<"div"> & VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  return <Comp data-slot="item" data-size={size ?? "md"} className={cn(itemVariants({ variant, size }), className)} {...props} />
}

/** The leading visual: an icon (default, in a 32 px tile), an avatar or an image. */
export function ItemMedia({ className, variant = "icon", ...props }: React.ComponentProps<"div"> & { variant?: "icon" | "avatar" | "image" | "plain" }) {
  return (
    <div
      data-slot="item-media"
      className={cn(
        "flex shrink-0 items-center justify-center",
        // The icon on the kit's 32 px muted tile, so a row's icon and an icon tile elsewhere are one shape.
        variant === "icon" && iconTileVariants({ variant: "muted", size: "sm" }),
        variant === "image" && "size-10 overflow-hidden rounded-xs [&_img]:size-full [&_img]:object-cover",
        className,
      )}
      {...props}
    />
  )
}

export function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-content" className={cn("flex min-w-0 flex-1 flex-col gap-1", className)} {...props} />
}

/** One line, cut with an ellipsis. Badges can sit inline after the text. */
export function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-title" className={cn("flex min-w-0 items-center gap-2 font-medium [&>span:first-child]:truncate", className)} {...props} />
}

/** Up to two lines under the title. */
export function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="item-description" className={cn("line-clamp-2 text-sm text-muted-foreground", className)} {...props} />
}

/** Trailing buttons, a badge, a key or a chevron. */
export function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-actions" className={cn("flex shrink-0 items-center gap-2", className)} {...props} />
}

/** A full-width line above or below the row's content, for a card-like row. */
export function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-header" className={cn("flex basis-full items-center justify-between gap-2", className)} {...props} />
}

export function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-footer" className={cn("flex basis-full items-center justify-between gap-2", className)} {...props} />
}

export function ItemSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="separator" data-slot="item-separator" className={cn("mx-3 h-px bg-border", className)} {...props} />
}
