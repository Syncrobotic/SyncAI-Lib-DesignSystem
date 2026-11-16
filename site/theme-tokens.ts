import { readSource } from "./catalog"

// Values are read from the theme file at build time, so this page cannot drift from the shipped tokens.
const css = readSource("registry/syncrobotic/styles/syncrobotic-theme.css")

function block(selector: string) {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf("\n}", start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

const light = block(":root")
const dark = { ...light, ...block(".dark") }
const theme = block("@theme")

export function color(name: string) {
  const resolve = (v: string, map: Record<string, string>): string => {
    const ref = v.match(/^var\(--([\w-]+)\)$/)
    return ref ? resolve(map[ref[1]], map) : v
  }
  return { light: resolve(light[name], light), dark: resolve(dark[name], dark) }
}

export const themeValue = (name: string) => theme[name] ?? light[name]

/** Comment that follows a declaration in the theme file, e.g. "48 頁面主要動作". */
export function note(name: string) {
  return css.match(new RegExp(`--${name}:[^;]+;\\s*/\\*\\s*([^*]+?)\\s*\\*/`))?.[1] ?? ""
}
