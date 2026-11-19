import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const load = (f: string) => JSON.parse(readFileSync(`public/tokens/${f}`, "utf8"))
const light = load("color.light.tokens.json")
const dark = load("color.dark.tokens.json")
const lightHc = load("color.light-hc.tokens.json")
const darkHc = load("color.dark-hc.tokens.json")

describe("DTCG tokens", () => {
  it("light and dark have the same names, so tools can treat them as modes", () => {
    for (const set of [dark, lightHc, darkHc]) {
      expect(Object.keys(set.color)).toEqual(Object.keys(light.color))
      expect(Object.keys(set.shadow)).toEqual(Object.keys(light.shadow))
    }
  })

  it("every colour is a hex value or a reference that resolves", () => {
    for (const set of [light, dark, lightHc, darkHc]) {
      for (const [name, t] of Object.entries<{ $value: string }>(set.color)) {
        const ref = t.$value.match(/^\{color\.([\w-]+)\}$/)
        if (ref) expect(set.color[ref[1]], `${name} → ${ref[1]}`).toBeDefined()
        else expect(t.$value, name).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/)
      }
    }
  })
})
