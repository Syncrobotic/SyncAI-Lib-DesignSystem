// @syncrobotic/button v0.8.0 · update: npx shadcn add @syncrobotic/button --overwrite
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
  "press inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "bg-transparent ring-1 ring-border ring-inset hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-transparent text-danger ring-1 ring-danger ring-inset hover:bg-danger-subtle",
        // A link reads as a link by its underline, not by colour: blue means in progress.
        link: "text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground",
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
    /** Disables the button and shows a spinner after 300 ms, so quick actions never flash. */
    loading?: boolean
  }

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
