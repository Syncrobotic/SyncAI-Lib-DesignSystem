// @syncrobotic/format-count v0.39.0 · update: npx shadcn add @syncrobotic/format-count --overwrite
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
  return formatter(locale ?? "en", compact).format(n)
}

const formatters = new Map<string, Intl.NumberFormat>()
function formatter(locale: string, compact: boolean) {
  const key = `${locale}|${compact ? 1 : 0}`
  let f = formatters.get(key)
  if (!f) {
    // A count is whole: round anything after the point in the full form; the compact form keeps Intl's one or two
    // significant digits (1.2K, 12K, 135K).
    f = new Intl.NumberFormat(locale, compact ? { notation: "compact" } : { maximumFractionDigits: 0 })
    formatters.set(key, f)
  }
  return f
}
