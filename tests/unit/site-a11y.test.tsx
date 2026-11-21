import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { a11yOf } from "@/site/a11y"
import { items } from "@/site/catalog"
import { KeyCell, parseKeys } from "@/site/key-cell"

// The Accessibility tab keeps a measured role only when the component's source can produce it. Sources that use a
// primitive without renaming it (import { ToggleGroup } from "radix-ui"), an npm widget or a wrapper's slot used to
// drop real roles, and the tab said "No role of its own" for a radio group.
describe("Accessibility tab roles", () => {
  const roles = (name: string) => a11yOf(name)!.roles
  it.each([
    ["segmented-control", ["radio", "radiogroup"]],
    ["theme-toggle", ["radio", "radiogroup"]],
    ["chip-group", ["radio", "radiogroup"]],
    ["choice-field", ["checkbox", "group", "radio", "switch"]],
    ["calendar", ["grid", "gridcell"]],
    ["input-otp", ["textbox"]],
    ["filter-form", ["search", "searchbox"]],
    ["input-group", ["searchbox", "textbox"]],
    ["alert", ["alert", "status"]],
  ])("%s shows %j", (name, expected) => {
    expect(roles(name)).toEqual(expect.arrayContaining(expected))
  })
  it("a segmented control is not called a toolbar it never renders", () => {
    expect(roles("segmented-control")).not.toContain("toolbar")
  })
})

// Key cells are written with each key in backticks; words stay text. One notation for every table.
describe("keyboard tables", () => {
  const cells = items.flatMap((i) => (i.keyboard ?? []).map(([k]) => [i.name, k] as const))
  const words = new Set(["Focus", "Type", "Type a letter", "Type letters", "Release every drive key"])
  it.each(cells)("%s: %s marks its keys", (_, k) => {
    expect(k.includes("`") || words.has(k)).toBe(true)
  })
  it.each(cells)("%s: %s uses the one notation", (_, k) => {
    for (const p of parseKeys(k)) if ("keys" in p) for (const key of p.keys) expect(key).not.toMatch(/^(Escape|Page Up|Page Down|Arrow.*|Up|Down|Left|Right|Return|Del)$/)
  })
  it("draws keys as kbd, words and the slash between alternatives as text, a chord as one group", () => {
    const { container } = render(<KeyCell keys="Hold `Enter` / `Space` 2 s, or `Shift`+`Tab` away" />)
    const kbds = [...container.querySelectorAll("kbd[data-slot=kbd]")].map((k) => k.textContent)
    expect(kbds).toEqual(["Enter", "Space", "Shift", "Tab"])
    expect(container.querySelectorAll("kbd[data-slot=kbd-group]")).toHaveLength(1)
    expect(container.textContent).toBe("Hold Enter / Space 2 s, or Shift+Tab away")
  })
})
