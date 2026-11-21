import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { score, SiteSearch } from "@/site/site-search"

describe("site search ranking", () => {
  // "battery" put Number field and Switch (battery only among their uses) above the Meter, which is a battery level.
  it("a match in what the thing is outranks a match among its uses", () => {
    const meter = { group: "Components" as const, title: "Meter", href: "/docs/components/meter", hint: "A level within a known range, like battery or storage.", text: "meter" }
    const numberField = { group: "Components" as const, title: "Number field", href: "/docs/components/number-field", hint: "A number with a range and a step.", text: "Speed limits, battery thresholds" }
    expect(score(meter, "battery")).toBeGreaterThan(score(numberField, "battery"))
  })
})

describe("site search shortcut", () => {
  // The index is fetched when the search opens; it never needs to arrive here.
  vi.stubGlobal("fetch", () => new Promise(() => {}))
  afterEach(() => document.querySelector("[data-slot=search-field]")?.remove())
  it("opens on / on an ordinary page", () => {
    const { unmount } = render(<SiteSearch />)
    act(() => {
      fireEvent.keyDown(document.body, { key: "/" })
    })
    expect(screen.queryByRole("dialog")).not.toBeNull()
    unmount()
  })
  // On the Search field's page, / is the example's own shortcut: the site's search took it first.
  it("leaves / to a search field example on the page, and still opens on Ctrl+K", () => {
    const example = document.createElement("div")
    example.setAttribute("data-slot", "search-field")
    document.body.append(example)
    render(<SiteSearch />)
    act(() => {
      fireEvent.keyDown(document.body, { key: "/" })
    })
    expect(screen.queryByRole("dialog")).toBeNull()
    act(() => {
      fireEvent.keyDown(document.body, { key: "k", ctrlKey: true })
    })
    expect(screen.queryByRole("dialog")).not.toBeNull()
  })
})
