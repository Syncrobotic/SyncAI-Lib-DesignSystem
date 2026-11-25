// @syncrobotic/context-menu v0.36.0 · update: npx shadcn add @syncrobotic/context-menu --overwrite
"use client"

import * as React from "react"
import { ContextMenu as MenuPrimitive } from "radix-ui"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getLastInput, trackInputModality } from "@/registry/syncrobotic/lib/input-modality"

/**
 * The menu a right-click (or a long press on touch, or Shift+F10 / the Menu key on the focused area) opens where the
 * pointer is. It looks and moves exactly like DropdownMenu. It is a shortcut, never the only way: every action in it is
 * also on a visible control (a ⋯ button, a toolbar, the detail page), because nobody can see that a context menu exists.
 */
export const ContextMenu = MenuPrimitive.Root
/** The area that opens the menu. Use `asChild` on the row or card it belongs to; it should be focusable for Shift+F10. */
export function ContextMenuTrigger(props: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
}
export const ContextMenuGroup = MenuPrimitive.Group
export const ContextMenuRadioGroup = MenuPrimitive.RadioGroup
export const ContextMenuSub = MenuPrimitive.Sub

// How the menu was opened: keys or a pointer, the last one used anywhere on the page (the same as DropdownMenu). Opened by
// a right-click, the list shows no ring until a key moves in it; opened with Shift+F10 or the Menu key, the ring is there at once.
trackInputModality()

// The panel: identical to DropdownMenuContent, so the two menus cannot be told apart.
const panel =
  "group/menu z-50 min-w-48 overflow-hidden rounded-md bg-popover p-1 text-popover-foreground shadow-overlay ring-1 ring-border data-[state=open]:animate-appear data-[state=closed]:animate-disappear"

/**
 * Remembers whether the keyboard or the mouse moved last (data-nav), like DropdownMenuContent. It lives inside the portal,
 * which Radix renders only while the menu is open, so each opening starts from how this one was opened.
 */
function useNav(onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>, onPointerMove?: React.PointerEventHandler<HTMLDivElement>) {
  const [nav, setNav] = React.useState<"key" | "pointer">(getLastInput)
  return {
    "data-nav": nav,
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      setNav("key")
      onKeyDown?.(e)
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse") setNav("pointer")
      onPointerMove?.(e)
    },
  }
}

function Panel({ className, onKeyDown, onPointerMove, ...props }: React.ComponentProps<typeof MenuPrimitive.Content>) {
  const nav = useNav(onKeyDown, onPointerMove)
  return <MenuPrimitive.Content data-slot="context-menu-content" {...nav} className={cn(panel, className)} {...props} />
}

function SubPanel({ className, onKeyDown, onPointerMove, ...props }: React.ComponentProps<typeof MenuPrimitive.SubContent>) {
  const nav = useNav(onKeyDown, onPointerMove)
  return <MenuPrimitive.SubContent data-slot="context-menu-sub-content" {...nav} className={cn(panel, className)} {...props} />
}

/**
 * The list remembers whether the keyboard or the mouse moved last (data-nav): the highlighted item shows a ring only in
 * keyboard use, and keeps the calm fill under the pointer.
 */
export function ContextMenuContent(props: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <Panel {...props} />
    </MenuPrimitive.Portal>
  )
}

/** A submenu's panel. Keep submenus to one level and a few items: a long one is a dialog or a page. */
export function ContextMenuSubContent(props: React.ComponentProps<typeof MenuPrimitive.SubContent>) {
  return (
    <MenuPrimitive.Portal>
      <SubPanel {...props} />
    </MenuPrimitive.Portal>
  )
}

// The keyboard position is a 2 px ring inside the item, beside the fill: the fill alone is 1.2:1 and cannot be found.
// It shows only in keyboard use (data-nav on the panel), so an item under the pointer keeps the calm fill. Radix moves
// focus to the item on hover too, so the browser's own focus outline is off; this ring replaces it. Same as DropdownMenu.
const item =
  "relative flex h-(--h-md) cursor-default select-none items-center gap-2 rounded-sm px-3 text-sm outline-none transition-colors duration-(--motion-fast) ease-(--ease-standard) focus:bg-accent group-data-[nav=key]/menu:focus:outline-solid group-data-[nav=key]/menu:focus:outline-2 group-data-[nav=key]/menu:focus:-outline-offset-2 group-data-[nav=key]/menu:focus:outline-ring data-[disabled]:pointer-events-none data-[disabled]:text-disabled [&_svg]:size-4 [&_svg]:shrink-0"

/** `destructive` items use danger text; keep them last, after a separator. */
export function ContextMenuItem({ className, destructive, ...props }: React.ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean }) {
  return <MenuPrimitive.Item data-slot="context-menu-item" className={cn(item, destructive && "text-danger focus:bg-danger-subtle", className)} {...props} />
}

export function ContextMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem data-slot="context-menu-checkbox-item" className={cn(item, "pr-8", className)} {...props}>
      {children}
      <span className="absolute right-3 flex items-center">
        <MenuPrimitive.ItemIndicator>
          <Check aria-hidden="true" />
        </MenuPrimitive.ItemIndicator>
      </span>
    </MenuPrimitive.CheckboxItem>
  )
}

/** One of a ContextMenuRadioGroup. The chosen one is ticked, like a checkbox item: one mark for "selected" across the kit. */
export function ContextMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem data-slot="context-menu-radio-item" className={cn(item, "pr-8", className)} {...props}>
      {children}
      <span className="absolute right-3 flex items-center">
        <MenuPrimitive.ItemIndicator>
          <Check aria-hidden="true" />
        </MenuPrimitive.ItemIndicator>
      </span>
    </MenuPrimitive.RadioItem>
  )
}

/** Opens a submenu: → or Enter opens it, ← closes it. It stays filled while its submenu is open. */
export function ContextMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.SubTrigger>) {
  return (
    <MenuPrimitive.SubTrigger data-slot="context-menu-sub-trigger" className={cn(item, "data-[state=open]:bg-accent", className)} {...props}>
      {children}
      <ChevronRight aria-hidden="true" className="ml-auto text-muted-foreground" />
    </MenuPrimitive.SubTrigger>
  )
}

export function ContextMenuLabel({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("px-3 py-2 text-xs text-muted-foreground", className)} {...props} />
}

export function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}

export function ContextMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-auto text-xs text-muted-foreground", className)} {...props} />
}
