// @syncrobotic/dialog-confirm-destructive v0.53.0 · update: npx shadcn add @syncrobotic/dialog-confirm-destructive --overwrite
"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/syncrobotic/ui/alert-dialog"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"

/**
 * A dialog for something that cannot be undone: what is lost, who it affects, and the name typed to confirm. The title
 * is the question; typing the name is for the worst cases. The safe choice is focused first; the destructive one names
 * the action and stays an outline, never solid red.
 */
export function DialogConfirmDestructive({
  name = "Taoyuan plant, floor 2",
  affected = ["Patrol dog 7F3A", "Patrol dog 9E37", "Patrol dog 1715"],
  onConfirm,
  defaultOpen,
  focusOnOpen = true,
}: {
  /** The thing to delete, typed to confirm. */
  name?: string
  affected?: string[]
  onConfirm?: () => void
  defaultOpen?: boolean
  /** false for previews that open on load, so the page around them keeps its focus. */
  focusOnOpen?: boolean
}) {
  const [typed, setTyped] = React.useState("")
  const match = typed.trim() === name
  return (
    <div className="flex min-h-[var(--app-shell-height,100dvh)] items-center justify-center bg-background p-6">
      <AlertDialog defaultOpen={defaultOpen} onOpenChange={() => setTyped("")}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 aria-hidden="true" />
            Delete map
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onOpenAutoFocus={focusOnOpen ? undefined : (e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the map {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {affected.length} robots patrol on this map. They finish their current checkpoint, stop, and wait until you give them another map. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="flex flex-col gap-1 rounded-sm bg-muted p-3 text-sm">
            {affected.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <Field label={`Type ${name} to confirm`}>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep map</AlertDialogCancel>
            <AlertDialogAction destructive disabled={!match} onClick={onConfirm}>
              Delete map
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
