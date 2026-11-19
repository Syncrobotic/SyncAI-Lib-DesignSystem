import props from "./props.json"

export type Prop = { name: string; type: string; default?: string; required?: boolean; description: string }
export type Part = { name: string; props: Prop[]; inherits: string[] }

const table = props as unknown as Record<string, Part[]>

/** The parts an item exports and their props, generated from the source (scripts/props.mjs), so it never drifts. */
export function propsOf(name: string): Part[] {
  return table[name] ?? []
}
