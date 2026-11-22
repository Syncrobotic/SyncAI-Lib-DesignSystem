import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { a11yOf } from "@/site/a11y"
import { items, storyTitle } from "@/site/catalog"
import { KeyCell, parseKeys } from "@/site/key-cell"
import { AlarmLifecycle } from "@/site/alarm-lifecycle"

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
    expect(a11yOf("segmented-control")!.patterns.map((p) => p.title)).toEqual(["Radio group"])
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

// Example titles were the story names spelled out: "Point cloud no web gl", "Trace ci", sixteen "Data grid …" cut short
// in the page's contents.
describe("example titles", () => {
  it.each([
    ["PointCloudNoWebGL", "point-cloud", "No WebGL"],
    ["TraceCI", "trace", "CI"],
    ["DataGridStriped", "data-grid", "Striped"],
    ["InputOTPSixDigits", "input-otp", "Six digits"],
    ["FiltersURLSynced", "filters", "URL synced"],
    ["StreamingChartFromROS", "streaming-chart", "From ROS"],
    ["ButtonInAForm", "button", "In a form"],
    // Named after another component: kept whole.
    ["InputGroupSearch", "input", "Input group search"],
    // An override where the name cannot say it.
    ["LogViewerZhTw", "log-viewer", "Traditional Chinese (zh-TW)"],
  ])("%s on %s is %j", (story, component, title) => {
    expect(storyTitle(story, component)).toBe(title)
  })
  it("every example title says something", () => {
    for (const i of items) if (i.examples) for (const n of i.examples.only ?? []) expect(storyTitle(n, i.name).length).toBeGreaterThan(0)
  })
})

// The alarm lifecycle demo greyed its step buttons out with opacity and never said why.
describe("alarm lifecycle demo", () => {
  it("says why a step button is off, and keeps its words readable", () => {
    const { getByRole, getByText } = render(<AlarmLifecycle />)
    const clears = getByRole("button", { name: "Condition clears" })
    expect(clears).toHaveProperty("disabled", true)
    expect(clears.className).not.toContain("opacity")
    expect(getByText(/acknowledge the alarm first/)).toBeTruthy()
  })
})
