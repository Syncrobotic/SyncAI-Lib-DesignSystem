import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Tabs, TabsList, TabsTrigger } from "@/registry/syncrobotic/ui/tabs"

afterEach(cleanup)

const tabs = (ref: React.Ref<HTMLDivElement>) => (
  <Tabs defaultValue="overview">
    <TabsList ref={ref} aria-label="Dataset">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="browse">Browse</TabsTrigger>
    </TabsList>
  </Tabs>
)

// Issue #336: a ref passed to TabsList replaced the one the underline measures, so the underline never showed.
describe("TabsList ref", () => {
  it("hands the list to a ref object and still draws the underline", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(tabs(ref))
    const list = screen.getByRole("tablist")
    expect(ref.current).toBe(list)
    expect(list.hasAttribute("data-underline")).toBe(true)
    expect(list.querySelector("[data-slot=tabs-underline]")).toBeTruthy()
  })

  it("calls a callback ref with the list, and with null when it goes", () => {
    const ref = vi.fn()
    const { unmount } = render(tabs(ref))
    const list = screen.getByRole("tablist")
    expect(ref).toHaveBeenCalledWith(list)
    expect(list.hasAttribute("data-underline")).toBe(true)
    unmount()
    expect(ref).toHaveBeenLastCalledWith(null)
  })
})
