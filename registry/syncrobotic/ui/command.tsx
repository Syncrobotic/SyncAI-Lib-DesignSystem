// @syncrobotic/command v0.7.0 · update: npx shadcn add @syncrobotic/command --overwrite
"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

/** A filterable list you drive from the keyboard: type to narrow, ↑↓ to move, Enter to run. Built on cmdk. */
export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive data-slot="command" className={cn("flex size-full flex-col overflow-hidden bg-popover text-popover-foreground", className)} {...props} />
  )
}

/**
 * The palette: opens from a search field or ⌘K / Ctrl+K, near the top of the screen so the list grows downwards
 * without the input moving. Appears and leaves like every overlay (--motion-base); Esc closes and returns focus.
 */
export function CommandDialog({
  open,
  onOpenChange,
  title = "Search",
  description = "Search pages, robots and actions",
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-(--scrim) data-[state=open]:animate-fade-in data-[state=closed]:animate-disappear" />
        <DialogPrimitive.Content
          data-slot="command-dialog"
          className={cn(
            "fixed inset-x-4 top-[12vh] z-50 mx-auto flex max-h-[70vh] max-w-xl flex-col overflow-hidden rounded-lg bg-popover shadow-overlay ring-1 ring-border",
            "data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          <Command className={className} {...props}>
            {children}
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** The text box, with a search icon and an optional element at the end (a scope, a shortcut hint). */
export function CommandInput({ className, end, ...props }: React.ComponentProps<typeof CommandPrimitive.Input> & { end?: React.ReactNode }) {
  return (
    <div data-slot="command-input" className="flex h-(--h-row) shrink-0 items-center gap-3 border-b border-border px-4">
      <Search aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        className={cn("h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground", className)}
        {...props}
      />
      {end}
    </div>
  )
}

export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List data-slot="command-list" className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-2", className)} {...props} />
}

/** Say what was searched and what to try instead, not just "No results". */
export function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" className={cn("px-3 py-8 text-center text-sm text-muted-foreground", className)} {...props} />
}

export function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

export function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn("-mx-2 my-2 h-px bg-border", className)} {...props} />
}

/** One result. The highlighted row is the one Enter runs; it follows the keyboard and the pointer. 44 px for touch. */
export function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "flex h-(--h-md) cursor-default items-center gap-3 rounded-sm px-3 text-sm outline-none select-none",
        "data-[selected=true]:bg-accent data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

/** A key hint at the end of a row or a field, e.g. ⌘K. */
export function CommandShortcut({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="command-shortcut"
      className={cn("ml-auto shrink-0 rounded-xs bg-muted px-1 py-0.5 font-mono text-xs whitespace-nowrap text-muted-foreground", className)}
      {...props}
    />
  )
}
