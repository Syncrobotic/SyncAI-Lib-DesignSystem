import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Toaster, toast } from "@/registry/syncrobotic/ui/toast"
import { WaypointEditor, type Waypoint } from "@/registry/syncrobotic/ui/waypoint-editor?react-compiler"

// Products build with the React Compiler. This file and the editor (imported with ?react-compiler) are compiled, so
// these check the editor still follows its draft once compiled: one reducer holds the draft and the selection, the map
// reports edits by index, and Undo comes back through a toast's closure, all of which a cached value would break.

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  act(() => toast.clear())
  cleanup()
  vi.useRealTimers()
})

const route: Waypoint[] = [
  { id: "a", name: "Dock exit", at: { kind: "plan", x: 8, y: 9 }, action: { type: "none" } },
  { id: "b", name: "Aisle 1", at: { kind: "plan", x: 11, y: 4 }, action: { type: "wait", seconds: 10 } },
]
const rows = () => [...document.querySelectorAll<HTMLElement>("[data-slot=waypoint-row]")]
const status = () => document.querySelector("[data-slot=waypoint-editor-status]")!.textContent

function App() {
  const [value, setValue] = React.useState(route)
  return (
    <>
      <WaypointEditor value={value} onSave={setValue} map={{ label: "North site", width: 60, height: 36 }} speed={1} />
      <p data-testid="saved">{value.map((w) => w.name).join(", ")}</p>
      <Toaster />
    </>
  )
}

describe("waypoint-editor, compiled", () => {
  it("adds on the map, edits, saves, deletes and undoes", () => {
    render(<App />)
    const region = screen.getByRole("application", { name: "North site" })
    fireEvent.focus(region)
    fireEvent.keyDown(region, { key: "Enter" })
    expect(rows()).toHaveLength(3)
    expect(rows()[2]!.getAttribute("aria-expanded")).toBe("true")
    expect(document.querySelector('[data-waypoint="2"]')!.getAttribute("data-state")).toBe("selected")
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "Bay door" } })
    expect(rows()[2]!.textContent).toContain("Bay door")
    expect(status()).toBe("Unsaved changes")
    fireEvent.click(screen.getByRole("button", { name: "Save route" }))
    expect(screen.getByTestId("saved").textContent).toBe("Dock exit, Aisle 1, Bay door")
    expect(status()).toBe("No unsaved changes")
    rows()[0]!.focus()
    fireEvent.keyDown(rows()[0]!, { key: "Delete" })
    expect(rows()).toHaveLength(2)
    fireEvent.click(within(screen.getByText("Dock exit deleted").closest("li")!).getByRole("button", { name: "Undo" }))
    expect(rows()[0]!.textContent).toContain("Dock exit")
    expect(status()).toBe("No unsaved changes")
  })
})
