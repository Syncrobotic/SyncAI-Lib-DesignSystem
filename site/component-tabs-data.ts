import { a11yOf } from "./a11y"
import { getItem } from "./catalog"
import { propsOf } from "./props-data"

export const hasProps = (name: string) => propsOf(name).some((p) => p.props.length > 0 || p.inherits.length > 0)
export const hasA11y = (name: string) => a11yOf(name) !== null

/** The tabs a component page has: Overview always; Properties when it has an API; Accessibility for anything rendered. */
export function tabsOf(name: string) {
  if (!getItem(name)) return []
  const base = `/docs/components/${name}`
  return [
    { href: base, label: "Overview" },
    ...(hasProps(name) ? [{ href: `${base}/properties`, label: "Properties" }] : []),
    ...(hasA11y(name) ? [{ href: `${base}/accessibility`, label: "Accessibility" }] : []),
  ]
}
