import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { iconCategories, iconCount, iconGroups } from "@/site/icons"

const all = iconGroups.flatMap((g) => g.icons)

describe("icon set", () => {
  it("lists each icon once, by its Lucide name", () => {
    const names = all.map((i) => i.name)
    expect(names.every(Boolean)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
    expect(iconCount).toBe(names.length)
  })
  it("puts every icon in exactly one category, each with its own address", () => {
    expect(iconCategories.reduce((n, c) => n + c.count, 0)).toBe(iconCount)
    expect(new Set(iconCategories.map((c) => c.slug)).size).toBe(iconCategories.length)
    expect(iconCategories.every((c) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug))).toBe(true)
  })
  it("gives each meaning one icon", () => {
    const means = all.map((i) => i.means.toLowerCase())
    expect(means.filter((m, i) => means.indexOf(m) !== i)).toEqual([])
  })
  it("lists every icon it imports, so the lint allowlist and the page agree", () => {
    const src = readFileSync("site/icons.ts", "utf8")
    const imported = src
      .match(/import\s*\{([^}]*)\}\s*from\s*"lucide-react"/)![1]
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n && !n.startsWith("type "))
    const lucide = iconGroups.filter((g) => !g.from).flatMap((g) => g.icons)
    expect(imported.sort()).toEqual(lucide.map((i) => i.name).sort())
  })
  it("draws the kit's own icons on Lucide's grid: 2 px round strokes inside 24 px", async () => {
    const kit = await import("@/registry/syncrobotic/ui/robot-icons")
    const src = readFileSync("registry/syncrobotic/ui/robot-icons.tsx", "utf8")
    const nums = [...src.matchAll(/(?:d|cx|cy|x|y|width|height|r|rx): "([^"]+)"/g)].flatMap((m) => m[1].match(/-?\d*\.?\d+/g)!.map(Number))
    expect(nums.every((n) => n >= -22 && n <= 24)).toBe(true)
    expect(Object.keys(kit).sort()).toEqual(iconGroups.find((g) => g.from)!.icons.map((i) => i.name).sort())
  })
})
