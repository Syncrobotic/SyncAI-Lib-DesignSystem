import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { toast, Toaster } from "@/registry/syncrobotic/ui/toast?react-compiler"

// Products build with the React Compiler; the stack must still follow the store and the pointer once compiled.
afterEach(() => act(() => toast.clear()))

const attr = (title: string, name: string) => screen.getByText(title).closest("[data-slot=toast]")?.getAttribute(name)

describe("toast, compiled", () => {
  it("restacks as toasts arrive and leave, and spreads on hover", () => {
    render(<Toaster />)
    let second = 0
    act(() => {
      toast({ title: "A" })
      second = toast({ title: "B" })
      toast({ title: "C" })
      toast({ title: "D" })
    })
    expect(["D", "C", "B", "A"].map((t) => attr(t, "data-index"))).toEqual(["0", "1", "2", "3"])
    expect(attr("A", "data-visible")).toBe("false")
    act(() => toast.dismiss(second))
    expect(["D", "C", "A"].map((t) => attr(t, "data-index"))).toEqual(["0", "1", "2"])
    expect(attr("A", "data-visible")).toBe("true")
    const list = document.querySelector("[data-slot=toast-viewport]")!
    act(() => void fireEvent.pointerMove(list))
    expect(list.getAttribute("data-expanded")).toBe("true")
  })
})
