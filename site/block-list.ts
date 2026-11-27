import registry from "../registry.json"
import { blockFlags, placement } from "./block-types"

/**
 * The blocks' names, titles and types, without their components: for the navigation, which every page renders. Reading
 * them from site/blocks.tsx would import every block (and recharts) into every page's scripts.
 */
export const blockList = Object.keys(placement)
  .map((name) => registry.items.find((i) => i.type === "registry:block" && i.name === name))
  .filter((i): i is NonNullable<typeof i> => !!i)
  .map((i) => ({ name: i.name, title: i.title, type: placement[i.name].type, ...blockFlags(i.meta) }))

export const blockListOfType = (slug: string) => blockList.filter((b) => b.type === slug)
