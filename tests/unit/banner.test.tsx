import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Wrench } from "lucide-react"
import { Banner } from "@/registry/syncrobotic/ui/banner"

afterEach(cleanup)

describe("Banner", () => {
  it("is a polite status for neutral, info and warning, and an alert only for danger", () => {
    render(
      <>
        <Banner title="Read-only mode.">Changes are paused.</Banner>
        <Banner tone="info">Uploading 1,204 events.</Banner>
        <Banner tone="warning">Your trial ends in 3 days.</Banner>
        <Banner tone="danger">No connection to the server.</Banner>
      </>,
    )
    expect(screen.getAllByRole("status")).toHaveLength(3)
    expect(screen.getByRole("alert").textContent).toContain("No connection to the server.")
    expect(screen.queryByRole("banner")).toBeNull()
  })

  it("reads the title and the words as one sentence, with the icon hidden", () => {
    render(
      <Banner icon={Wrench} title="Maintenance on Sunday.">
        The API is unavailable.
      </Banner>,
    )
    const b = screen.getByRole("status")
    expect(b.textContent).toBe("Maintenance on Sunday. The API is unavailable.")
    expect(b.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true")
  })

  it("has no close button unless onDismiss is given", () => {
    render(<Banner>Read-only mode.</Banner>)
    expect(screen.queryByRole("button")).toBeNull()
  })

  // jsdom has no TransitionEvent, so the property that finished is set by hand.
  const transitionEnd = (propertyName: string) => Object.assign(new Event("transitionend", { bubbles: true }), { propertyName })

  it("calls onDismiss from a named close button, and fades and closes its height once open is false", () => {
    function Dismissible({ onDismiss }: { onDismiss: () => void }) {
      const [open, setOpen] = React.useState(true)
      return (
        <Banner
          open={open}
          onDismiss={() => {
            onDismiss()
            setOpen(false)
          }}
          dismissLabel="Dismiss trial notice"
          action={<button type="button">Choose a plan</button>}
        >
          Your trial ends in 3 days.
        </Banner>
      )
    }
    const onDismiss = vi.fn()
    render(<Dismissible onDismiss={onDismiss} />)
    const close = screen.getByRole("button", { name: "Dismiss trial notice" })
    fireEvent.click(close)
    expect(onDismiss).toHaveBeenCalledOnce()
    const leaving = document.querySelector("[data-slot=banner]")!
    expect(leaving.getAttribute("aria-hidden")).toBe("true")
    expect(leaving.className).toContain("grid-rows-[0fr]")
    expect(leaving.className).toContain("opacity-0")
    // The opacity ending first does not remove it; the height closing does.
    act(() => {
      fireEvent(leaving, transitionEnd("opacity"))
    })
    expect(document.querySelector("[data-slot=banner]")).not.toBeNull()
    act(() => {
      fireEvent(leaving, transitionEnd("grid-template-rows"))
    })
    expect(document.querySelector("[data-slot=banner]")).toBeNull()
  })

  it("moves focus on to what follows it when it closes with focus on its close button", () => {
    function Page() {
      const [open, setOpen] = React.useState(true)
      return (
        <>
          <button type="button">Before</button>
          <Banner open={open} onDismiss={() => setOpen(false)} dismissLabel="Dismiss notice">
            Maintenance on Sunday.
          </Banner>
          {!open && <button type="button">Show it again</button>}
          <button type="button">After</button>
        </>
      )
    }
    render(<Page />)
    const close = screen.getByRole("button", { name: "Dismiss notice" })
    close.focus()
    fireEvent.click(close)
    // What the app drew in its place counts: the first Tab stop after the banner.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Show it again" }))
  })

  it("renders nothing while closed, and appears when open turns true", () => {
    const { rerender } = render(<Banner open={false}>No connection to the server.</Banner>)
    expect(document.querySelector("[data-slot=banner]")).toBeNull()
    rerender(<Banner open>No connection to the server.</Banner>)
    // It opens from no height (@starting-style) to its own.
    const shown = document.querySelector("[data-slot=banner]")!.className
    expect(shown).toContain("starting:grid-rows-[0fr]")
    expect(shown).toContain("grid-rows-[1fr]")
  })

  it("keeps its targets 44 px: the close button uses --h-md", () => {
    render(<Banner onDismiss={() => {}}>News</Banner>)
    expect(screen.getByRole("button", { name: "Dismiss" }).className).toContain("size-(--h-md)")
  })
})
