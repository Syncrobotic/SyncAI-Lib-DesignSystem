// The test tiles geo-map's stories draw: a made-up farm (an orchard, a field, a pond, a farm road and a yard) as slippy-map
// tiles, so no story, screenshot or test ever asks a real tile server for anything. SVG, so the set stays small.
//
//   node scripts/geo-tiles.mjs        writes public/media/tiles/{light,dark}/{z}-{x}-{y}.svg (zoom 15 to 18)
//
// The farm's shapes are in metres east and north of its centre, the same centre as stories/geo-map.stories.tsx. Storybook
// serves public/media at /media, and the docs site serves public/ at its root, so both read /media/tiles/….
import { mkdirSync, rmSync, writeFileSync } from "node:fs"

const OUT = "public/media/tiles"
const CENTRE = { lat: 24.9, lon: 121.2 }
/** Zoom levels and how far each reaches from the centre, in metres: wide enough to fill a 1280 px frame around the farm. */
const ZOOMS = [
  { z: 15, east: 2400, north: 1600 },
  { z: 16, east: 1200, north: 800 },
  { z: 17, east: 700, north: 450 },
  { z: 18, east: 420, north: 300 },
]

// Tile palettes. Hex here, not tokens: a tile is an image from a tile server, which has its own style; these are a muted
// light style and a dark one, so the stories look like what a product would serve.
const THEMES = {
  light: { land: "#e9ebe3", field: "#dfe5d2", orchard: "#d4dfc6", tree: "#b7c8a4", crop: "#cdd8bb", water: "#c7d7e6", road: "#ffffff", edge: "#c9ccc2", yard: "#e2e1dc", roof: "#c4c2bb" },
  dark: { land: "#1d1f1c", field: "#22261f", orchard: "#212a1f", tree: "#2e3a2a", crop: "#283023", water: "#1c2733", road: "#3a3c38", edge: "#2c2f2a", yard: "#262624", roof: "#33322f" },
}

const M_PER_DEG = 111320
/** @typedef {[number, number]} Pt */
/** @typedef {keyof typeof THEMES.light} Kind */
/** @param {Pt} p */
const toGeo = ([e, n]) => ({ lat: CENTRE.lat + n / M_PER_DEG, lon: CENTRE.lon + e / (M_PER_DEG * Math.cos((CENTRE.lat * Math.PI) / 180)) })
/** @param {{ lat: number, lon: number }} g @param {number} z @returns {Pt} */
const project = ({ lat, lon }, z) => {
  const phi = (lat * Math.PI) / 180
  const w = 256 * 2 ** z
  return [((lon + 180) / 360) * w, ((1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2) * w]
}
/** @param {number} e0 @param {number} n0 @param {number} e1 @param {number} n1 @returns {Pt[]} */
const rect = (e0, n0, e1, n1) => [
  [e0, n0],
  [e1, n0],
  [e1, n1],
  [e0, n1],
]
/** @param {number} e @param {number} n @param {number} r @returns {Pt[]} */
const circle = (e, n, r, k = 24) => Array.from({ length: k }, (_, i) => [e + r * Math.cos((i / k) * 2 * Math.PI) * (1 + 0.15 * Math.sin(i * 1.7)), n + r * Math.sin((i / k) * 2 * Math.PI)])

/** @typedef {{ kind: Kind, points: Pt[], width?: number }} Shape */
/** @param {Kind} kind @param {Pt[]} points @returns {Shape} */
const area = (kind, points) => ({ kind, points })
/** @param {Kind} kind @param {number} width in metres @param {Pt[]} points @returns {Shape} */
const line = (kind, width, ...points) => ({ kind, points, width })

/** The farm, in metres: areas first, then lines over them. */
const shapes = [
  area("orchard", rect(-260, -170, -20, 150)),
  area("field", rect(20, -170, 260, 60)),
  area("water", circle(150, 140, 45)),
  area("yard", rect(-90, 170, 10, 230)),
  area("roof", rect(-70, 190, -30, 220)),
  area("roof", rect(-15, 185, 5, 205)),
  // Tree rows every 8 m through the orchard, crop rows every 10 m across the field.
  ...Array.from({ length: 29 }, (_, i) => line("tree", 3, [-252 + i * 8, -165], [-252 + i * 8, 145])),
  ...Array.from({ length: 22 }, (_, i) => line("crop", 2, [25, -165 + i * 10], [255, -165 + i * 10])),
  line("road", 8, [-420, -20], [420, -20]),
  line("road", 6, [0, -20], [0, 300]),
  line("road", 5, [0, 200], [-90, 200]),
]

/** @param {Kind} kind @returns {Kind | null} */
const edgeOf = (kind) => (kind === "orchard" || kind === "field" ? "edge" : null)

/** @param {number} z @param {number} x @param {number} y @param {Record<Kind, string>} palette */
function tile(z, x, y, palette) {
  const x0 = x * 256
  const y0 = y * 256
  const metresPerPx = (2 * Math.PI * 6378137 * Math.cos((CENTRE.lat * Math.PI) / 180)) / (256 * 2 ** z)
  let body = `<rect x="${x0}" y="${y0}" width="256" height="256" fill="${palette.land}"/>`
  for (const { kind, points, width } of shapes) {
    const px = points.map((p) => project(toGeo(p), z))
    const xs = px.map((p) => p[0])
    const ys = px.map((p) => p[1])
    const pad = width ? width / metresPerPx : 2
    // Only what reaches this tile is written into it.
    if (Math.max(...xs) + pad < x0 || Math.min(...xs) - pad > x0 + 256 || Math.max(...ys) + pad < y0 || Math.min(...ys) - pad > y0 + 256) continue
    const d = px.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
    if (width) body += `<polyline points="${d}" fill="none" stroke="${palette[kind]}" stroke-width="${Math.max(1, width / metresPerPx).toFixed(1)}" stroke-linecap="round"/>`
    else {
      const edge = edgeOf(kind)
      body += `<polygon points="${d}" fill="${palette[kind]}"${edge ? ` stroke="${palette[edge]}" stroke-width="1"` : ""}/>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${x0} ${y0} 256 256">${body}</svg>\n`
}

rmSync(OUT, { recursive: true, force: true })
let count = 0
for (const [theme, palette] of Object.entries(THEMES)) {
  // One folder per theme, the tile's z, x and y in its name: a flat set copies quickly and safely into a static build.
  mkdirSync(`${OUT}/${theme}`, { recursive: true })
  for (const { z, east, north } of ZOOMS) {
    const [xa, ya] = project(toGeo([-east, north]), z)
    const [xb, yb] = project(toGeo([east, -north]), z)
    for (let x = Math.floor(xa / 256); x <= Math.floor(xb / 256); x++) {
      for (let y = Math.floor(ya / 256); y <= Math.floor(yb / 256); y++) {
        writeFileSync(`${OUT}/${theme}/${z}-${x}-${y}.svg`, tile(z, x, y, palette))
        count++
      }
    }
  }
}
console.log(`${count} tiles in ${OUT}`)
