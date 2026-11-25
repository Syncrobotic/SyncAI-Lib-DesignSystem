// @syncrobotic/theme-change v0.36.0 · update: npx shadcn add @syncrobotic/theme-change --overwrite
/*
  A canvas or WebGL view cannot use CSS variables: it reads the theme's colours once and draws with them. These say when
  to read them again.
*/

/** The attributes a theme switches by: the dark class, an inline style, data-theme, and data-contrast for high contrast. */
const ATTRIBUTES = ["class", "style", "data-theme", "data-contrast"]
/** The system's preferences that change the theme's colours without touching the page. */
const QUERIES = ["(prefers-color-scheme: dark)", "(prefers-contrast: more)", "(forced-colors: active)"]

/**
 * Calls `listener` whenever the theme may have changed: a class, style, data-theme or data-contrast attribute on any of
 * `elements` (the document's root by default; pass a view's ancestors when a theme can be set on a section of the page),
 * or the system's dark mode, contrast or forced-colours preference. Returns the function that stops listening. Nothing
 * happens on the server.
 */
export function onThemeChange(listener: () => void, elements?: Iterable<Element>): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {}
  const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(listener)
  for (const el of elements ?? [document.documentElement]) mo?.observe(el, { attributes: true, attributeFilter: ATTRIBUTES })
  const queries = typeof window.matchMedia === "function" ? QUERIES.map((q) => window.matchMedia(q)).filter((q) => !!q) : []
  for (const q of queries) q.addEventListener?.("change", listener)
  return () => {
    mo?.disconnect()
    for (const q of queries) q.removeEventListener?.("change", listener)
  }
}
