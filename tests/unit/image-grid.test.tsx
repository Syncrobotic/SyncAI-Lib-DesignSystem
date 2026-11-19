import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ImageGrid, type ImageGridItem } from "@/registry/syncrobotic/ui/image-grid"

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

  it("picks one at a time, or many, with aria-pressed", () => {
    const one = vi.fn()
    const { rerender } = render(<ImageGrid label="Frames" items={items} selection="single" onSelectedChange={one} />)
    fireEvent.click(screen.getByRole("button", { name: "Frame 1" }))
    fireEvent.click(screen.getByRole("button", { name: "Frame 2" }))
    expect(one).toHaveBeenLastCalledWith(["b"])
    expect(screen.getByRole("button", { name: "Frame 2" }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: "Frame 1" }).getAttribute("aria-pressed")).toBe("false")

    const many = vi.fn()
    rerender(<ImageGrid key="m" label="Frames" items={items} selection="multiple" onSelectedChange={many} />)
    fireEvent.click(screen.getByRole("button", { name: "Frame 1" }))
    fireEvent.click(screen.getByRole("button", { name: "Frame 3" }))
    expect(many).toHaveBeenLastCalledWith(["a", "c"])
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
})
