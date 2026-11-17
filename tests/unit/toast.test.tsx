import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { toast, toastDuration, Toaster } from "@/registry/syncrobotic/ui/toast"

afterEach(() => act(() => toast.clear()))

describe("toast", () => {
  it("uses the island's timings: 4 s, 8 s with an action, failures until dismissed", () => {
    expect(toastDuration({ title: "Saved" })).toBe(4000)
    expect(toastDuration({ title: "Deleted", action: { label: "Undo", onClick: () => {} } })).toBe(8000)
    expect(toastDuration({ title: "Failed", tone: "danger" })).toBe(Infinity)
  })

  it("keeps at most three open and never evicts a failure first", () => {
    render(<Toaster />)
    act(() => {
      toast({ title: "Failure", tone: "danger" })
      toast({ title: "One" })
      toast({ title: "Two" })
      toast({ title: "Three" })
    })
    const state = (t: string) => screen.queryByText(t)?.closest("[data-state]")?.getAttribute("data-state") ?? "gone"
    expect(state("Failure")).toBe("open")
    expect(state("One")).not.toBe("open")
    expect(["Two", "Three"].map(state)).toEqual(["open", "open"])
  })
})
