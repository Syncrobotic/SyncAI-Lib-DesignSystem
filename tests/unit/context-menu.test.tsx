import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/syncrobotic/ui/context-menu"

afterEach(cleanup)

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10))
  })

function RobotRow({ onPause = () => {}, onRemove = () => {} }: { onPause?: () => void; onRemove?: () => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div data-testid="row">
          <a href="#robots/7F3A">Patrol dog 7F3A</a>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Patrol dog 7F3A</ContextMenuLabel>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem>Assign mission…</ContextMenuItem>
        <ContextMenuItem onSelect={onPause}>Pause</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive onSelect={onRemove}>
          Remove from fleet
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const open = async (el: HTMLElement = screen.getByTestId("row")) => {
  fireEvent.contextMenu(el, { clientX: 40, clientY: 40 })
  await flush()
}

describe("ContextMenu", () => {
  it("opens on right-click as a menu of menuitems, the destructive one in danger text", async () => {
    render(<RobotRow />)
    expect(screen.queryByRole("menu")).toBeNull()
    await open()
    expect(screen.getByRole("menu")).toBeTruthy()
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Open", "Assign mission…", "Pause", "Remove from fleet"])
    expect(screen.getByRole("menuitem", { name: "Remove from fleet" }).className).toContain("text-danger")
    expect(screen.getByRole("separator")).toBeTruthy()
  })

  it("opens from a contextmenu event raised inside the trigger (Shift+F10 or the Menu key on its link)", async () => {
    render(<RobotRow />)
    await open(screen.getByRole("link", { name: "Patrol dog 7F3A" }))
    expect(screen.getByRole("menu")).toBeTruthy()
  })

  it("runs an item and closes; Esc closes without running", async () => {
    const onPause = vi.fn()
    render(<RobotRow onPause={onPause} />)
    await open()
    fireEvent.click(screen.getByRole("menuitem", { name: "Pause" }))
    await flush()
    expect(onPause).toHaveBeenCalledOnce()
    expect(screen.queryByRole("menu")).toBeNull()

    await open()
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" })
    await flush()
    expect(screen.queryByRole("menu")).toBeNull()
    expect(onPause).toHaveBeenCalledOnce()
  })

  it("shows the keyboard ring only after a key moves in the list", async () => {
    render(<RobotRow />)
    const row = screen.getByTestId("row")
    // A right-click is a pointer press first.
    fireEvent.pointerDown(row, { button: 2, pointerType: "mouse" })
    await open(row)
    const menu = screen.getByRole("menu")
    expect(menu.getAttribute("data-nav")).toBe("pointer")
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    expect(menu.getAttribute("data-nav")).toBe("key")
  })

  it("starts each opening from how it was opened: Shift+F10 shows the ring at once, a later right-click does not", async () => {
    render(<RobotRow />)
    const row = screen.getByTestId("row")
    fireEvent.keyDown(row, { key: "F10", shiftKey: true })
    await open(row)
    expect(screen.getByRole("menu").getAttribute("data-nav")).toBe("key")
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" })
    await flush()
    fireEvent.pointerDown(row, { button: 2, pointerType: "mouse" })
    await open(row)
    expect(screen.getByRole("menu").getAttribute("data-nav")).toBe("pointer")
  })

  it("ticks checkbox and radio items with aria-checked", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div data-testid="row">Events</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked>Battery</ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={false}>Firmware</ContextMenuCheckboxItem>
          <ContextMenuRadioGroup value="site">
            <ContextMenuRadioItem value="robot">Robot</ContextMenuRadioItem>
            <ContextMenuRadioItem value="site">Site</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>CSV</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    )
    await open()
    expect(screen.getByRole("menuitemcheckbox", { name: "Battery" }).getAttribute("aria-checked")).toBe("true")
    expect(screen.getByRole("menuitemcheckbox", { name: "Firmware" }).getAttribute("aria-checked")).toBe("false")
    expect(screen.getByRole("menuitemradio", { name: "Site" }).getAttribute("aria-checked")).toBe("true")
    const sub = screen.getByRole("menuitem", { name: "Export" })
    expect(sub.getAttribute("aria-haspopup")).toBe("menu")
  })
})
