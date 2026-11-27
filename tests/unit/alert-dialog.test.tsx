import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
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

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function Confirm({ onAction, onOpenChange }: { onAction?: () => void; onOpenChange?: (open: boolean) => void }) {
  return (
    <AlertDialog onOpenChange={onOpenChange}>
      <AlertDialogTrigger>Delete recordings</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete 38 GB of video?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction destructive onClick={onAction}>
            Delete 38 GB of video
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const open = () => act(() => fireEvent.click(screen.getByRole("button", { name: "Delete recordings" })))

describe("AlertDialog", () => {
  it("opens an alertdialog named by its title and described by its description", () => {
    render(<Confirm />)
    expect(screen.queryByRole("alertdialog")).toBeNull()
    open()
    const dialog = screen.getByRole("alertdialog", { name: "Delete 38 GB of video?" })
    expect(dialog.getAttribute("data-slot")).toBe("alert-dialog-content")
    const describedBy = dialog.getAttribute("aria-describedby")!
    expect(document.getElementById(describedBy)?.textContent).toBe("This cannot be undone.")
  })

  it("moves focus into the dialog, onto Cancel, and returns it to the trigger on Esc", () => {
    vi.useFakeTimers()
    render(<Confirm />)
    const trigger = screen.getByRole("button", { name: "Delete recordings" })
    act(() => trigger.focus())
    open()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Keep" }))
    act(() => void fireEvent.keyDown(document.activeElement!, { key: "Escape" }))
    expect(screen.queryByRole("alertdialog")).toBeNull()
    // Radix hands focus back on the next tick after the content unmounts.
    act(() => void vi.runAllTimers())
    expect(document.activeElement).toBe(trigger)
  })

  it("closes on Cancel without running the action", () => {
    const onAction = vi.fn()
    const onOpenChange = vi.fn()
    render(<Confirm onAction={onAction} onOpenChange={onOpenChange} />)
    open()
    act(() => fireEvent.click(screen.getByRole("button", { name: "Keep" })))
    expect(screen.queryByRole("alertdialog")).toBeNull()
    expect(onAction).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("runs the action and closes", () => {
    const onAction = vi.fn()
    render(<Confirm onAction={onAction} />)
    open()
    act(() => fireEvent.click(screen.getByRole("button", { name: "Delete 38 GB of video" })))
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("alertdialog")).toBeNull()
  })

  it("stays open when the overlay is clicked", () => {
    render(<Confirm />)
    open()
    const overlay = document.querySelector(".bg-\\(--scrim\\)") as HTMLElement
    expect(overlay.getAttribute("data-state")).toBe("open")
    act(() => fireEvent.pointerDown(overlay))
    expect(screen.getByRole("alertdialog")).toBeTruthy()
  })
})
