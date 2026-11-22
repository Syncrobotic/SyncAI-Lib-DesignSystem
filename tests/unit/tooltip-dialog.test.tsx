import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

afterEach(cleanup)
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/syncrobotic/ui/tooltip"

// Issue #286: in a native <dialog>, a tooltip opened by focus took Escape for itself and the dialog stayed open.
describe("Tooltip in a native dialog", () => {
  it("lets Escape close the dialog", async () => {
    render(
      <dialog open>
        <Tooltip open>
          <TooltipTrigger>History</TooltipTrigger>
          <TooltipContent>Show history</TooltipContent>
        </Tooltip>
      </dialog>,
    )
    const dialog = document.querySelector("dialog")!
    const trigger = screen.getByRole("button", { name: /History/ })
    act(() => trigger.focus())
    let cancelled = 0
    dialog.addEventListener("cancel", () => cancelled++)
    await act(async () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }))
    expect(cancelled).toBe(1)
    expect(dialog.open).toBe(false)
  })

  it("keeps a dialog open that refuses to close", async () => {
    render(
      <dialog open>
        <Tooltip open>
          <TooltipTrigger>History</TooltipTrigger>
          <TooltipContent>Show history</TooltipContent>
        </Tooltip>
      </dialog>,
    )
    document.querySelector("dialog")!.addEventListener("cancel", (e) => e.preventDefault())
    act(() => screen.getByRole("button", { name: /History/ }).focus())
    await act(async () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }))
    expect(document.querySelector("dialog")!.open).toBe(true)
  })
})
