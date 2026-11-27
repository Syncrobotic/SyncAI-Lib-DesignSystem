// The brand layer: the only tokens a product may swap, and the contrast each must keep (/docs/tokens#brand). A brand
// sets --brand-<token> (light) and --brand-<token>-dark on :root; redefining a theme token instead is an error.
// check-tokens runs this on the docs example; a product can run it on its own globals.css:
//
//   node scripts/brand.mjs path/to/brand.css
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

/** The swappable tokens. Status, surfaces, text, borders and disabled are semantic and fixed. */
export const BRAND_TOKENS = ["primary", "primary-foreground", "ring", "chart-1", "chart-1-foreground"]

/** @typedef {[number, number, number]} Rgb */
/** @typedef {"light" | "dark"} Mode */
/** @typedef {{ mode: Mode; what: string; value: number; min: number }} Problem */

/** What each brand value must reach, in both modes: WCAG 1.4.3 for words, 1.4.11 and 2.4.13 for fills, edges, focus. */
export const REQUIREMENTS = [
  { fg: "primary-foreground", on: ["primary"], min: 4.5, why: "words on a primary button" },
  { fg: "primary", on: ["background", "card", "popover"], min: 3, why: "a primary fill or selected edge on every surface" },
  { fg: "ring", on: ["background", "card", "popover"], min: 3, why: "the focus ring on every surface" },
  { fg: "chart-1", on: ["card"], min: 3, why: "the accent series as a mark" },
  { fg: "chart-1-foreground", on: ["chart-1"], min: 4.5, why: "a value written on the accent" },
]
/** The accent series stays apart from the graphite series (ΔE in OKLab ×100), to normal and colour-blind eyes. */
export const SERIES_MIN = 15

// ---------- colour ----------

/** @param {number} c */
const s2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
/** @param {number} c */
const lin2s = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
/** @param {number} c */
const clamp = (c) => Math.max(0, Math.min(1, c))

/**
 * A CSS colour as 0–255 sRGB: #rgb, #rrggbb, rgb(r g b) or oklch(L C H) (L as 0–1 or a percentage). Null otherwise.
 * @param {string} value
 * @returns {Rgb | null}
 */
export function parseColor(value) {
  const v = value.trim().toLowerCase()
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)?.[1]
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex
    return /** @type {Rgb} */ ([0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)))
  }
  const rgb = v.match(/^rgb\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*\)$/)
  if (rgb) return /** @type {Rgb} */ (rgb.slice(1, 4).map(Number))
  const ok = v.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/)
  if (!ok) return null
  const L = Number(ok[1]) / (ok[2] ? 100 : 1)
  const [C, h] = [Number(ok[3]), (Number(ok[4]) * Math.PI) / 180]
  const [a, b] = [C * Math.cos(h), C * Math.sin(h)]
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
  return /** @type {Rgb} */ (lin.map((c) => Math.round(lin2s(clamp(c)) * 255)))
}

/** @param {Rgb} c */
const luminance = (c) => {
  const [r, g, b] = c.map((x) => s2lin(x / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * WCAG contrast ratio of two colours.
 * @param {Rgb} a
 * @param {Rgb} b
 */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// OKLab distance, also under protanopia and deuteranopia (Machado 2009), as site/palette-check.ts measures the theme.
const MACHADO = [
  [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
]
/** @param {number[]} c linear sRGB */
function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
/** @param {number[]} a @param {number[]} b */
const dist = (a, b) => {
  const [x, y] = [oklab(a), oklab(b)]
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}
/**
 * ΔE to normal vision, and the worse of protanopia and deuteranopia.
 * @param {Rgb} a
 * @param {Rgb} b
 */
export function separation(a, b) {
  const [x, y] = [a.map((c) => s2lin(c / 255)), b.map((c) => s2lin(c / 255))]
  /** @param {number[][]} M @param {number[]} c */
  const sim = (M, c) => M.map((row) => clamp(row[0] * c[0] + row[1] * c[1] + row[2] * c[2]))
  return { normal: dist(x, y), cvd: Math.min(...MACHADO.map((M) => dist(sim(M, x), sim(M, y)))) }
}

// ---------- reading CSS ----------

/** @param {string} css */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")

/**
 * The declarations of the first `selector { … }` block, with each brand fallback (`var(--brand-x, v)`) read as `v`.
 * @param {string} css
 * @param {string} selector
 * @returns {Record<string, string>}
 */
export function themeBlock(css, selector) {
  const src = stripComments(css)
  const start = src.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`No ${selector} block in the theme`)
  const body = src.slice(start, src.indexOf("\n}", start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], unbrand(m[2].trim())]))
}

/**
 * A theme value with its brand input removed: `var(--brand-primary, #09090b)` is `#09090b`.
 * @param {string} value
 */
export const unbrand = (value) => value.replace(/^var\(--brand-[\w-]+,\s*(.+)\)$/, "$1")

/**
 * The custom properties a brand file (or a whole globals.css) declares: brand inputs per mode, `--brand-*` names that
 * are not inputs, and every other name, which is an error only when the theme defines it.
 * @param {string} css
 */
export function parseBrand(css) {
  /** @type {Record<Mode, Record<string, string>>} */
  const values = { light: {}, dark: {} }
  /** @type {string[]} */
  const unknown = []
  /** @type {string[]} */
  const declared = []
  for (const m of stripComments(css).matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)) {
    const [name, value] = [m[1], m[2].trim()]
    const brand = name.match(/^brand-(.+?)(-dark)?$/)
    if (brand && BRAND_TOKENS.includes(brand[1])) values[brand[2] ? "dark" : "light"][brand[1]] = value
    else if (name.startsWith("brand-")) unknown.push(`--${name}`)
    else declared.push(name)
  }
  return { values, unknown, declared }
}

/**
 * Every problem with a brand file against the theme: a token it may not set, a value it cannot parse, a pair below
 * its contrast, or an accent too close to the graphite series. Empty when the brand holds.
 * @param {string} brandCss
 * @param {string} themeCss
 */
export function checkBrand(brandCss, themeCss) {
  const { values, unknown, declared } = parseBrand(brandCss)
  const light = themeBlock(themeCss, ":root")
  const dark = themeBlock(themeCss, ".dark")
  const inputs = BRAND_TOKENS.map((t) => `--brand-${t}`).join(", ")
  const errors = [
    ...unknown.map((n) => `${n} is not a brand token: only ${inputs} and their -dark forms`),
    ...declared.filter((n) => n in light || n in dark).map((n) => `--${n} is a theme token: ${BRAND_TOKENS.includes(n) ? `set --brand-${n} instead` : "it is semantic and fixed"}`),
  ]
  /** @type {Problem[]} */
  const problems = []
  /** @type {Record<Mode, Record<string, string>>} */
  const modes = { light: { ...light, ...values.light }, dark: { ...light, ...dark, ...values.dark } }
  for (const mode of /** @type {Mode[]} */ (["light", "dark"])) {
    const map = modes[mode]
    /** @param {string} name @returns {Rgb | null} */
    const rgb = (name, seen = 0) => {
      const v = map[name]
      const ref = v?.match(/^var\(--([\w-]+)\)$/)
      if (ref && seen < 8) return rgb(ref[1], seen + 1)
      const c = v === undefined ? null : parseColor(v)
      if (!c) errors.push(`${mode} --${name}: cannot read ${v === undefined ? "a missing value" : `"${v}"`} as a colour (hex, rgb() or oklch())`)
      return c
    }
    for (const r of REQUIREMENTS)
      for (const bg of r.on) {
        const [a, b] = [rgb(r.fg), rgb(bg)]
        if (!a || !b) continue
        const value = contrastRatio(a, b)
        if (value < r.min) problems.push({ mode, what: `--${r.fg} on --${bg} (${r.why})`, value, min: r.min })
      }
    const accent = rgb("chart-1")
    for (const grey of ["chart-2", "chart-3"]) {
      const g = rgb(grey)
      if (!accent || !g) continue
      const s = separation(accent, g)
      if (s.normal < SERIES_MIN) problems.push({ mode, what: `--chart-1 against --${grey}, ΔE`, value: s.normal, min: SERIES_MIN })
      if (s.cvd < SERIES_MIN) problems.push({ mode, what: `--chart-1 against --${grey}, ΔE colour-blind`, value: s.cvd, min: SERIES_MIN })
    }
  }
  return [...new Set(errors), ...problems.map((p) => `${p.mode}: ${p.what} is ${p.value.toFixed(2)}, needs ${p.min}`)]
}

/** The theme this repository ships. */
export const readTheme = () => readFileSync(new URL("../registry/syncrobotic/styles/syncrobotic-theme.css", import.meta.url), "utf8")

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error("Usage: node scripts/brand.mjs path/to/brand.css")
    process.exit(2)
  }
  const problems = checkBrand(readFileSync(file, "utf8"), readTheme())
  if (problems.length) {
    console.error(problems.map((p) => `${file}  ${p}`).join("\n"))
    process.exit(1)
  }
  console.log(`${file}: brand holds in light and dark`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main()
