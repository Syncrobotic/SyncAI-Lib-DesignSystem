import { blockListOfType } from "./block-list"
import { blockGroups, blockTypes } from "./block-types"
import { groups, items } from "./catalog"

// README.md's counts and its two catalog tables, from the same data as the site, so they cannot drift (the 0.40 audit
// found the README at 87 and 95 components when the site had 122, and its groups were the 0.2x ones).
// tests/unit/readme.test.ts fails when README.md differs; `npm run readme` writes it.

const code = (names: string[]) => names.map((n) => `\`${n}\``).join(", ")

export function readmeCounts() {
  const components = items.filter((i) => i.group !== "Hooks & libraries").length
  const blocks = blockTypes.filter((t) => !t.home).reduce((n, t) => n + blockListOfType(t.slug).length, 0)
  const patterns = blockTypes.filter((t) => t.home).reduce((n, t) => n + blockListOfType(t.slug).length, 0)
  return { components, blocks, patterns }
}

/** Every component, by its catalog group, in the site's order; then the icons and the hooks and libraries. */
export function readmeComponents() {
  const rows = ["| Group | Components |", "| --- | --- |"]
  for (const g of groups) {
    const names = items.filter((i) => i.group === g).map((i) => i.name)
    if (names.length) rows.push(`| ${g} | ${code(names)} |`)
  }
  rows.push("| Icons | `robot-icons` (robot icons Lucide lacks, drawn to match) |")
  return rows.join("\n")
}

/** Every block by group and type, then the patterns by the component whose page shows them. */
export function readmeBlocks() {
  const rows = ["| Group | Type | Blocks |", "| --- | --- | --- |"]
  const title = (slug: string) => items.find((i) => i.name === slug)?.title ?? slug
  for (const g of blockGroups)
    for (const t of blockTypes.filter((x) => x.group === g && !x.home)) {
      const names = blockListOfType(t.slug).map((b) => b.name)
      if (names.length) rows.push(`| ${g} | ${t.title} | ${code(names)} |`)
    }
  for (const t of blockTypes.filter((x) => x.home)) {
    const names = blockListOfType(t.slug).map((b) => b.name)
    if (names.length) rows.push(`| Patterns: ${title(t.home!)} | ${t.title} | ${code(names)} |`)
  }
  return rows.join("\n")
}

/** README.md as it should read: the counts in its prose and the two tables between their markers. */
export function readmeFrom(text: string) {
  const { components, blocks, patterns } = readmeCounts()
  const swap = (from: string, name: string, body: string) => {
    const re = new RegExp(`(<!-- ${name} -->\\n)[\\s\\S]*?(\\n<!-- /${name} -->)`)
    if (!re.test(from)) throw new Error(`README.md has no <!-- ${name} --> … <!-- /${name} --> markers`)
    return from.replace(re, `$1${body}$2`)
  }
  let out = text
    .replace(/\d+ React components, \d+ blocks and \d+ patterns/, `${components} React components, ${blocks} blocks and ${patterns} patterns`)
    .replace(/\| \*\*\d+ components\*\* \|/, `| **${components} components** |`)
    .replace(/\| \*\*\d+ blocks, \d+ patterns\*\* \|/, `| **${blocks} blocks, ${patterns} patterns** |`)
  out = swap(out, "catalog:components", readmeComponents())
  out = swap(out, "catalog:blocks", readmeBlocks())
  return out
}
