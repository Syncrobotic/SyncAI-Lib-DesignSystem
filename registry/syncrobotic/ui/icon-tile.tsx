// @syncrobotic/icon-tile v0.53.0 · update: npx shadcn add @syncrobotic/icon-tile --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const iconTileVariants = cva("relative inline-flex shrink-0 items-center justify-center", {
  variants: {
    variant: {
      outline: "bg-card text-foreground ring-1 ring-border ring-inset",
      muted: "bg-muted text-muted-foreground",
      // A card surface lifted off a muted or busy background by its edge alone: surfaces carry no shadow (Elevation).
      raised: "bg-card text-foreground ring-1 ring-border",
      soft: "",
      solid: "",
    },
    // No info or success: a tile holds a state, and calm states are grey (neutral). Blue is for a process someone is
    // waiting on (a progress bar), green for a confirmation that comes and goes (a toast).
    tone: { neutral: "", warning: "", danger: "" },
    size: {
      sm: "size-8 rounded-xs [&_svg]:size-4",
      md: "size-10 rounded-sm [&_svg]:size-5",
      lg: "size-12 rounded-sm [&_svg]:size-6",
      xl: "size-16 rounded-md [&_svg]:size-6",
    },
    shape: { square: "", circle: "rounded-full" },
  },
  compoundVariants: [
    { variant: "soft", tone: "neutral", class: "bg-neutral-subtle text-neutral" },
    { variant: "soft", tone: "warning", class: "bg-warning-subtle text-warning" },
    { variant: "soft", tone: "danger", class: "bg-danger-subtle text-danger" },
    { variant: "solid", tone: "neutral", class: "bg-primary text-primary-foreground" },
    // The ink flips with the mode (white on light amber-brown, near-black on dark yellow): 4.5:1 or more in every theme.
    { variant: "solid", tone: "warning", class: "bg-warning text-primary-foreground" },
    // Solid red is the emergency stop's alone, so a solid danger tile stays on its tint with a danger edge.
    { variant: "solid", tone: "danger", class: "bg-danger-subtle text-danger ring-1 ring-danger ring-inset" },
  ],
  defaultVariants: { variant: "outline", tone: "neutral", size: "md", shape: "square" },
})

/**
 * A square or round surface behind one icon, in five surfaces and four sizes, with an optional status dot. It lines up
 * icons in rows, cards and empty states; neutral by default, a tone only when the tile states a status, never to decorate.
 */
export function IconTile({
  className,
  variant,
  tone,
  size,
  shape,
  asChild,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof iconTileVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="icon-tile"
      className={cn(
        iconTileVariants({ variant, tone, size, shape }),
        asChild && "press transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-accent",
        className,
      )}
      {...props}
    />
  )
}

/** A dot pinned to the tile's top-end corner, cut out by the page colour: online, unread, needs attention. */
export function IconTileDot({
  className,
  tone = "neutral",
  label,
}: {
  className?: string
  tone?: "success" | "warning" | "danger" | "neutral"
  label: string
}) {
  const fill = { success: "bg-foreground", warning: "bg-warning", danger: "bg-danger", neutral: "bg-muted-foreground" }[tone]
  return <span role="img" aria-label={label} className={cn("absolute -top-1 -right-1 size-3 rounded-full ring-2 ring-background", fill, className)} />
}
