import { describe, expect, it } from "vitest"
import { assistiveTech, matrix, results } from "@/site/a11y-manual"
import { items } from "@/site/catalog"

const stable = items.filter((i) => (i.type === "registry:ui" || i.type === "registry:component") && i.meta?.status === "stable").map((i) => i.name)

describe("manual test matrix", () => {
  const rows = matrix()

  it("has a row for every stable component, each with tasks and a cell per assistive technology", () => {
    expect(rows.map((r) => r.name).sort()).toEqual([...stable].sort())
    for (const r of rows) {
      expect(r.steps.length, r.name).toBeGreaterThan(0)
      expect(Object.keys(r.cells).sort(), r.name).toEqual(assistiveTech.map((t) => t.id).sort())
    }
  })

  it("turns each documented key into a task", () => {
    const checkbox = rows.find((r) => r.name === "checkbox")!
    expect(checkbox.steps).toContainEqual({ task: "Press `Space`", expect: "Check or uncheck" })
  })

  it("records results only for rows and columns that exist, with who, when and which versions", () => {
    const ids = new Set<string>(assistiveTech.map((t) => t.id))
    for (const r of results) {
      expect(stable, r.component).toContain(r.component)
      expect(ids.has(r.at), r.at).toBe(true)
      expect(["pass", "fail"]).toContain(r.status)
      expect(r.tester.trim()).not.toBe("")
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(r.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(r.atVersion.trim()).not.toBe("")
    }
  })
})
