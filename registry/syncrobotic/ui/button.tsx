// @syncrobotic/button v0.55.0 · update: npx shadcn add @syncrobotic/button --overwrite
import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Spinner } from "@/registry/syncrobotic/ui/spinner"

/**
 * Buttons follow the colour rules: primary is neutral high contrast (white in dark mode),
 * destructive is a danger outline and text — solid red belongs to the emergency stop alone.
 */
export const buttonVariants = cva(
  "press inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium disabled:pointer-events-none disabled:not-aria-busy:bg-muted disabled:not-aria-busy:text-muted-foreground disabled:not-aria-busy:ring-transparent disabled:not-aria-busy:no-underline aria-disabled:not-aria-busy:bg-muted aria-disabled:not-aria-busy:text-muted-foreground aria-disabled:not-aria-busy:ring-transparent aria-disabled:not-aria-busy:no-underline [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Disabled keeps the outline and loses the ink: lighter than the enabled outline, never a filled grey that looks heavier.
        outline: "bg-transparent ring-1 ring-border ring-inset hover:bg-accent disabled:not-aria-busy:bg-transparent disabled:not-aria-busy:text-disabled disabled:not-aria-busy:ring-border aria-disabled:not-aria-busy:bg-transparent aria-disabled:not-aria-busy:text-disabled aria-disabled:not-aria-busy:ring-border",
        // Without a surface, disabled stays without one: solid disabled ink, no grey block that could read as selected.
        ghost: "hover:bg-accent hover:text-accent-foreground disabled:not-aria-busy:bg-transparent disabled:not-aria-busy:text-disabled aria-disabled:not-aria-busy:bg-transparent aria-disabled:not-aria-busy:text-disabled",
        destructive: "bg-transparent text-danger ring-1 ring-danger ring-inset hover:bg-danger-subtle disabled:not-aria-busy:bg-transparent disabled:not-aria-busy:text-disabled disabled:not-aria-busy:ring-border aria-disabled:not-aria-busy:bg-transparent aria-disabled:not-aria-busy:text-disabled aria-disabled:not-aria-busy:ring-border",
        // A link reads as a link by its underline, not by colour: blue is for a process someone is waiting on.
        link: "text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground disabled:not-aria-busy:bg-transparent disabled:not-aria-busy:text-disabled aria-disabled:not-aria-busy:bg-transparent aria-disabled:not-aria-busy:text-disabled",
      },
      size: {
        sm: "h-(--h-sm) px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        md: "h-(--h-md) px-4 text-sm",
        lg: "h-(--h-lg) px-6 text-base",
        icon: "size-(--h-md)",
        "icon-sm": "size-(--h-sm) [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a link) with button styles. */
    asChild?: boolean
    /** Disables the button (no double submit) and shows a spinner after 300 ms, so quick actions never flash. It keeps its look:
     *  busy is not unavailable. */
    loading?: boolean
  }

/**
 * A control that does one thing now, labelled with a verb: primary, secondary, outline, ghost, destructive and
 * link; 36, 44 and 48 px; loading state with a delayed spinner. An icon-only button (`size="icon"`) needs an
 * `aria-label` and a Tooltip. `aria-disabled="true"` looks disabled but stays focusable, for a reason in a tooltip
 * (permission-gate); its handler must refuse the click.
 */
export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner className="size-4" />}
          {children}
        </>
      )}
    </Comp>
  )
}
