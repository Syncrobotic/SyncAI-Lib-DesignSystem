// Exports the theme as W3C Design Tokens (DTCG format) for Figma, Tokens Studio, Style Dictionary and native apps.
// The CSS theme stays the source; this file is generated from it.
//
//   node scripts/tokens.mjs          CI: fails if public/tokens/*.json are out of date
//   node scripts/tokens.mjs --write  regenerate them
//
// Output (served by the docs site at /tokens/…):
//   core.tokens.json        radius, spacing, heights, type, motion: the same in every mode
//   color.light.tokens.json colour, shadow: light mode
//   color.dark.tokens.json  colour, shadow: dark mode (same names, so tools treat the two files as modes)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"

const WRITE = process.argv.includes("--write")
const OUT = "public/tokens"
const css = readFileSync("registry/syncrobotic/styles/syncrobotic-theme.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "")

function block(selector) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`No ${selector} block in the theme`)
  let depth = 0
  let end = start
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}" && --depth === 0) {
      end = i
      break
    }
  }
  return Object.fromEntries([...css.slice(start, end).matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

const light = block(":root")
const dark = block(".dark")
const theme = block("@theme")

// ---------- value conversion ----------
const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0")
function color(v) {
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase()
  const m = v.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)$/)
  if (m) return `#${hex2(+m[1])}${hex2(+m[2])}${hex2(+m[3])}${hex2(+m[4] * 255)}`
  throw new Error(`Unsupported colour ${v}`)
}
const px = (v) => (v.endsWith("rem") ? `${parseFloat(v) * 16}px` : v)
function shadow(v) {
  const m = v.match(/^(-?[\d.]+)(?:px)?\s+(-?[\d.]+)px\s+([\d.]+)px\s+(rgb\([^)]+\))$/)
  if (!m) throw new Error(`Unsupported shadow ${v}`)
  return { color: color(m[4]), offsetX: `${m[1]}px`, offsetY: `${m[2]}px`, blur: `${m[3]}px`, spread: "0px" }
}

// ---------- colour sets ----------
const colorNames = Object.keys(light).filter((k) => /^#|^rgb|^var\(--/.test(light[k]) && !k.startsWith("shadow"))
function colorSet(mode) {
  const values = mode === "dark" ? { ...light, ...dark } : light
  const color_ = {}
  for (const k of colorNames) {
    const v = values[k]
    const ref = v.match(/^var\(--([\w-]+)\)$/)
    color_[k] = { $type: "color", $value: ref ? `{color.${ref[1]}}` : color(v) }
  }
  return {
    color: color_,
    shadow: {
      float: { $type: "shadow", $value: shadow(values["shadow-float"]) },
      overlay: { $type: "shadow", $value: shadow(values["shadow-overlay"]) },
    },
  }
}

// ---------- core ----------
const pick = (src, prefix) => Object.entries(src).filter(([k]) => k.startsWith(prefix))
const core = {
  radius: Object.fromEntries(pick(theme, "radius-").map(([k, v]) => [k.slice(7), { $type: "dimension", $value: px(v) }])),
  spacing: {
    ...Object.fromEntries([1, 2, 3, 4, 6, 8].map((n) => [n, { $type: "dimension", $value: `${n * 4}px` }])),
    section: { $type: "dimension", $value: px(light["space-section"]) },
    "section-sm": { $type: "dimension", $value: px(light["space-section-sm"]) },
  },
  height: Object.fromEntries(pick(light, "h-").map(([k, v]) => [k.slice(2), { $type: "dimension", $value: px(v) }])),
  tray: {
    padding: { $type: "dimension", $value: px(light["tray-pad"]) },
    gap: { $type: "dimension", $value: px(light["tray-gap"]) },
  },
  font: {
    family: { sans: { $type: "fontFamily", $value: theme["font-sans"].split(",").map((s) => s.trim().replace(/^"|"$/g, "")) } },
    weight: Object.fromEntries(pick(theme, "font-weight-").map(([k, v]) => [k.slice(12), { $type: "fontWeight", $value: Number(v) }])),
    size: Object.fromEntries(
      pick(theme, "text-")
        .filter(([k]) => !k.includes("--"))
        .map(([k, v]) => [k.slice(5), { $type: "dimension", $value: px(v) }]),
    ),
    lineHeight: Object.fromEntries(
      pick(theme, "text-")
        .filter(([k]) => k.endsWith("--line-height"))
        .map(([k, v]) => [k.slice(5, -13), { $type: "dimension", $value: px(v) }]),
    ),
  },
  motion: {
    duration: Object.fromEntries(pick(light, "motion-").map(([k, v]) => [k.slice(7), { $type: "duration", $value: v }])),
    easing: { standard: { $type: "cubicBezier", $value: theme["ease-standard"].match(/[\d.]+/g).map(Number) } },
  },
}

const files = {
  "core.tokens.json": core,
  "color.light.tokens.json": colorSet("light"),
  "color.dark.tokens.json": colorSet("dark"),
}

let stale = 0
mkdirSync(OUT, { recursive: true })
for (const [name, data] of Object.entries(files)) {
  const text = JSON.stringify({ $description: "SYNCROBOTIC design tokens. Generated from syncrobotic-theme.css; do not edit.", ...data }, null, 2) + "\n"
  const path = `${OUT}/${name}`
  let current = ""
  try {
    current = readFileSync(path, "utf8")
  } catch {}
  if (current === text) continue
  if (WRITE) writeFileSync(path, text)
  else {
    console.error(`${path} is out of date with the theme. Run npm run tokens`)
    stale++
  }
}
if (stale) process.exit(1)
console.log(WRITE ? `Tokens written to ${OUT}` : "Tokens up to date")
