"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"

// The Portal's ConfirmDialog props on the kit's AlertDialog, so its call sites keep working while the look moves to the
// kit. The words are required: the confirm names the consequence ("Revoke key"), never "Confirm".
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  isLoading = false,
  confirmDisabled = false,
  confirmIcon,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  variant?: "default" | "destructive"
  isLoading?: boolean
  confirmDisabled?: boolean
  confirmIcon?: React.ReactNode
  onConfirm: () => void
  children?: React.ReactNode
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            {/* The danger outline for a destructive confirm: solid red is the emergency stop's alone. */}
            <Button variant={variant === "destructive" ? "destructive" : "primary"} loading={isLoading} disabled={confirmDisabled} onClick={onConfirm}>
              {!isLoading && confirmIcon}
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
