import { MARK_DISC, MARK_STROKES, MARK_VIEWBOX } from "./brand-paths"
import { color } from "./theme-tokens"

// Light: the brand file's own fills. Reversed (on dark): the theme's foreground and background.
const fills = {
  normal: { disc: "#000000", s: "#fbfbfb" }, // tokens-ok: colours of public/brand/syncrobotic-mark.svg
  reversed: { disc: color("foreground").dark, s: color("background").dark },
}

// The official mark for next/og surfaces (social cards, Apple touch icon). Geometry from the brand SVG.
// next/og renders outside the page, without CSS variables, so colours are resolved from the theme file.
export function MarkImage({ size, reversed = false }: { size: number; reversed?: boolean }) {
  return (
    <svg width={size} height={size} viewBox={MARK_VIEWBOX}>
      <path d={MARK_DISC.d} transform={MARK_DISC.transform} fill={fills[reversed ? "reversed" : "normal"].disc} />
      {MARK_STROKES.map((p) => (
        <path key={p.transform} d={p.d} transform={p.transform} fill={fills[reversed ? "reversed" : "normal"].s} />
      ))}
    </svg>
  )
}

/** Geist Regular and Bold for next/og, so social cards use the same typeface as the site. */
export async function brandFonts() {
  const { readFile } = await import("node:fs/promises")
  const { join } = await import("node:path")
  const dir = join(/*turbopackIgnore: true*/ process.cwd(), "node_modules/geist/dist/fonts/geist-sans")
  const [regular, bold] = await Promise.all([readFile(join(dir, "Geist-Regular.ttf")), readFile(join(dir, "Geist-Bold.ttf"))])
  return [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
  ]
}
