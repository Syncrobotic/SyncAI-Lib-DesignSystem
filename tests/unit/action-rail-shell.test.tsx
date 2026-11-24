import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ActionRailShell } from "@/registry/syncrobotic/blocks/action-rail-shell"

afterEach(cleanup)

const shell = (onBack = vi.fn(), extra?: React.ReactNode) => {
  render(
    <ActionRailShell
      title="Batch 12"
      onBack={onBack}
      step={{ title: "Review 12 new labels", description: "Check the boxes." }}
      primary={{ label: "Start review" }}
      secondary={[{ label: "Export labels" }]}
    >
      <input aria-label="Note" />
      {extra}
    </ActionRailShell>,
  )
  return onBack
}

describe("ActionRailShell", () => {
  it("holds the step: its title names the rail, one primary and the small actions", () => {
    shell()
    expect(screen.getByRole("complementary", { name: "Review 12 new labels" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Start review" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Export labels" })).toBeTruthy()
  })

  it("goes back on ← and Esc and with the back button", () => {
    const back = shell()
    fireEvent.keyDown(document.body, { key: "Escape" })
    fireEvent.keyDown(document.body, { key: "ArrowLeft" })
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(back).toHaveBeenCalledTimes(3)
  })

  it("leaves the keys alone while typing, with a modifier, or in a widget that uses arrows", () => {
    const back = shell(vi.fn(), <div role="tablist" aria-label="Views"><button role="tab">A</button></div>)
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Note" }), { key: "ArrowLeft" })
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Note" }), { key: "Escape" })
    fireEvent.keyDown(document.body, { key: "ArrowLeft", altKey: true })
    fireEvent.keyDown(screen.getByRole("tab"), { key: "ArrowLeft" })
    expect(back).not.toHaveBeenCalled()
  })

  it("leaves Esc to an open overlay", () => {
    const back = shell(vi.fn(), <div role="dialog" data-state="open" />)
    fireEvent.keyDown(document.body, { key: "Escape" })
    expect(back).not.toHaveBeenCalled()
  })
})

describe("ActionRailShell keys (#334)", () => {
  const rail = (label: string, loading = false) => (
    <ActionRailShell
      title="Run"
      step={{ title: "Run the model" }}
      primary={{ label, loading }}
      secondary={[{ id: "export", label: label === "Run" ? "Export" : "Export partial" }]}
    >
      <p>Content</p>
    </ActionRailShell>
  )

  it("keeps the primary the same element, and focus on it, when its label changes", () => {
    const { rerender } = render(rail("Run"))
    const run = screen.getByRole("button", { name: "Run" })
    run.focus()
    rerender(rail("Stop", true))
    const stop = screen.getByRole("button", { name: /Stop/ })
    expect(stop).toBe(run)
    expect(document.activeElement).toBe(stop)
    rerender(rail("Run"))
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Run" }))
  })

  it("keeps a secondary with an id the same element when its label changes", () => {
    const { rerender } = render(rail("Run"))
    screen.getByRole("button", { name: "Export" }).focus()
    rerender(rail("Stop"))
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Export partial" }))
  })
})
