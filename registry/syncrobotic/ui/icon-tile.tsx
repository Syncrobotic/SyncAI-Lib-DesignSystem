// @syncrobotic/icon-tile v0.17.1 · update: npx shadcn add @syncrobotic/icon-tile --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * A square (or round) surface behind one icon, so icons in rows, cards and empty states line up at one size.
 * Neutral by default; a tone only when the tile states a status (a failed run, a warning), never to decorate.
 */
export const iconTileVariants = cva("relative inline-flex shrink-0 items-center justify-center", {
  variants: {
    variant: {
      outline: "bg-card text-foreground ring-1 ring-border ring-inset",
      muted: "bg-muted text-muted-foreground",
      raised: "bg-card text-foreground shadow-overlay ring-1 ring-border",
      soft: "",
      solid: "",
    },
    tone: { neutral: "", info: "", success: "", warning: "", danger: "" },
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
    // info and success stay calm (neutral) on a tile that stays on screen: blue is for a process someone is waiting on (a
    // progress bar, a running stage), green for confirmations that come and go. Neither is a state a tile can hold.
    { variant: "soft", tone: "info", class: "bg-neutral-subtle text-neutral" },
    { variant: "soft", tone: "success", class: "bg-neutral-subtle text-neutral" },
    { variant: "soft", tone: "warning", class: "bg-warning-subtle text-warning" },
    { variant: "soft", tone: "danger", class: "bg-danger-subtle text-danger" },
    { variant: "solid", tone: "neutral", class: "bg-primary text-primary-foreground" },
    { variant: "solid", tone: "info", class: "bg-primary text-primary-foreground" },
    { variant: "solid", tone: "success", class: "bg-primary text-primary-foreground" },
    // The ink flips with the mode (white on light amber-brown, near-black on dark yellow): 4.5:1 or more in every theme.
    { variant: "solid", tone: "warning", class: "bg-warning text-primary-foreground" },
    // Solid red is the emergency stop's alone, so a solid danger tile stays on its tint with a danger edge.
    { variant: "solid", tone: "danger", class: "bg-danger-subtle text-danger ring-1 ring-danger ring-inset" },
  ],
  defaultVariants: { variant: "outline", tone: "neutral", size: "md", shape: "square" },
})

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
  tone = "success",
  label,
}: {
  className?: string
  tone?: "success" | "warning" | "danger" | "neutral"
  label: string
}) {
  const fill = { success: "bg-foreground", warning: "bg-warning", danger: "bg-danger", neutral: "bg-muted-foreground" }[tone]
  return <span role="img" aria-label={label} className={cn("absolute -top-1 -right-1 size-3 rounded-full ring-2 ring-background", fill, className)} />
}
