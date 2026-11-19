// How far apart two colours look, to normal vision and under colour-vision deficiency. Distance is ΔE in OKLab ×100;
// the deficiency simulation is Machado, Oliveira & Fernandes (2009) at full severity, the model the thresholds below are
// calibrated to. Used by the Data visualisation page (numbers computed at build) and by CI.

type Rgb = [number, number, number]
const s2lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lin = (hex: string): Rgb => [1, 3, 5].map((i) => s2lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as Rgb

const MACHADO = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
} as const

function oklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function simulate(c: Rgb, kind: keyof typeof MACHADO): Rgb {
  const M = MACHADO[kind]
  const clamp = (v: number) => Math.max(0, Math.min(1, v))
  return M.map((row) => clamp(row[0] * c[0] + row[1] * c[1] + row[2] * c[2])) as Rgb
}

const dist = (a: Rgb, b: Rgb) => {
  const [x, y] = [oklab(a), oklab(b)]
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

/** ΔE to normal vision, and the worse of protanopia and deuteranopia (the common forms). */
export function separation(a: string, b: string) {
  const [x, y] = [lin(a), lin(b)]
  return {
    normal: dist(x, y),
    cvd: Math.min(dist(simulate(x, "protan"), simulate(y, "protan")), dist(simulate(x, "deutan"), simulate(y, "deutan"))),
  }
}

/** OKLCH chroma: below about 0.03 a colour reads as grey. */
export function chroma(hex: string) {
  const [, a, b] = oklab(lin(hex))
  return Math.hypot(a, b)
}

/** Below these two series are hard to tell apart. CVD 6–8 is allowed only with a legend and a table, which every chart has. */
export const NORMAL_MIN = 15
export const CVD_MIN = 6
export const CVD_TARGET = 8
