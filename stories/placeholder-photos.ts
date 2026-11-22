// Placeholder "photos" drawn in code, so stories and docs never load an external picture. Each is an SVG data URI:
// a wall and floor in two named colours, a few pallets, and a label naming the frame, centred at the bottom. Named colours, not tokens:
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
    // The label is centred, so a square or narrow tile, which crops the sides, keeps all of it.
    `<rect x="${200 - (label.length * 9 + 16) / 2}" y="258" width="${label.length * 9 + 16}" height="30" rx="4" fill="black" opacity="0.6"/>` +
    `<text x="200" y="279" text-anchor="middle" font-family="monospace" font-size="15" fill="white">${label}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** A source that never loads, for the broken state. */
export const brokenPhoto = "data:image/png;base64,broken"

const frameSvg = (body: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">${body}</svg>`)}`

// A camera frame drawn in code (named colours: a camera picture does not follow the theme), 640 × 480, with things at known
// places so the annotations below land on them: a person on the left, a pallet in the middle, a forklift on the right
// and dark shelving behind it, so the marks show on bright and dark parts of the picture.
export const warehouseFrame = frameSvg(
  `<rect width="640" height="290" fill="lightsteelblue"/><rect y="290" width="640" height="190" fill="tan"/>` +
    `<rect x="0" y="60" width="96" height="230" fill="slategray"/><rect x="520" y="40" width="120" height="250" fill="darkslategray"/>` +
    `<rect x="530" y="110" width="100" height="8" fill="black"/><rect x="530" y="190" width="100" height="8" fill="black"/>` +
    `<line x1="300" y1="290" x2="210" y2="480" stroke="white" stroke-width="6" stroke-dasharray="20 14" opacity="0.7"/>` +
    // The person.
    `<circle cx="155" cy="190" r="20" fill="wheat"/><rect x="132" y="210" width="46" height="122" rx="8" fill="navy"/>` +
    `<rect x="122" y="216" width="10" height="92" rx="5" fill="navy"/><rect x="178" y="216" width="10" height="92" rx="5" fill="navy"/>` +
    `<rect x="136" y="330" width="14" height="72" fill="midnightblue"/><rect x="160" y="330" width="14" height="72" fill="midnightblue"/>` +
    `<rect x="128" y="236" width="54" height="10" fill="orange"/>` +
    // The pallet.
    `<rect x="232" y="362" width="70" height="40" fill="sienna"/><rect x="228" y="402" width="78" height="16" fill="saddlebrown"/>` +
    // The forklift.
    `<rect x="470" y="222" width="18" height="168" fill="dimgray"/><rect x="330" y="296" width="140" height="94" rx="6" fill="goldenrod"/>` +
    `<polyline points="340,296 352,236 452,236 462,296" fill="none" stroke="black" stroke-width="6"/>` +
    `<rect x="488" y="372" width="72" height="8" fill="dimgray"/><circle cx="364" cy="394" r="18" fill="black"/><circle cx="440" cy="394" r="18" fill="black"/>`,
)

/** Where each zebra in `zebraFrame` stands (the middle of its body), in its 640 × 480 pixels: five in a herd on the left, three by the tree. */
export const zebras: [number, number][] = [
  [92, 318],
  [176, 300],
  [128, 372],
  [236, 352],
  [60, 410],
  [440, 300],
  [520, 322],
  [474, 384],
]

const zebra = ([x, y]: [number, number], i: number) => {
  // Facing left or right by turns; the far ones (higher up) a little smaller.
  const s = 0.75 + (y - 280) / 400
  const f = i % 2 ? -1 : 1
  const stripes = [-18, -8, 2, 12, 22].map((dx) => `<line x1="${dx}" y1="-14" x2="${dx - 4}" y2="14" stroke="black" stroke-width="4"/>`).join("")
  const legs = [-22, -12, 14, 24].map((dx) => `<rect x="${dx - 2}" y="10" width="5" height="26" fill="white" stroke="black" stroke-width="1.5"/>`).join("")
  return (
    `<g transform="translate(${x} ${y}) scale(${(s * f).toFixed(2)} ${s.toFixed(2)})">` +
    legs +
    `<ellipse rx="34" ry="16" fill="white" stroke="black" stroke-width="2"/>` +
    stripes +
    `<polygon points="26,-8 44,-34 54,-30 40,-2" fill="white" stroke="black" stroke-width="2"/>` +
    `<ellipse cx="52" cy="-30" rx="9" ry="6" fill="black"/>` +
    `<line x1="-34" y1="-4" x2="-44" y2="16" stroke="black" stroke-width="3"/>` +
    `</g>`
  )
}

/** A savanna drawn in code, 640 × 480: sky, grass, an acacia tree on the right and the eight zebras of `zebras`. */
export const zebraFrame = frameSvg(
  `<rect width="640" height="260" fill="lightskyblue"/><rect y="260" width="640" height="220" fill="darkkhaki"/>` +
    `<ellipse cx="320" cy="262" rx="360" ry="14" fill="olivedrab"/>` +
    // The acacia.
    `<rect x="560" y="150" width="14" height="130" fill="saddlebrown"/><ellipse cx="566" cy="146" rx="70" ry="22" fill="darkolivegreen"/>` +
    zebras.map(zebra).join(""),
)
