import { readdirSync } from "node:fs"
import { join } from "node:path"
import { blocks } from "./blocks"
import { blockTypes } from "./block-types"
import { items, readSource } from "./catalog"
import { foundations } from "./foundations"
import { iconGroups } from "./icons"
import { overviews } from "./overview"
import { scopes } from "./scopes"

/** One thing the site search can land on. `group` heads its section in the results; `text` is what it is also found by. */
export type SearchEntry = { group: "Pages" | "Foundations" | "Components" | "Blocks" | "Icons"; title: string; href: string; hint?: string; text?: string }

// The headings of a foundation page, read from its <Section id="…" title="…"> calls, so a rule is found by its name.
function sections(slug: string) {
  const src = readSource(join("app/(site)/(docs)/docs/foundations", slug, "page.tsx"))
  return [...src.matchAll(/<Section\s[^>]*?id="([^"]+)"[^>]*?title="([^"]+)"/g)].map((m) => ({ id: m[1], title: m[2] }))
}

/** Built once at build time and served as static JSON, so the search costs nothing until someone opens it. */
export function buildSearchIndex(): SearchEntry[] {
  const out: SearchEntry[] = []
  const pages = scopes.find((s) => s.key === "foundations")!.groups[0].links
  for (const p of pages) out.push({ group: "Pages", title: p.label, href: p.href })
  out.push({ group: "Pages", title: "Components", href: "/docs/components", hint: "Every component by group" }, { group: "Pages", title: "Blocks", href: "/blocks", hint: "Whole screens" })

  for (const f of foundations) {
    out.push({ group: "Foundations", title: f.title, href: `/docs/foundations/${f.slug}`, hint: f.lead })
    const dir = join(process.cwd(), "app/(site)/(docs)/docs/foundations", f.slug)
    if (!readdirSync(dir).includes("page.tsx")) continue
    for (const s of sections(f.slug)) out.push({ group: "Foundations", title: s.title, href: `/docs/foundations/${f.slug}#${s.id}`, hint: f.title })
  }

  for (const i of items) {
    const o = overviews[i.name]
    out.push({ group: "Components", title: i.title, href: `/docs/components/${i.name}`, hint: o?.what ?? i.description, text: [i.name, i.group, ...(o?.use ?? [])].join(" ") })
  }

  for (const t of blockTypes) {
    const inType = blocks.filter((b) => b.type === t.slug)
    if (inType.length === 0) continue
    out.push({ group: "Blocks", title: t.title, href: `/blocks/${t.slug}`, hint: t.description })
    for (const b of inType) out.push({ group: "Blocks", title: b.title, href: `/blocks/${t.slug}#${b.name}`, hint: b.description, text: `${b.name} ${t.title}` })
  }

  for (const g of iconGroups) for (const ic of g.icons) out.push({ group: "Icons", title: ic.name, href: `/icons?icon=${encodeURIComponent(ic.name)}`, hint: ic.means, text: g.title })
  return out
}
