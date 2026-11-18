import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { iconCount, iconGroups } from "@/site/icons"

const all = iconGroups.flatMap((g) => g.icons)

describe("icon set", () => {
  it("lists each icon once, by its Lucide name", () => {
    const names = all.map((i) => i.name)
    expect(names.every(Boolean)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
    expect(iconCount).toBe(names.length)
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
    expect(imported.sort()).toEqual(all.map((i) => i.name).sort())
  })
})
