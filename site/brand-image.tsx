import { MARK_DISC, MARK_STROKES, MARK_VIEWBOX } from "./brand-paths"

// The official mark for next/og surfaces (social cards, Apple touch icon). Geometry from the brand SVG.
// Raw colours are fine here: next/og renders outside the page, without CSS variables.
export function MarkImage({ size, reversed = false }: { size: number; reversed?: boolean }) {
  return (
    <svg width={size} height={size} viewBox={MARK_VIEWBOX}>
      <path d={MARK_DISC.d} transform={MARK_DISC.transform} fill={reversed ? "#fafafa" : "#000000"} />
      {MARK_STROKES.map((p) => (
        <path key={p.transform} d={p.d} transform={p.transform} fill={reversed ? "#09090b" : "#fbfbfb"} />
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
