// Writes app/icon.svg from site/brand-paths.ts. Run: node scripts/brand-favicon.mjs
import { readFileSync, writeFileSync } from "node:fs"
const src = readFileSync("site/brand-paths.ts", "utf8")
const mod = await import("data:text/javascript," + encodeURIComponent(src.replace(/export const/g, "export const").replace(/: \w+(\[\])?(?= =)/g, "")))
const { MARK_DISC, MARK_STROKES } = mod
// Favicon: the official mark, unchanged, on a tile whose corner follows the radius scale
// (rounded-xl, 24 px at a 108 px icon = 22 % of the side).
const bg = "#09090b", fg = "#fafafa"
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<rect width="200" height="200" rx="44" fill="${bg}"/>
<g transform="translate(28 28) scale(0.72)">
<path d="${MARK_DISC.d}" transform="${MARK_DISC.transform}" fill="${fg}"/>
${MARK_STROKES.map((p) => `<path d="${p.d}" transform="${p.transform}" fill="${bg}"/>`).join("\n")}
</g>
</svg>
`
writeFileSync("app/icon.svg", svg)
