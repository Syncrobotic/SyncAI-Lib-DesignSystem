// @syncrobotic/dropdown-menu v0.32.0 · update: npx shadcn add @syncrobotic/dropdown-menu --overwrite
"use client"

import * as React from "react"
import { DropdownMenu as MenuPrimitive } from "radix-ui"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export const DropdownMenu = MenuPrimitive.Root
/** The button that opens the menu. With `asChild`, a kit child (Button) keeps its own data-slot. */
export function DropdownMenuTrigger(props: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}
export const DropdownMenuGroup = MenuPrimitive.Group
/** One of several, like a segmented control folded into a menu: a check beside the chosen item. */
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup

// How the list was opened: keys or a pointer, the last one used anywhere on the page. Opened by a click, the list shows no
// ring until a key moves in it; opened from the keyboard, the ring is there at once.
let lastInput: "key" | "pointer" = "pointer"
if (typeof document !== "undefined") {
  document.addEventListener("keydown", () => (lastInput = "key"), true)
  document.addEventListener("pointerdown", () => (lastInput = "pointer"), true)
}

/**
 * The list remembers whether the keyboard or the mouse moved last (data-nav): the highlighted item shows a ring only in
 * keyboard use, and keeps the calm fill under the pointer.
 */
export function DropdownMenuContent({ className, sideOffset = 4, onKeyDown, onPointerMove, ...props }: React.ComponentProps<typeof MenuPrimitive.Content>) {
  const [nav, setNav] = React.useState<"key" | "pointer">(() => lastInput)
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-slot="dropdown-menu-content"
        data-nav={nav}
        sideOffset={sideOffset}
        onKeyDown={(e) => {
          setNav("key")
          onKeyDown?.(e)
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") setNav("pointer")
          onPointerMove?.(e)
        }}
        className={cn(
          "group/menu z-50 min-w-48 overflow-hidden rounded-md bg-popover p-1 text-popover-foreground shadow-overlay ring-1 ring-border data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  )
}

// The keyboard position is a 2 px ring inside the item, beside the fill: the fill alone is 1.2:1 and cannot be found.
// It shows only in keyboard use (data-nav on the content), so an item under the pointer keeps the calm fill. Radix moves
// focus to the item on hover too, so the browser's own focus outline is off; this ring replaces it.
const item =
  "relative flex h-(--h-md) cursor-default select-none items-center gap-2 rounded-sm px-3 text-sm outline-none transition-colors duration-(--motion-fast) ease-(--ease-standard) focus:bg-accent group-data-[nav=key]/menu:focus:outline-solid group-data-[nav=key]/menu:focus:outline-2 group-data-[nav=key]/menu:focus:-outline-offset-2 group-data-[nav=key]/menu:focus:outline-ring data-[disabled]:pointer-events-none data-[disabled]:text-disabled [&_svg]:size-4 [&_svg]:shrink-0"

/** `destructive` items use danger text; keep them last, after a separator. */
export function DropdownMenuItem({ className, destructive, ...props }: React.ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean }) {
  return <MenuPrimitive.Item data-slot="dropdown-menu-item" className={cn(item, destructive && "text-danger focus:bg-danger-subtle", className)} {...props} />
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem className={cn(item, "pr-8", className)} {...props}>
      {children}
      <span className="absolute right-3 flex items-center">
        <MenuPrimitive.ItemIndicator>
          <Check aria-hidden="true" />
        </MenuPrimitive.ItemIndicator>
      </span>
    </MenuPrimitive.CheckboxItem>
  )
}

export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem className={cn(item, "pr-8", className)} {...props}>
      {children}
      <span className="absolute right-3 flex items-center">
        <MenuPrimitive.ItemIndicator>
          <Check aria-hidden="true" />
        </MenuPrimitive.ItemIndicator>
      </span>
    </MenuPrimitive.RadioItem>
  )
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("px-3 py-2 text-xs text-muted-foreground", className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}

export function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-auto text-xs text-muted-foreground", className)} {...props} />
}
