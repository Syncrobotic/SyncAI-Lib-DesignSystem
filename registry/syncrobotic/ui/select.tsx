// @syncrobotic/select v0.10.0 · update: npx shadcn add @syncrobotic/select --overwrite
"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useField } from "@/registry/syncrobotic/ui/field"

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

/** Inside a Field, the trigger takes the field's id, note and error, so `<Field label><Select>…</Select></Field>` just works. */
export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  const field = useField()
  return (
    <SelectPrimitive.Trigger
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid}
      data-slot="select-trigger"
      className={cn(
        "flex h-(--h-md) w-full items-center justify-between gap-2 rounded-sm bg-card px-3 text-base ring-1 ring-input ring-inset",
        "transition-shadow duration-(--motion-fast) ease-(--ease-standard)",
        "data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:ring-2 aria-invalid:ring-danger",
        "[&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-32 overflow-hidden rounded-md bg-popover text-popover-foreground shadow-overlay ring-1 ring-border data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          position === "popper" && "w-(--radix-select-trigger-width)",
          className,
        )}
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-3 py-2 text-xs text-muted-foreground", className)} {...props} />
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex h-(--h-md) w-full cursor-default select-none items-center gap-2 rounded-sm pr-8 pl-3 text-sm outline-none",
        "focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:text-disabled",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-3 flex items-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
}
