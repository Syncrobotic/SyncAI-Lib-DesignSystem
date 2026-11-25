import { getItem } from "./catalog"
import props from "./props.json"

// Every component's labels, for the catalog at the end of /docs/localisation. Generated from the source (scripts/props.mjs
// writes each labels prop's keys, defaults and notes into site/props.json), so it never drifts from the components.

type Key = { name: string; type: string; default?: string; description: string }
type Prop = { name: string; type: string; description: string; keys?: Key[] }
type Part = { name: string; props: Prop[] }
const table = props as unknown as Record<string, Part[] | string>
const parts = Object.entries(table).filter((e): e is [string, Part[]] => Array.isArray(e[1]))

/** One table of the catalog: an item's parts that take the same words, and each key as [name, English default, note]. */
export type LabelGroup = { item: string; names: string[]; page: boolean; keys: [string, string, string][] }

export function labelGroups(): LabelGroup[] {
  return parts.flatMap(([item, list]) => {
    // Parts of one item that take the same words (Trace and TraceHeader) share a table.
    const groups: { names: string[]; keys: Key[] }[] = []
    for (const part of list) {
      const keys = part.props.find((p) => p.name === "labels")?.keys
      if (!keys?.length) continue
      const sig = keys.map((k) => k.name).join()
      const same = groups.find((g) => g.keys.map((k) => k.name).join() === sig)
      if (same) same.names.push(part.name)
      else groups.push({ names: [part.name], keys })
    }
    return groups.map((g) => ({ item, names: g.names, page: !!getItem(item), keys: g.keys.map((k): [string, string, string] => [k.name, k.default ?? k.type, k.description]) }))
  })
}

/** The components that format with `locale` (or a calendar's `calendarLocale`), and how. */
export const localeProps = () =>
  parts.flatMap(([item, list]) => list.flatMap((part) => part.props.filter((p) => p.name === "locale" || p.name === "calendarLocale").map((p) => ({ item, part: part.name, prop: p }))))
