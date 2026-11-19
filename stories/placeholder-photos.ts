// Placeholder "photos" drawn in code, so stories and docs never load an external picture. Each is an SVG data URI:
// a wall and floor in two named colours, a few pallets, and a label naming the frame. Named colours, not tokens:
// these stand for camera pictures, which do not follow the theme.

const walls = ["slategray", "lightsteelblue", "darkslategray", "cadetblue", "lightslategray", "steelblue", "dimgray", "silver"]
const floors = ["tan", "darkkhaki", "rosybrown", "burlywood", "gainsboro", "peru", "darkgray", "wheat"]
const loads = ["sienna", "olivedrab", "goldenrod", "indianred", "teal", "chocolate"]

/** One placeholder picture, 4:3. `seed` varies the scene; `label` is printed in its corner. */
export function placeholderPhoto(seed: number, label: string) {
  const wall = walls[seed % walls.length]
  const floor = floors[(seed * 3) % floors.length]
  const horizon = 150 + ((seed * 37) % 60)
  const boxes = Array.from({ length: 1 + (seed % 3) }, (_, i) => {
    const x = 40 + ((seed * 53 + i * 120) % 300)
    const h = 40 + ((seed * 29 + i * 17) % 50)
    return `<rect x="${x}" y="${horizon + 30 - h}" width="${60 + (i % 2) * 30}" height="${h}" fill="${loads[(seed + i) % loads.length]}"/>`
  }).join("")
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
    `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall}"/><stop offset="1" stop-color="white" stop-opacity="0.4"/></linearGradient></defs>` +
    `<rect width="400" height="300" fill="${wall}"/><rect width="400" height="${horizon}" fill="url(#w)"/>` +
    `<polygon points="0,${horizon} 400,${horizon} 400,300 0,300" fill="${floor}"/>` +
    `<line x1="200" y1="${horizon}" x2="120" y2="300" stroke="white" stroke-width="4" stroke-dasharray="16 12" opacity="0.7"/>` +
    boxes +
    `<rect x="12" y="258" width="${label.length * 9 + 16}" height="30" rx="4" fill="black" opacity="0.6"/>` +
    `<text x="20" y="279" font-family="monospace" font-size="15" fill="white">${label}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** A source that never loads, for the broken state. */
export const brokenPhoto = "data:image/png;base64,broken"
