// @syncrobotic/dialog v0.53.0 · update: npx shadcn add @syncrobotic/dialog --overwrite
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A short decision or form that needs an answer before you go on, in a panel over the page. Focus stays inside until it
 * closes (Escape closes it), then returns to what opened it; for a longer task beside the page use a Sheet.
 */
export const Dialog = DialogPrimitive.Root
export function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}
export function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-(--scrim) data-[state=open]:animate-fade-in data-[state=closed]:animate-disappear", className)}
      {...props}
    />
  )
}

export type DialogLabels = {
  /** The close button's name for screen readers. */
  close: string
}

export const defaultDialogLabels: DialogLabels = { close: "Close" }

/** Centered, radius 20 (lg). On phones prefer Sheet; a dialog is for a short decision. */
export function DialogContent({
  className,
  children,
  closeLabel,
  showClose = true,
  labels,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  /** Same as `labels.close`, and wins over it. */
  closeLabel?: string
  showClose?: boolean
  /** The words it says, to translate them. */
  labels?: Partial<DialogLabels>
}) {
  const l = { ...defaultDialogLabels, ...labels }
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-md -translate-y-1/2 flex-col gap-4",
          "rounded-lg bg-popover p-6 text-popover-foreground shadow-overlay ring-1 ring-border",
          "data-[state=open]:animate-appear data-[state=closed]:animate-disappear",
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            aria-label={closeLabel ?? l.close}
            className="press absolute top-2 right-2 flex size-(--h-md) items-center justify-center rounded-sm text-muted-foreground hover:bg-accent"
          >
            <X aria-hidden="true" className="size-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2 pr-8", className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg font-bold", className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}
