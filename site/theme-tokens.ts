import { readSource } from "./catalog"

// Values are read from the theme file at build time, so the docs cannot drift from the shipped tokens.
const css = readSource("registry/syncrobotic/styles/syncrobotic-theme.css")

function block(selector: string) {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf("\n}", start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

const light = block(":root")
const dark = { ...light, ...block(".dark") }
const theme = block("@theme")

export type Mode = "light" | "dark"

export function color(name: string) {
  const resolve = (v: string, map: Record<string, string>): string => {
    const ref = v.match(/^var\(--([\w-]+)\)$/)
    return ref ? resolve(map[ref[1]], map) : v
  }
  return { light: resolve(light[name], light), dark: resolve(dark[name], dark) }
}

export const themeValue = (name: string) => theme[name] ?? light[name]

/** Comment that follows a declaration in the theme file, e.g. "48 page primary action, dock tabs". */
export function note(name: string) {
  return css.match(new RegExp(`--${name}:[^;]+;\\s*/\\*\\s*([^*]+?)\\s*\\*/`))?.[1] ?? ""
}

export const px = (rem: string) => Math.round(parseFloat(rem) * 16)

// ---------- WCAG 2.2 contrast ----------

function toRgb(value: string): [number, number, number] | null {
  // tokens-ok: white literals
  if (value === "white" || value === "#fff" || value === "#ffffff") return [255, 255, 255]
  const hex = value.match(/^#([0-9a-f]{6})$/i)?.[1]
  if (!hex) return null
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Contrast ratio of two tokens (or "white") in one mode; null when a value is translucent. */
export function contrast(fg: string, bg: string, mode: Mode) {
  const value = (t: string) => (t === "white" ? "white" : color(t)[mode])
  const a = toRgb(value(fg))
  const b = toRgb(value(bg))
  if (!a || !b) return null
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** WCAG level for text: AAA ≥ 7, AA ≥ 4.5, AA large ≥ 3. */
export function level(ratio: number) {
  return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "Fail"
}
