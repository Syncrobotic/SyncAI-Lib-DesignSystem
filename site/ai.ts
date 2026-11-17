import registry from "../registry.json"
import { groups, items, getItem, readSource, storyNames, storyTitle } from "./catalog"
import { site } from "./config"
import { foundations } from "./foundations"
import { overviews } from "./overview"

// The kit as AI agents read it: llms.txt, llms-full.txt and a markdown twin of every page (its URL plus .md).
// Everything comes from the same data the pages render, so the two never disagree.

type Meta = { version: string; changelog: { version: string; date: string; note: string }[] }
type RegistryItem = (typeof registry.items)[number] & { meta?: Meta; registryDependencies?: string[]; dependencies?: string[] }

const url = (path: string) => `${site.url}${path}`
const install = (name: string) => `npx shadcn add @syncrobotic/${name}`
const all = registry.items as RegistryItem[]
const blocks = all.filter((i) => i.type === "registry:block")

/** `name` in prose becomes a link to that item's markdown twin. */
const link = (text: string) =>
  text.replace(/`([a-z0-9-]+)`/g, (m, name) => {
    const it = getItem(name)
    return it ? `[${it.title}](${url(`/docs/components/${name}.md`)})` : m
  })

const list = (xs: string[]) => xs.map((x) => `- ${link(x)}`).join("\n")

export function componentMarkdown(name: string) {
  const item = getItem(name)
  if (!item) return null
  const meta = (item as unknown as RegistryItem).meta
  const o = overviews[name]
  const deps = [...((item as unknown as RegistryItem).dependencies ?? []), ...((item as unknown as RegistryItem).registryDependencies ?? [])]
  const out = [
    `# ${item.title}`,
    "",
    `> ${item.description ?? ""}`,
    "",
    `- Group: ${item.group}`,
    `- Version: ${meta?.version ?? "unversioned"}`,
    `- Install: \`${install(name)}\``,
    ...(deps.length ? [`- Also installs: ${deps.join(", ")}`] : []),
    `- Page: ${url(`/docs/components/${name}`)}`,
    `- Source: ${site.repo}/blob/main/${item.files[0].path}`,
  ]
  if (o) {
    out.push("", "## What it is", "", link(o.what), "", "## When to use", "", list(o.use))
    if (o.instead?.length) out.push("", "## When not to use", "", list(o.instead))
    if (o.notes?.length) out.push("", "## Agent notes", "", list(o.notes))
  }
  if (item.rules?.length) out.push("", "## Rules", "", list(item.rules))
  if (item.keyboard?.length) out.push("", "## Keyboard", "", "| Keys | Action |", "| --- | --- |", ...item.keyboard.map(([k, a]) => `| ${k} | ${a} |`))
  if (item.examples)
    out.push("", "## Examples", "", ...storyNames(item.examples).map((n) => `- ${storyTitle(n)}: ${url(`/docs/components/${name}#example-${n}`)}`))
  if (!item.examples) out.push("", "## Source", "", "```tsx", readSource(item.files[0].path).trim(), "```")
  if (meta?.changelog?.length) out.push("", "## Changelog", "", ...meta.changelog.slice(0, 5).map((c) => `- ${c.version} (${c.date}): ${c.note}`))
  out.push("", `Index: ${url("/llms.txt")}`)
  return out.join("\n") + "\n"
}

export function blockMarkdown(name: string) {
  const b = blocks.find((x) => x.name === name)
  if (!b) return null
  const uses = (b.registryDependencies ?? []).map((d) => d.replace("@syncrobotic/", "")).filter((d) => d !== "cn")
  return (
    [
      `# ${b.title}`,
      "",
      `> ${b.description}`,
      "",
      `- Type: block (a whole screen or section; install it, then replace the sample data)`,
      `- Version: ${b.meta?.version ?? "unversioned"}`,
      `- Install: \`${install(name)}\``,
      `- Preview: ${url(`/preview/${name}`)}`,
      `- Page: ${url(`/blocks/${name}`)}`,
      `- Source: ${site.repo}/blob/main/${b.files[0].path}`,
      "",
      "## Built from",
      "",
      ...uses.map((u) => (getItem(u) ? `- [${getItem(u)!.title}](${url(`/docs/components/${u}.md`)})` : `- ${u}`)),
      "",
      "## Agent notes",
      "",
      "- Keep the block's structure and classes; replace the sample data and the hrefs, wire your router through `linkAs` where offered.",
      "- App-shell blocks take `layout`, `search`, `breadcrumb`, `footer`, `user` and `userMenu`; read the app-shell twin before adding your own chrome.",
      "",
      `Index: ${url("/llms.txt")}`,
    ].join("\n") + "\n"
  )
}

export function foundationMarkdown(slug: string) {
  const f = foundations.find((x) => x.slug === slug)
  if (!f) return null
  return (
    [`# ${f.title}`, "", `> ${f.lead}`, "", `- Page: ${url(`/docs/foundations/${slug}`)}`, "", designLanguage(), "", `Index: ${url("/llms.txt")}`].join("\n") +
    "\n"
  )
}

/** The design language for agents, from the agent skill's reference, so the skill and the site say the same thing. */
export const designLanguage = () => readSource("registry/syncrobotic/skill/references/design-language.md").trim()

const intro = [
  `# ${site.name}`,
  "",
  `> ${site.description}`,
  "",
  "Install rule: every item installs with the shadcn CLI as `@syncrobotic/<name>` (`npx shadcn add @syncrobotic/<name>`), as source the project owns. Start with the theme: `npx shadcn add @syncrobotic/syncrobotic-theme`.",
  "",
  "Every page below also answers as plain markdown at its URL plus `.md`: what the item is, when to use it, when not to (and what to use instead), rules, keyboard, agent notes, install command and version.",
  "",
  "Agents: install the workflow and the rules as a skill with `npx shadcn add @syncrobotic/agent-skill` (it lands in `.claude/skills/syncrobotic-ui/`).",
  "",
  `MCP: the same content as tools (search, get_item, get_install_command, get_design_language, get_checklist) at ${url("/mcp")} (Streamable HTTP). Claude Code: \`claude mcp add --transport http syncrobotic ${url("/mcp")}\`.`,
]

export function llmsTxt() {
  const out = [...intro, "", "## Foundations", ""]
  for (const f of foundations) out.push(`- [${f.title}](${url(`/docs/foundations/${f.slug}.md`)}): ${f.lead}`)
  out.push("", "## Blocks", "")
  for (const b of blocks) out.push(`- [${b.title}](${url(`/blocks/${b.name}.md`)}): ${b.description}`)
  for (const g of groups) {
    const inGroup = items.filter((i) => i.group === g)
    if (!inGroup.length) continue
    out.push("", `## Components: ${g}`, "")
    for (const i of inGroup) out.push(`- [${i.title}](${url(`/docs/components/${i.name}.md`)}): ${i.description ?? ""}`)
  }
  out.push(
    "",
    "## More",
    "",
    `- [Full catalog](${url("/llms-full.txt")}): every item with its when to use and agent notes, and the design language.`,
    `- [Repository](${site.repo})`,
  )
  return out.join("\n") + "\n"
}

export function llmsFull() {
  const out = [...intro, "", designLanguage(), "", "# Blocks", ""]
  for (const b of blocks) out.push(`- **${b.title}** (\`${b.name}\`): ${b.description} Install: \`${install(b.name)}\``)
  out.push("", "# Components", "")
  for (const i of items) {
    const o = overviews[i.name]
    out.push(`## ${i.title} (\`${i.name}\`, ${i.group})`, "", i.description ?? "", "")
    if (o) {
      out.push(`Use for: ${o.use.join(" ")}`)
      if (o.instead?.length) out.push(`Not for: ${o.instead.join(" ")}`)
      if (o.notes?.length) out.push(`Agent notes: ${o.notes.join(" ")}`)
    }
    out.push(`Install: \`${install(i.name)}\` · ${url(`/docs/components/${i.name}.md`)}`, "")
  }
  return out.join("\n") + "\n"
}

export const markdownResponse = (body: string | null) =>
  body === null ? new Response("Not found", { status: 404 }) : new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } })

export const blockNames = () => blocks.map((b) => b.name)

/** A prompt that hands an agent this item: what to install and where its rules are. */
export const aiPrompt = (title: string, path: string, name: string) =>
  [
    `Use the SYNCROBOTIC ${title} (@syncrobotic/${name}) in this project.`,
    `1. Install it: ${install(name)}`,
    `2. Read ${url(`${path}.md`)} and follow its rules and agent notes; the design language is in ${url("/llms-full.txt")}.`,
    "3. Keep its structure and tokens; replace only the sample data. Do not invent props: read the installed source.",
    "4. Check: tokens only, 44 px targets on touch, colour only for abnormal states, every duration with ease-(--ease-standard).",
  ].join("\n")
