import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { toast, Toaster } from "@/registry/syncrobotic/ui/toast"

afterEach(() => {
  act(() => toast.clear())
  cleanup()
})

const state = (title: string) => screen.queryByText(title)?.closest("[data-slot=toast]")?.getAttribute("data-state") ?? "gone"

const page = () =>
  render(
    <>
      <dialog open>
        <button type="button">Rename</button>
      </dialog>
      <Toaster />
    </>,
  )

// Issue #311: an open toast took Escape for itself, so the native dialog the user was in stayed open.
describe("Toast with a native dialog open", () => {
  it("lets Escape close the dialog and leaves the toast", async () => {
    page()
    act(() => void toast({ title: "Saved" }))
    const dialog = document.querySelector("dialog")!
    let cancelled = 0
    dialog.addEventListener("cancel", () => cancelled++)
    act(() => screen.getByRole("button", { name: "Rename" }).focus())
    await act(async () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }))
    expect(cancelled).toBe(1)
    expect(dialog.open).toBe(false)
    expect(state("Saved")).toBe("open")
  })

  it("keeps a dialog open that refuses to close", async () => {
    page()
    act(() => void toast({ title: "Saved" }))
    document.querySelector("dialog")!.addEventListener("cancel", (e) => e.preventDefault())
    act(() => screen.getByRole("button", { name: "Rename" }).focus())
    await act(async () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }))
    expect(document.querySelector("dialog")!.open).toBe(true)
    expect(state("Saved")).toBe("open")
  })

  it("still dismisses the toast on Escape when focus is outside any dialog", async () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <Toaster />
      </>,
    )
    act(() => void toast({ title: "Saved" }))
    act(() => screen.getByRole("button", { name: "Elsewhere" }).focus())
    await act(async () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }))
    expect(state("Saved")).not.toBe("open")
  })
})
