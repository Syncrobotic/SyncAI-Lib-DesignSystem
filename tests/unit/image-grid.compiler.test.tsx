import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ImageGrid, type ImageGridHandle, type ImageGridItem } from "@/registry/syncrobotic/ui/image-grid?react-compiler"

// Products build with the React Compiler. vitest.config.ts compiles this file and image-grid imported with
// ?react-compiler, so this checks the ref's restoreFocus() still reads the tile that opened a picture last, not the one a
// cached handle saw first, and that a tile face from renderTile follows the items it is given.

afterEach(cleanup)

const items: ImageGridItem[] = ["a", "b", "c"].map((id, i) => ({ id, src: `data:image/gif;base64,R0lGODlhAQABAAAAACw=#${id}`, alt: `Frame ${i + 1}`, name: `${id}.jpg` }))

describe("image-grid, compiled", () => {
  it("restoreFocus() returns to the tile that opened a picture last", () => {
    function App() {
      const grid = React.useRef<ImageGridHandle>(null)
      const [opened, setOpened] = React.useState<string[]>([])
      return (
        <>
          <ImageGrid ref={grid} label="Frames" items={items} onOpen={(item) => setOpened((o) => [...o, item.id])} />
          <button type="button" onClick={() => grid.current?.restoreFocus()}>
            Back ({opened.length})
          </button>
        </>
      )
    }
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Frame 1" }))
    fireEvent.click(screen.getByRole("button", { name: "Frame 3" }))
    const back = screen.getByRole("button", { name: "Back (2)" })
    back.focus()
    fireEvent.click(back)
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Frame 3" }))
  })

  it("draws a face from renderTile for the items it is given", () => {
    const face = (item: ImageGridItem) => <span data-testid="face">{item.name}</span>
    const { rerender } = render(<ImageGrid label="Frames" items={items.slice(0, 1)} renderTile={face} />)
    expect(screen.getAllByTestId("face").map((f) => f.textContent)).toEqual(["a.jpg"])
    rerender(<ImageGrid label="Frames" items={items.slice(1)} renderTile={face} />)
    expect(screen.getAllByTestId("face").map((f) => f.textContent)).toEqual(["b.jpg", "c.jpg"])
  })
})
