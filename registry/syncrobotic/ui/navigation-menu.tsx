// @syncrobotic/navigation-menu v0.10.0 · update: npx shadcn add @syncrobotic/navigation-menu --overwrite
"use client"

import * as React from "react"
import { NavigationMenu as NavPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A site's top-level navigation: links, and triggers that open a panel of links.
 * For an app's own sections use the app shell's sidebar; for actions use DropdownMenu.
 */
export function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavPrimitive.Root> & {
  /** One shared panel that resizes between menus (default). false draws each panel under its own trigger. */
  viewport?: boolean
}) {
  return (
    <NavPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn("group/navigation-menu relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavPrimitive.Root>
  )
}

export function NavigationMenuList({ className, ...props }: React.ComponentProps<typeof NavPrimitive.List>) {
  return <NavPrimitive.List data-slot="navigation-menu-list" className={cn("flex flex-1 list-none items-center justify-center gap-1", className)} {...props} />
}

export function NavigationMenuItem({ className, ...props }: React.ComponentProps<typeof NavPrimitive.Item>) {
  return <NavPrimitive.Item data-slot="navigation-menu-item" className={cn("relative", className)} {...props} />
}

const itemStyle = cn(
  "inline-flex h-(--h-sm) w-max items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium text-muted-foreground outline-none",
  "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-muted hover:text-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:text-disabled",
  "data-[state=open]:bg-muted data-[state=open]:text-foreground data-active:text-foreground [&_svg]:size-4",
)
/** The look of a top-level item, for plain links next to triggers. */
export const navigationMenuTriggerStyle = () => itemStyle

export function NavigationMenuTrigger({ className, children, ...props }: React.ComponentProps<typeof NavPrimitive.Trigger>) {
  return (
    <NavPrimitive.Trigger data-slot="navigation-menu-trigger" className={cn("press group", itemStyle, className)} {...props}>
      {children}
      <ChevronDown
        aria-hidden="true"
        className="transition-transform duration-(--motion-fast) ease-(--ease-standard) group-data-[state=open]:rotate-180 motion-reduce:transition-none"
      />
    </NavPrimitive.Trigger>
  )
}

export function NavigationMenuContent({ className, ...props }: React.ComponentProps<typeof NavPrimitive.Content>) {
  return (
    <NavPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "top-0 left-0 w-full p-2 md:absolute md:w-auto",
        "data-[motion^=from-]:animate-appear data-[motion^=to-]:animate-disappear",
        // Without the shared viewport each panel is its own popover.
        "group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-2 group-data-[viewport=false]/navigation-menu:rounded-md",
        "group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:shadow-overlay group-data-[viewport=false]/navigation-menu:ring-1 group-data-[viewport=false]/navigation-menu:ring-border",
        "group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-appear group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-disappear",
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({ className, ...props }: React.ComponentProps<typeof NavPrimitive.Viewport>) {
  return (
    <div className="absolute top-full left-0 isolate z-50 flex justify-center">
      <NavPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative mt-2 h-(--radix-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-md bg-popover text-popover-foreground shadow-overlay ring-1 ring-border md:w-(--radix-navigation-menu-viewport-width)",
          "transition-[width,height] duration-(--motion-base) ease-(--ease-standard) motion-reduce:transition-none",
          "data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          className,
        )}
        {...props}
      />
    </div>
  )
}

/** A link in a panel or at the top level. `active` marks the current page. */
export function NavigationMenuLink({ className, ...props }: React.ComponentProps<typeof NavPrimitive.Link>) {
  return (
    <NavPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex flex-col gap-1 rounded-xs p-3 text-sm outline-none",
        "transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-active:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

/** A panel link with an icon, a title and one line of description. */
export function NavigationMenuCard({
  icon,
  title,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<typeof NavPrimitive.Link>, "title"> & { icon?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <NavigationMenuLink className={cn("flex-row items-start gap-3", className)} {...props}>
      {icon && <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-muted [&_svg]:size-4">{icon}</span>}
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-medium text-foreground">{title}</span>
        {description && <span className="line-clamp-2 text-xs text-muted-foreground">{description}</span>}
      </span>
    </NavigationMenuLink>
  )
}

export const NavigationMenuIndicator = NavPrimitive.Indicator
