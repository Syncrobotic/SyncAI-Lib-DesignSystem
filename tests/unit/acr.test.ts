import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { a11yOf } from "@/site/a11y"
import { acrMarkdown, criteria, evidence } from "@/site/acr"
import { items } from "@/site/catalog"

const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : /\.(tsx?|css)$/.test(f) ? [join(dir, f)] : []))
// Comments describe behaviour in words ("never blinks"), so only code is scanned.
const code = walk("registry/syncrobotic").map((f) => [f, readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, "$1")] as const)

describe("conformance report", () => {
  it("lists each WCAG 2.2 A and AA criterion once: 31 A, 24 AA, without 4.1.1", () => {
    const ids = criteria.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(criteria.filter((c) => c.level === "A")).toHaveLength(31)
    expect(criteria.filter((c) => c.level === "AA")).toHaveLength(24)
    expect(ids).not.toContain("4.1.1")
  })

  it("names evidence for every level it claims, and what to do for every row not evaluated", () => {
    for (const c of criteria) {
      for (const e of c.evidence) expect(evidence[e], `${c.id} ${e}`).toBeDefined()
      if (c.conformance === "Supports" || c.conformance === "Partially supports") expect(c.evidence.length, c.id).toBeGreaterThan(0)
      if (c.conformance === "Not evaluated") expect(c.todo, c.id).toBeTruthy()
    }
    expect(acrMarkdown("0.0.0").split("\n").filter((l) => /^\| \d/.test(l))).toHaveLength(criteria.length)
  })
})

// The checks the report's "Source scan" and "Computed contrast" rows cite.
describe("evidence the report cites", () => {
  it("1.3.4: nothing locks the orientation or hides content in one", () => {
    expect(code.filter(([, s]) => /orientation\.lock|@media[^{]*\(orientation:/.test(s)).map(([f]) => f)).toEqual([])
  })

  it("2.5.4: nothing listens to device motion or orientation", () => {
    expect(code.filter(([, s]) => /devicemotion|deviceorientation|DeviceMotionEvent|DeviceOrientationEvent/.test(s)).map(([f]) => f)).toEqual([])
  })

  it("2.3.1: the only endless animations are the skeleton's breath and the caret", () => {
    const loops = code.flatMap(([f, s]) => [...s.matchAll(/--animate-([\w-]+):[^;]*\binfinite\b/g)].map((m) => `${f}:${m[1]}`))
    expect(loops.map((l) => l.split(":")[1]).sort()).toEqual(["breath", "caret-blink"])
    expect(code.filter(([, s]) => /animation[^;{]*\binfinite\b/.test(s.replace(/--animate-[\w-]+:[^;]*;/g, ""))).map(([f]) => f)).toEqual([])
  })

  it("1.4.3 and 1.4.11: every component's contrast table passes in light and dark", () => {
    const failing = items.flatMap((i) => (a11yOf(i.name)?.contrast ?? []).filter((c) => !c.pass).map((c) => `${i.name}: ${c.label}`))
    expect(failing).toEqual([])
  })
})
