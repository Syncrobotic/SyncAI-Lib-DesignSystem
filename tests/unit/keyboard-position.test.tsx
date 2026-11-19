import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { TimePicker } from "@/registry/syncrobotic/ui/time-picker"
import { CommandDialog, CommandInput, CommandItem, CommandList } from "@/registry/syncrobotic/ui/command"

afterEach(cleanup)

// Radix moves focus on close in a timeout.
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })

describe("TimePicker list", () => {
  const open = async (props: Partial<React.ComponentProps<typeof TimePicker>> = {}) => {
    render(<TimePicker aria-label="Start time" step={60} min="08:00" max="12:00" {...props} />)
    fireEvent.click(screen.getByRole("button", { name: /Start time/ }))
    await flush()
    return screen.getAllByRole("option")
  }
  const tabbable = (options: HTMLElement[]) => options.filter((o) => o.tabIndex === 0)

  it("is one Tab stop, on the picked slot", async () => {
    const options = await open({ value: "10:00" })
    expect(options).toHaveLength(5)
    expect(tabbable(options).map((o) => o.textContent)).toEqual(["10:00"])
  })

  it("starts on the first free slot when nothing is picked", async () => {
    const options = await open({ unavailable: ["08:00"] })
    expect(tabbable(options).map((o) => o.textContent)).toEqual(["09:00"])
  })

  it("moves with the arrows, Home, End and Page keys, skipping taken slots", async () => {
    const options = await open({ value: "08:00", unavailable: ["09:00"] })
    const list = screen.getByRole("listbox")
    const at = () => (document.activeElement as HTMLElement).textContent
    options[0].focus()
    fireEvent.keyDown(list, { key: "ArrowDown" })
    expect(at()).toBe("10:00")
    fireEvent.keyDown(list, { key: "ArrowUp" })
    expect(at()).toBe("08:00")
    fireEvent.keyDown(list, { key: "End" })
    expect(at()).toBe("12:00")
    fireEvent.keyDown(list, { key: "Home" })
    expect(at()).toBe("08:00")
    fireEvent.keyDown(list, { key: "PageDown" })
    expect(at()).toBe("12:00")
    fireEvent.keyDown(list, { key: "PageUp" })
    expect(at()).toBe("08:00")
    // Still one stop, and it follows focus.
    fireEvent.keyDown(list, { key: "ArrowDown" })
    expect(tabbable(screen.getAllByRole("option")).map((o) => o.textContent)).toEqual(["10:00"])
  })

  it("names its panel after the field", async () => {
    await open()
    const dialog = screen.getByRole("dialog")
    const trigger = screen.getByRole("button", { name: /Start time/ })
    expect(dialog.getAttribute("aria-labelledby")).toBe(trigger.id)
  })
})

describe("CommandDialog focus", () => {
  function Palette() {
    const [open, setOpen] = React.useState(false)
    React.useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) setOpen((o) => !o)
      }
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }, [])
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Search
        </button>
        <button type="button">Elsewhere</button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput autoFocus placeholder="Search robots" />
          <CommandList>
            <CommandItem>Patrol dog 7F3A</CommandItem>
          </CommandList>
        </CommandDialog>
      </>
    )
  }

  it("returns focus to the button that opened it", async () => {
    render(<Palette />)
    const search = screen.getByRole("button", { name: "Search" })
    search.focus()
    fireEvent.click(search)
    await flush()
    expect(document.activeElement).toBe(screen.getByPlaceholderText("Search robots"))
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await flush()
    expect(screen.queryByPlaceholderText("Search robots")).toBeNull()
    expect(document.activeElement).toBe(search)
  })

  it("returns focus to what had it when ⌘K opened it", async () => {
    render(<Palette />)
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" })
    elsewhere.focus()
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await flush()
    expect(screen.getByPlaceholderText("Search robots")).toBeTruthy()
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await flush()
    expect(document.activeElement).toBe(elsewhere)
  })

  it("rings the highlighted row only in keyboard use", async () => {
    render(<Palette />)
    fireEvent.keyDown(window, { key: "k", ctrlKey: true })
    await flush()
    const root = document.querySelector<HTMLElement>("[data-slot=command]")!
    expect(root.dataset.nav).toBe("key")
    fireEvent.pointerMove(root, { pointerType: "mouse" })
    expect(root.dataset.nav).toBe("pointer")
    fireEvent.keyDown(screen.getByPlaceholderText("Search robots"), { key: "ArrowDown" })
    expect(root.dataset.nav).toBe("key")
  })
})
