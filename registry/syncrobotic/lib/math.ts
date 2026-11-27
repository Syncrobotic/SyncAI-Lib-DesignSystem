// @syncrobotic/math v0.51.0 · update: npx shadcn add @syncrobotic/math --overwrite
/** `value` held between `min` and `max` (either may be left out). */
export const clamp = (value: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, value))

/** A whole number written with leading zeros to `width` digits: pad(7) is "07", pad(5, 3) is "005". */
export const pad = (n: number, width = 2) => String(n).padStart(width, "0")
