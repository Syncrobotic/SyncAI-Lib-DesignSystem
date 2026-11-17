// @syncrobotic/alert-dialog v0.6.0 · update: npx shadcn add @syncrobotic/alert-dialog --overwrite
"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/syncrobotic/ui/button"

/**
 * Confirms an action that cannot be undone. It cannot be dismissed by clicking outside.
 * Name the consequence in the action label ("Delete 38 GB of video"), not "OK".
 */
export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-(--scrim) data-[state=open]:animate-fade-in data-[state=closed]:animate-disappear" />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-md -translate-y-1/2 flex-col gap-4",
          "rounded-lg bg-popover p-6 text-popover-foreground shadow-overlay ring-1 ring-border",
          "data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

export function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />
}

export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cn("text-lg font-bold", className)} {...props} />
}

export function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}

/** `destructive` gives the danger outline; the confirm is never solid red. */
export function AlertDialogAction({ className, destructive, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action> & { destructive?: boolean }) {
  return <AlertDialogPrimitive.Action className={cn(buttonVariants({ variant: destructive ? "destructive" : "primary" }), className)} {...props} />
}

export function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "secondary" }), className)} {...props} />
}
