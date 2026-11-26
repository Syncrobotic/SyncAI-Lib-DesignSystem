// @syncrobotic/format-count v0.40.0 · update: npx shadcn add @syncrobotic/format-count --overwrite
/**
 * The kit's one number path. Every number a component writes goes through here, so the server and the browser write the
 * same digits and a product changes the locale in one place:
 *
 * - `formatCount(n)`: a count (whole things: rows, items, robots, matches).
 * - `formatNumber(n, options)`: any other number (a reading, a share, a coordinate), with Intl.NumberFormat's options.
 * - `resolveLocale(locale)`: the tag both use. Never `toLocaleString()` without a locale: it follows the runtime, so a
 *   server in English and a browser in German write "1,234.5" and "1.234,5" and React finds the two renders differ.
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
 * A count as the kit writes it, through Intl.NumberFormat in `locale` (English when none is given, so the server and the
 * browser write the same).
 *
 * Full, with grouping, by default: 135,287 (135,287 in zh-TW too). This is the form for tables, headers, detail pages,
 * figures and anywhere the number is read or compared. `compact` abbreviates it in the locale's own words: 135K and 1.2M
 * in English, 14萬 and 123萬 in zh-TW, 1,2 Mio. in German. Use it only where space is the constraint: a count on a tab, a
 * chart's axis ticks, a compact chip. A compact count drops digits, so put the full number where the reader can reach it
 * (a tooltip, the table view). Either way, write it in `tabular-nums`.
 */
export function formatCount(n: number, { compact = false, locale }: { compact?: boolean; locale?: string } = {}) {
  // A count is whole: round anything after the point in the full form; the compact form keeps Intl's one or two
  // significant digits (1.2K, 12K, 135K).
  return numberFormat(locale, compact ? { notation: "compact" } : { maximumFractionDigits: 0 }).format(n)
}
