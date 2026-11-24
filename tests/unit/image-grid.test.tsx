import * as React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ImageGrid, type ImageGridItem } from "@/registry/syncrobotic/ui/image-grid"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/registry/syncrobotic/ui/sheet"

afterEach(cleanup)

const items: ImageGridItem[] = ["a", "b", "c"].map((id, i) => ({ id, src: `data:image/gif;base64,R0lGODlhAQABAAAAACw=#${id}`, alt: `Frame ${i + 1}`, name: `${id}.jpg` }))

describe("ImageGrid", () => {
  it("loads lazily, and a skeleton stands in while loading", () => {
    const { rerender } = render(<ImageGrid label="Frames" items={items} />)
    for (const img of screen.getAllByRole("img")) expect(img.getAttribute("loading")).toBe("lazy")
    rerender(<ImageGrid label="Frames" items={[]} loading loadingCount={5} />)
    expect(screen.getByRole("status").textContent).toBe("Loading pictures")
    expect(screen.getByRole("list", { name: "Frames" }).children).toHaveLength(5)
  })

  it("picks one as a radio group: one Tab stop, the arrows move and pick, picking again keeps it", () => {
    const one = vi.fn()
    render(<ImageGrid label="Frames" items={items} selection="single" onSelectedChange={one} />)
    expect(screen.getByRole("radiogroup", { name: "Frames" })).toBeTruthy()
    const radios = screen.getAllByRole("radio")
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1])
    fireEvent.click(screen.getByRole("radio", { name: "Frame 1" }))
    fireEvent.click(screen.getByRole("radio", { name: "Frame 2" }))
    expect(one).toHaveBeenLastCalledWith(["b"])
    expect(screen.getByRole("radio", { name: "Frame 2" }).getAttribute("aria-checked")).toBe("true")
    expect(screen.getByRole("radio", { name: "Frame 1" }).getAttribute("aria-checked")).toBe("false")
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([-1, 0, -1])
    one.mockClear()
    fireEvent.click(screen.getByRole("radio", { name: "Frame 2" }))
    expect(one).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByRole("radio", { name: "Frame 2" }), { key: "ArrowRight" })
    expect(one).toHaveBeenLastCalledWith(["c"])
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Frame 3" }))
    fireEvent.keyDown(screen.getByRole("radio", { name: "Frame 3" }), { key: "Home" })
    expect(one).toHaveBeenLastCalledWith(["a"])
  })

  it("picks many with toggles (aria-pressed)", () => {
    const many = vi.fn()
    render(<ImageGrid label="Frames" items={items} selection="multiple" onSelectedChange={many} />)
    fireEvent.click(screen.getByRole("button", { name: "Frame 1" }))
    fireEvent.click(screen.getByRole("button", { name: "Frame 3" }))
    expect(many).toHaveBeenLastCalledWith(["a", "c"])
    expect(screen.getByRole("button", { name: "Frame 3" }).getAttribute("aria-pressed")).toBe("true")
  })

  it("shows the file name when a picture cannot load", () => {
    render(<ImageGrid label="Frames" items={items} />)
    fireEvent.error(screen.getByRole("img", { name: "Frame 2" }))
    expect(screen.getByRole("button", { name: "Could not load: b.jpg" })).toBeTruthy()
  })

  it("keeps a hidden picture unloaded until someone asks", () => {
    const seen = vi.fn()
    render(<ImageGrid label="Frames" items={items.map((x) => (x.id === "b" ? { ...x, restricted: true, reason: "T2 · faces" } : x))} onReveal={seen} />)
    expect(screen.queryByRole("img", { name: "Frame 2" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Show picture/ }))
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }))
    expect(screen.getByRole("img", { name: "Frame 2" })).toBeTruthy()
  })

  it("opens a lightbox that says where it is, moves with the arrows and returns focus to the last picture's tile", async () => {
    render(<ImageGrid label="Frames" items={items} />)
    const first = screen.getByRole("button", { name: "Frame 1" })
    first.focus()
    fireEvent.click(first)
    const dialog = screen.getByRole("dialog")
    expect(dialog.textContent).toContain("1 of 3")
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "ArrowRight" })
    expect(screen.getByRole("dialog").textContent).toContain("2 of 3")
    expect(screen.getByRole("heading", { name: "b.jpg" })).toBeTruthy()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Frame 2" }))
  })

  it("with onOpen, a tile calls it with the item and its index instead of opening the lightbox", () => {
    const onOpen = vi.fn()
    render(<ImageGrid label="Frames" items={items} onOpen={onOpen} />)
    const second = screen.getByRole("button", { name: "Frame 2" })
    expect(second.getAttribute("aria-haspopup")).toBe("dialog")
    fireEvent.click(second)
    expect(onOpen).toHaveBeenCalledWith(items[1], 1)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("with onOpen, tiles open even with the lightbox off, and the corner button calls it while picking", () => {
    const onOpen = vi.fn()
    const { rerender } = render(<ImageGrid label="Frames" items={items} lightbox={false} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole("button", { name: "Frame 3" }))
    expect(onOpen).toHaveBeenLastCalledWith(items[2], 2)
    rerender(<ImageGrid label="Frames" items={items} selection="multiple" onOpen={onOpen} />)
    fireEvent.click(screen.getByRole("button", { name: "Frame 1" }))
    expect(onOpen).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getAllByRole("button", { name: /a\.jpg/ })[0])
    expect(onOpen).toHaveBeenLastCalledWith(items[0], 0)
  })

  it("with onOpen, the app's own dialog returns focus to the tile it was opened from, as documented", async () => {
    function App() {
      const [open, setOpen] = React.useState<ImageGridItem | null>(null)
      const opener = React.useRef<HTMLElement | null>(null)
      return (
        <>
          <ImageGrid
            label="Frames"
            items={items}
            onOpen={(item) => {
              opener.current = document.activeElement as HTMLElement | null
              setOpen(item)
            }}
          />
          <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
            <SheetContent
              onCloseAutoFocus={(e) => {
                e.preventDefault()
                opener.current?.focus()
              }}
            >
              <SheetTitle>{open?.name}</SheetTitle>
              <SheetDescription>Details</SheetDescription>
            </SheetContent>
          </Sheet>
        </>
      )
    }
    render(<App />)
    const second = screen.getByRole("button", { name: "Frame 2" })
    second.focus()
    fireEvent.click(second)
    expect(screen.getByRole("dialog").textContent).toContain("b.jpg")
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(document.activeElement).toBe(second)
  })
})
