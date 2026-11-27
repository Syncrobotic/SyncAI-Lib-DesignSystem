// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { BRAND_TOKENS, checkBrand, parseBrand, parseColor, readTheme, themeBlock } from "../../scripts/brand.mjs"
import { color } from "@/site/theme-tokens"

// The brand layer (/docs/tokens#brand): a product swaps five tokens and nothing else, and the kit's own look is what
// renders when it swaps none.
const theme = readTheme()
const portal = readFileSync("site/snippets/brand-portal.css", "utf8")

describe("brand layer", () => {
  it("feeds only the brand tokens, in light and dark, each falling back to the kit's own value", () => {
    const fed = (selector: string) => [...theme.slice(theme.indexOf(`${selector} {`), theme.indexOf("\n}", theme.indexOf(`${selector} {`))).matchAll(/--([\w-]+):\s*var\(--brand-([\w-]+),/g)]
    expect(fed(":root").map((m) => [m[1], m[2]])).toEqual(BRAND_TOKENS.map((t) => [t, t]))
    expect(fed(".dark").map((m) => [m[1], m[2]])).toEqual(BRAND_TOKENS.map((t) => [t, `${t}-dark`]))
  })

  it("renders the kit's values when no brand is set", () => {
    expect(["primary", "primary-foreground", "ring", "chart-1", "chart-1-foreground"].map((t) => color(t).light)).toEqual(["#09090b", "#ffffff", "#09090b", "#5347a8", "#ffffff"])
    expect(["primary", "primary-foreground", "ring", "chart-1", "chart-1-foreground"].map((t) => color(t).dark)).toEqual(["#fafafa", "#09090b", "#fafafa", "#8986de", "#09090b"])
    expect(themeBlock(theme, ":root").primary).toBe("#09090b")
    expect(checkBrand("", theme)).toEqual([])
  })

  it("leaves high contrast on the kit's ink: no brand input there", () => {
    const hc = theme.slice(theme.indexOf("/* ---------- High contrast"), theme.indexOf("/* ---------- Tailwind utilities"))
    expect(hc).not.toContain("--brand-")
  })

  it("passes the Portal's purple example, light and dark", () => {
    expect(checkBrand(portal, theme)).toEqual([])
    expect(Object.keys(parseBrand(portal).values.light)).toEqual(BRAND_TOKENS)
    expect(Object.keys(parseBrand(portal).values.dark)).toEqual(BRAND_TOKENS)
  })

  it("fails the Portal's purple as it ships in dark: 2.7:1 on the dark page", () => {
    const shipped = ":root { --brand-primary: oklch(0.464 0.15 285); --brand-primary-dark: oklch(0.464 0.15 285); --brand-primary-foreground-dark: oklch(0.985 0 0); }"
    const problems = checkBrand(shipped, theme)
    expect(problems).toHaveLength(3)
    expect(problems[0]).toMatch(/^dark: --primary on --background .* is 2\.69, needs 3$/)
  })

  it("refuses a theme token set directly, an unknown brand token and a colour it cannot read", () => {
    const problems = checkBrand(":root { --success: #00ff00; --primary: #5447a8; --surface: #fff; --brand-warning: #ff0; --brand-ring: tomato; }", theme)
    expect(problems.some((p) => p === "--success is a theme token: it is semantic and fixed")).toBe(true)
    expect(problems.some((p) => p === "--primary is a theme token: set --brand-primary instead")).toBe(true)
    // A product's own variable is its business.
    expect(problems.some((p) => p.includes("--surface"))).toBe(false)
    expect(problems.some((p) => p.startsWith("--brand-warning is not a brand token"))).toBe(true)
    expect(problems.some((p) => p.includes('cannot read "tomato"'))).toBe(true)
  })

  it("keeps a chart accent apart from the graphite series", () => {
    expect(checkBrand(":root { --brand-chart-1-dark: oklch(0.72 0.13 285); }", theme).join("\n")).toContain("dark: --chart-1 against --chart-3, ΔE")
  })

  it("reads hex, rgb() and oklch()", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255])
    expect(parseColor("rgb(9 9 11)")).toEqual([9, 9, 11])
    // The Portal's purple is the kit's own chart indigo, one step of red apart.
    expect(parseColor("oklch(0.464 0.15 285)")).toEqual([84, 71, 168])
    expect(parseColor("oklch(46.4% 0.15 285deg)")).toEqual([84, 71, 168])
    expect(parseColor("var(--x)")).toBeNull()
  })
})
