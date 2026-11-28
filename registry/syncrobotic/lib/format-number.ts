// @syncrobotic/format-number v0.58.0 · update: npx shadcn add @syncrobotic/format-number --overwrite
/**
 * The kit's one number path: formatCount (135,287, or compact 135K only where space is short), formatNumber for other
 * numbers and resolveLocale, in English by default so server and browser match. The locale changes in one place. Never
 * `toLocaleString()` without a locale: it follows the runtime, so the server and browser renders can differ.
 */

const checkedLocales = new Map<string, string>()

/**
 * The locale numbers are written in: "en" without one (never the runtime's default, so server and browser agree), and
 * "en" for a tag Intl cannot read ("en_US", ""), so a bad setting writes English rather than break the component.
 */
export function resolveLocale(locale?: string): string {
  if (locale === undefined) return "en"
  let ok = checkedLocales.get(locale)
  if (ok === undefined) {
    try {
      ok = Intl.NumberFormat.supportedLocalesOf(locale).length > 0 ? locale : "en"
    } catch {
      ok = "en"
    }
    checkedLocales.set(locale, ok)
  }
  return ok
}

// One formatter per locale and options: a live panel redraws many times a second, and building Intl objects is not free.
const formatters = new Map<string, Intl.NumberFormat>()

/** A cached Intl.NumberFormat for `locale` (resolved as `resolveLocale` does) and `options`. */
export function numberFormat(locale: string | undefined, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
  const tag = resolveLocale(locale)
  const key = `${tag}|${JSON.stringify(options)}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(tag, options)
    formatters.set(key, f)
  }
  return f
}

/**
 * A number that is not a count, as the kit writes it: Intl.NumberFormat in `locale` (English when none is given), with
 * grouping and up to three decimals unless `options` say otherwise, e.g. `{ maximumFractionDigits: 1 }` or
 * `{ minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false }`. For a count use `formatCount`.
 */
export function formatNumber(n: number, { locale, ...options }: Intl.NumberFormatOptions & { locale?: string } = {}): string {
  return numberFormat(locale, options).format(n)
}

/**
 * A count through Intl.NumberFormat in `locale` (English when none is given). Full with grouping by default (135,287),
 * for anywhere it is read or compared. `compact` (135K, 14萬) only where space is the constraint (a tab, axis ticks, a
 * chip), with the full number reachable in a tooltip or the table. Either way, write it in `tabular-nums`.
 */
export function formatCount(n: number, { compact = false, locale }: { compact?: boolean; locale?: string } = {}) {
  // A count is whole: round anything after the point in the full form; the compact form keeps Intl's one or two
  // significant digits (1.2K, 12K, 135K).
  return numberFormat(locale, compact ? { notation: "compact" } : { maximumFractionDigits: 0 }).format(n)
}

/** A count and its noun, the count as formatCount writes it: plural(3, "line", "lines") is "3 lines", 1200 "1,200 lines". */
export function plural(n: number, one: string, many: string, { locale }: { locale?: string } = {}) {
  return `${formatCount(n, { locale })} ${n === 1 ? one : many}`
}
