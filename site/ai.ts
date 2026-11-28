import { choosing, choosingFor } from "./choosing"
import registry from "../registry.json"
import { propsOf } from "./props-data"
import { blockFlags, blockGroups, blockHref, blockTypes, getBlockType, placement, wiringText } from "./block-types"
import { groups, items, getItem, readSource, storyNames, storyTitle } from "./catalog"
import { site } from "./config"
import { foundations } from "./foundations"
import { iconCount, iconGroups, kitIconCount } from "./icons"
import { overviews } from "./overview"
import { a11yMarkdown } from "./a11y"
import { promptFor } from "./ai-prompt"

// The kit as AI agents read it: llms.txt, llms-full.txt and a markdown twin of every page (its URL plus .md).
// Everything comes from the same data the pages render, so the two never disagree.

type Meta = { version: string; changelog: { version: string; date: string; note: string }[] }
type RegistryItem = (typeof registry.items)[number] & { meta?: Meta; registryDependencies?: string[]; dependencies?: string[] }

const url = (path: string) => `${site.url}${path}`
const install = (name: string) => `npx shadcn add @syncrobotic/${name}`
const all = registry.items as RegistryItem[]
const blocks = all.filter((i) => i.type === "registry:block")

/** `name` in prose becomes a link to that item's markdown twin, `/blocks/type` to that block type's page. */
const link = (text: string) =>
  text
    .replace(/`([a-z0-9-]+)`/g, (m, name) => {
      const it = getItem(name)
      return it ? `[${it.title}](${url(`/docs/components/${name}.md`)})` : m
    })
    .replace(/`\/blocks\/([a-z0-9-]+)`/g, (m, slug) => {
      const t = getBlockType(slug)
      return t ? `[${t.title}](${url(`/blocks/${slug}`)})` : m
    })

const list = (xs: string[]) => xs.map((x) => `- ${link(x)}`).join("\n")

/** A block's status and wiring in a few words, for index lines: "beta, demo data". */
const flagsOf = (meta: unknown) => {
  const f = blockFlags(meta)
  return `${f.status}, ${f.wiring === "demo" ? "demo data" : "controlled"}`
}

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
    `- Status: ${meta?.status === "beta" ? "beta (the API may still change in a minor release)" : "stable (breaks only after a release marks the old way Deprecated, with a migration line)"}`,
    `- Install: \`${install(name)}\``,
    ...(deps.length ? [`- Also installs: ${deps.join(", ")}`] : []),
    `- Page: ${url(`/docs/components/${name}`)}`,
    `- Source: ${site.repo}/blob/main/${item.files[0].path}`,
  ]
  if (o) {
    out.push("", "## When to use", "", list(o.use))
    if (o.instead?.length) out.push("", "## When not to use", "", list(o.instead))
    if (o.notes?.length) out.push("", "## Agent notes", "", list(o.notes))
    for (const c of choosingFor(name)) out.push("", `Which one: [${c.title}](${url(`/docs/choosing/${c.slug}`)}). ${c.rule}`)
  }
  if (item.rules?.length) out.push("", "## Rules", "", list(item.rules))
  if (item.keyboard?.length) out.push("", "## Keyboard", "", "| Keys | Action |", "| --- | --- |", ...item.keyboard.map(([k, a]) => `| ${k} | ${a} |`))
  out.push(...a11yMarkdown(name))
  // The API, generated from the types: own props, then what the rest come from.
  const api = propsOf(name).filter((p) => p.props.length || p.inherits.length)
  if (api.length) {
    out.push("", "## API")
    for (const part of api) {
      out.push("", `### ${part.name}`)
      if (part.inherits.length) out.push("", `${part.props.length ? "Also takes" : "Takes"} every prop of ${part.inherits.map((i) => `\`${i}\``).join(", ")}.`)
      if (part.props.length)
        out.push("", "| Prop | Type | Default | Description |", "| --- | --- | --- | --- |", ...part.props.map((p) => `| \`${p.name}\`${p.required ? " (required)" : ""} | \`${p.type.replace(/\|/g, "\\|")}\` | ${p.default !== undefined ? `\`${p.default}\`` : ""} | ${p.description.replace(/\|/g, "\\|")} |`))
    }
  }
  if (item.examples)
    out.push("", "## Examples", "", ...storyNames(item.examples).map((n) => `- ${storyTitle(n, name)}: ${url(`/docs/components/${name}#example-${n}`)}`))
  if (!item.examples) out.push("", "## Source", "", "```tsx", readSource(item.files[0].path).trim(), "```")
  if (meta?.changelog?.length) out.push("", "## Changelog", "", ...meta.changelog.slice(0, 5).map((c) => `- ${c.version} (${c.date}): ${c.note}`))
  out.push("", `Index: ${url("/llms.txt")}`)
  return out.join("\n") + "\n"
}

/** Notes for one block, after the ones every block has. */
const blockNotes: Record<string, string[]> = {
  "status-pages": [
    `In Next.js an error in the root layout is caught by \`app/global-error.tsx\`, never by \`error.tsx\` (which sits inside that layout). It replaces the layout, so it renders its own \`<html>\` and \`<body>\` with the font, \`globals.css\` and the theme script around StatusPage: ${url("/blocks/states#nextjs")}`,
  ],
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
      (() => {
        const t = placement[name] ? getBlockType(placement[name].type) : undefined
        if (t?.home) return `- Type: pattern of \`${t.home}\` › ${t.title} (a ready-made use of one component; install it, then replace the sample data)`
        return `- Type: block${t ? ` in ${t.group} › ${t.title}` : ""} (a whole screen or section; install it, then replace the sample data)`
      })(),
      `- Version: ${b.meta?.version ?? "unversioned"}`,
      `- Status: ${blockFlags(b.meta).status === "beta" ? "beta (its props and structure may still change in a minor release)" : "stable"}`,
      `- Wiring: ${blockFlags(b.meta).wiring}. ${wiringText[blockFlags(b.meta).wiring].line}`,
      `- Install: \`${install(name)}\``,
      `- Preview: ${url(`/preview/${name}`)}`,
      `- Page: ${url(blockHref(name))}`,
      `- Source: ${site.repo}/blob/main/${b.files[0].path}`,
      "",
      "## Built from",
      "",
      ...uses.map((u) => (getItem(u) ? `- [${getItem(u)!.title}](${url(`/docs/components/${u}.md`)})` : `- ${u}`)),
      "",
      "## Agent notes",
      "",
      blockFlags(b.meta).wiring === "controlled"
        ? "- Keep the block's structure and classes; pass your data and handlers as props, wire your router through `linkAs` where offered."
        : "- Keep the block's structure and classes; replace the sample data and the hrefs, wire your router through `linkAs` where offered.",
      "- App-shell blocks take `layout`, `search`, `breadcrumb`, `footer`, `user` and `userMenu`; read the app-shell twin before adding your own chrome.",
      ...(blockNotes[name] ?? []).map((n) => `- ${n}`),
      "",
      `Index: ${url("/llms.txt")}`,
    ].join("\n") + "\n"
  )
}

const kitIcons = iconGroups.flatMap((g) => g.icons.filter((i) => i.from).map((i) => ({ ...i, group: g.title })))

/** robot-icons, the one installable item that is neither a component page nor a block: the icons it draws, by meaning. */
export function robotIconsMarkdown(name: string) {
  const r = name === "robot-icons" ? all.find((i) => i.name === name) : undefined
  if (!r) return null
  return (
    [
      `# ${r.title}`,
      "",
      `> ${r.description}`,
      "",
      `- Version: ${r.meta?.version ?? "unversioned"}`,
      `- Install: \`${install(name)}\``,
      `- Page: ${url("/icons")}`,
      `- Source: ${site.repo}/blob/main/${r.files[0].path}`,
      "",
      "## Icons",
      "",
      ...kitIcons.map((i) => `- ${i.name} (${i.group}): ${i.means}`),
      "",
      "## Agent notes",
      "",
      "- Import from the installed file (`@/components/ui/robot-icons`), not lucide-react; each takes Lucide's props.",
      "- Use one only for the meaning listed; every other meaning has a Lucide icon in the icon set (llms-full.txt).",
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
  "Status: a stable item breaks only in a release that says Breaking, after an earlier release marked the old way Deprecated; a beta item may change in any minor. Prefer stable items. At most one minor release a week. Policy: " + url("/docs/upgrading#status") + ".",
  "",
  "Which one when: when two items could do the job, the Choosing pages decide (listed below under Choosing).",
  "",
  "Agents: install the workflow and the rules as a skill with `npx shadcn add @syncrobotic/agent-skill` (it lands in `.claude/skills/syncrobotic-ui/`).",
  "",
  `MCP: the same content as tools (search, get_item, get_install_command, get_design_language, get_checklist) at ${url("/mcp")} (Streamable HTTP). Claude Code: \`claude mcp add --transport http syncrobotic ${url("/mcp")}\`.`,
]

export function llmsTxt() {
  const out = [...intro, "", "## Foundations", "", "Each foundation's `.md` twin carries the whole design language.", ""]
  for (const f of foundations) out.push(`- [${f.title}](${url(`/docs/foundations/${f.slug}.md`)}): ${f.lead}`)
  out.push(
    ...choosing.map((c) => `- Choosing: [${c.title}](${url(`/docs/choosing/${c.slug}`)}): ${c.rule}`),
    `- [Icon set](${url("/icons")}): the ${iconCount} icons the kit uses, one meaning each: ${iconCount - kitIconCount} from Lucide and ${kitIconCount} drawn for the kit (robot-icons: \`${install("robot-icons")}\`). Full list in llms-full.txt.`,
  )
  // Blocks by group and type, the way the site lists them; a component's patterns follow that component.
  for (const g of blockGroups) {
    for (const t of blockTypes.filter((x) => x.group === g && !x.home)) {
      const inType = blocks.filter((b) => placement[b.name]?.type === t.slug)
      if (!inType.length) continue
      out.push("", `## Blocks: ${g} › ${t.title}`, "")
      for (const b of inType) out.push(`- [${b.title}](${url(`/blocks/${b.name}.md`)}) (${flagsOf(b.meta)}): ${b.description}`)
    }
  }
  for (const g of groups) {
    const inGroup = items.filter((i) => i.group === g)
    if (!inGroup.length) continue
    out.push("", `## Components: ${g}`, "")
    for (const i of inGroup) {
      const beta = (i as unknown as { meta?: { status?: string } }).meta?.status === "beta"
      out.push(`- [${i.title}](${url(`/docs/components/${i.name}.md`)})${beta ? " (beta)" : ""}: ${i.description ?? ""}`)
      // Its patterns: ready-made uses of this one component, each installable under its own name.
      for (const t of blockTypes.filter((x) => x.home === i.name))
        for (const b of blocks.filter((x) => placement[x.name]?.type === t.slug))
          out.push(`  - Pattern, ${t.title}: [${b.title}](${url(`/blocks/${b.name}.md`)}) (${flagsOf(b.meta)}): ${b.description}`)
    }
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
  const out = [...intro, "", designLanguage(), "", "# Icon set", ""]
  out.push(
    `Icons by meaning, one meaning each. Use the icon listed for a meaning; do not import another Lucide icon for it. Those marked [kit] are not in Lucide: \`${install("robot-icons")}\`, then import from \`@/components/ui/robot-icons\`.`,
    "",
  )
  for (const g of iconGroups) out.push(`- ${g.title}: ${g.icons.map((i) => `${i.name}${i.from ? " [kit]" : ""} (${i.means})`).join("; ")}`)
  // Blocks as llms.txt lists them: by group and type, then the patterns by the component whose page shows them.
  const blockLine = (b: (typeof blocks)[number]) =>
    `- **${b.title}** (\`${b.name}\`, ${flagsOf(b.meta)}): ${b.description} Install: \`${install(b.name)}\``
  out.push("", "# Blocks")
  for (const g of blockGroups)
    for (const t of blockTypes.filter((x) => x.group === g && !x.home)) {
      const inType = blocks.filter((b) => placement[b.name]?.type === t.slug)
      if (inType.length) out.push("", `## ${g} › ${t.title}`, "", ...inType.map(blockLine))
    }
  for (const t of blockTypes.filter((x) => x.home)) {
    const inType = blocks.filter((b) => placement[b.name]?.type === t.slug)
    if (inType.length) out.push("", `## Patterns: ${getItem(t.home!)?.title ?? t.home} › ${t.title}`, "", ...inType.map(blockLine))
  }
  const unplaced = blocks.filter((b) => !placement[b.name])
  if (unplaced.length) out.push("", "## Other blocks", "", ...unplaced.map(blockLine))

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
export const aiPrompt = (title: string, path: string, name: string) => promptFor(site.url, title, path, name)
