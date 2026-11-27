// @syncrobotic/math v0.52.0 · update: npx shadcn add @syncrobotic/math --overwrite
/** `value` held between `min` and `max` (either may be left out). */
export const clamp = (value: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, value))

/** A whole number written with leading zeros to `width` digits: pad(7) is "07", pad(5, 3) is "005". */
export const pad = (n: number, width = 2) => String(n).padStart(width, "0")

/** The theme's --ease-standard, cubic-bezier(0.2, 0, 0, 1), at progress `t` (0 to 1): for a glide drawn in JavaScript. */
export function easeStandard(t: number) {
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
  // Solve the curve's x for t by bisection, then read its y there.
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (bez(0.2, 0, mid) < t) lo = mid
    else hi = mid
  }
  return bez(0, 1, (lo + hi) / 2)
}
