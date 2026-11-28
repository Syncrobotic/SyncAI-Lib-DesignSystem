// @vitest-environment node
import { describe, expect, it } from "vitest"
import { breakingByItem, deprecationProblem, evaluate } from "../../scripts/stability.mjs"

const names = new Set(["badge", "timeline", "settings-sessions"])

describe("breakingByItem", () => {
  it("reads the items each release's Breaking section names, and nothing outside it", () => {
    const sections = [
      { version: "0.55.0", lines: ["### Changed", "- **`badge`:** a new size.", "### Breaking", "- **settings-sessions:** `lastActive` becomes `lastActiveAt`."] },
      { version: "0.40.0", lines: ["### Breaking", "- **`density` → `size`:** `timeline` and `badge` no longer take it."] },
    ]
    expect(Object.fromEntries(breakingByItem(sections, names))).toEqual({ "settings-sessions": ["0.55.0"], timeline: ["0.40.0"], badge: ["0.40.0"] })
  })
})

describe("deprecationProblem", () => {
  const stable = { version: "0.58.0", date: "", note: "Stable: shipped ten releases." }
  it("lets a stable item break only after a release deprecated what goes", () => {
    const breaking = { version: "0.60.0", date: "", note: "Breaking: `tone` removed; use `status`." }
    expect(deprecationProblem([breaking, stable])).toMatch(/0\.60\.0/)
    expect(deprecationProblem([breaking, { version: "0.59.0", date: "", note: "Deprecated: `tone`; use `status`." }, stable])).toBeNull()
  })

  it("does not apply before the item is stable", () => {
    expect(deprecationProblem([{ version: "0.50.0", date: "", note: "Breaking: renamed." }])).toBeNull()
  })
})

describe("evaluate", () => {
  it("finds every stable item in the registry still meeting the hard criteria", () => {
    const failing = evaluate().filter((r) => r.hardFailures.length)
    expect(failing).toEqual([])
  })
})
