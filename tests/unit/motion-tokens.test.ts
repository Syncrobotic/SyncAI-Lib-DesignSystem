import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { duration, ease } from "../../site/motion"

// site/motion.ts mirrors the theme's motion tokens for JavaScript animation. It must not drift.
const css = readFileSync("registry/syncrobotic/styles/syncrobotic-theme.css", "utf8")
const token = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))![1].trim()

describe("motion tokens", () => {
  it.each([
    ["fast", "motion-fast"],
    ["base", "motion-base"],
    ["sheet", "motion-sheet"],
  ] as const)("%s matches --%s", (key, name) => {
    expect(`${Math.round(duration[key] * 1000)}ms`).toBe(token(name))
  })

  it("ease matches --ease-standard", () => {
    expect(`cubic-bezier(${ease.join(", ")})`).toBe(token("ease-standard"))
  })
})
