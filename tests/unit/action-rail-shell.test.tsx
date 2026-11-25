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

describe("ActionRailShell as a workspace (#343, #312)", () => {
  const workspace = (extra: Partial<React.ComponentProps<typeof ActionRailShell>> = {}) =>
    render(
      <ActionRailShell
        title="Run 42"
        step={{ title: "Run the model" }}
        primary={{ label: "Run" }}
        secondary={[{ label: "Reset fields" }]}
        leading={{ title: "History", children: <p>Past runs</p> }}
        panel={{ title: "Controls", children: <input aria-label="Prompt" /> }}
        {...extra}
      >
        <p>Picture</p>
      </ActionRailShell>,
    )

  it("names the side columns as complementary landmarks around one main, with the rail as a region in the panel", () => {
    workspace()
    expect(screen.getAllByRole("main")).toHaveLength(1)
    const history = screen.getByRole("complementary", { name: "History", hidden: true })
    const controls = screen.getByRole("complementary", { name: "Controls" })
    expect(history.getAttribute("data-slot")).toBe("action-rail-leading")
    expect(controls.getAttribute("data-slot")).toBe("action-rail-panel")
    const rail = screen.getByRole("region", { name: "Run the model" })
    expect(controls.contains(rail)).toBe(true)
    expect(controls.contains(screen.getByRole("textbox", { name: "Prompt" }))).toBe(true)
    // The head rows are one part, so the columns' hairlines line up.
    expect(document.querySelectorAll("[data-slot=action-rail-column-header]")).toHaveLength(2)
  })

  it("keeps the rail its own complementary column without a panel", () => {
    workspace({ panel: undefined })
    expect(screen.getByRole("complementary", { name: "Run the model" })).toBeTruthy()
  })

  it("folds header items that do not fit into the ⋯ menu, last first", () => {
    // A 400 px bar, 100 px items and a 44 px ⋯ button: three fit beside the menu, the last two fold.
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.item ? 100 : this.dataset.slot === "action-rail-header-more" ? 44 : 0
    })
    const client = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.tagName === "HEADER" ? 400 : 0
    })
    const RO = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb
      }
      observe() {
        this.cb([], this as unknown as ResizeObserver)
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
    try {
      const onSelect = vi.fn()
      workspace({ headerItems: ["Research", "Engine", "Status", "Theme", "Share"].map((label) => ({ id: label, label, onSelect })) })
      // Folded items stay mounted (display: none, no stylesheet here), so they keep their state and come back as they were.
      const hidden = (name: string) => screen.getByRole("button", { name }).closest("[data-item]")!.classList.contains("hidden")
      expect(["Research", "Engine", "Status", "Theme", "Share"].map(hidden)).toEqual([false, false, false, true, true])
      expect(screen.getByRole("button", { name: "More" }).getAttribute("data-slot")).toBe("action-rail-header-more")
    } finally {
      globalThis.ResizeObserver = RO
      width.mockRestore()
      client.mockRestore()
    }
  })

  it("shows every header item when there is room, and no ⋯", () => {
    workspace({ headerItems: [{ id: "share", label: "Share", onSelect: () => {} }] })
    expect(screen.getByRole("button", { name: "Share" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "More" })).toBeNull()
  })

  it("takes its words from labels; the old one-word props still win", () => {
    render(
      <ActionRailShell title="Run" onBack={() => {}} backLabel="Up" labels={{ back: "返回", stepLabel: "下一步" }} step={{ title: "Run" }} primary={{ label: "Go" }}>
        <p>x</p>
      </ActionRailShell>,
    )
    expect(screen.getByRole("button", { name: "Up" })).toBeTruthy()
    expect(screen.getByText("下一步")).toBeTruthy()
  })
})
