import { blockListOfType as blocksOfType } from "./block-list"
import { blockGroups, blockTypes, patternsOf } from "./block-types"
import { groups as itemGroups, items, storyNames, storyTitle } from "./catalog"
import { foundations } from "./foundations"
import { choosing } from "./choosing"
import { iconCategories, iconCount } from "./icons"

// The site's areas, as ReUI and shadcn name them: Docs, Components, Blocks. The header links to each; the sidebar shows only the area you are in.
export type NavLink = {
  href: string
  label: string
  /** In-page anchors (`#…`, under the link's own page: every page carries this list, so not its path again) or filters (?category=…), listed under the link while its page is open; `count` shows beside one. */ sections?: { href: string; label: string; count?: number }[]
  /** A beta item: its API may still change in a minor release. */ beta?: boolean
}
export type NavGroup = { title: string; links: NavLink[] }
export type Scope = { key: string; label: string; href: string; match: string[]; groups: NavGroup[] }

export const scopes: Scope[] = [
  {
    key: "docs",
    label: "Docs",
    href: "/docs",
    match: ["/docs", "/docs/foundations", "/docs/installation", "/docs/robotics", "/docs/ros", "/docs/nextjs", "/docs/localisation", "/docs/tokens", "/docs/upgrading", "/docs/migrating-from-local-components", "/docs/ai", "/docs/choosing"],
    groups: [
      {
        title: "Getting started",
        links: [
          { href: "/docs", label: "Introduction" },
          { href: "/docs/installation", label: "Installation" },
          { href: "/docs/robotics", label: "Robotics UI kit" },
          { href: "/docs/ros", label: "Connect to ROS" },
          { href: "/docs/nextjs", label: "Next.js" },
          { href: "/docs/nextjs/data", label: "Next.js forms and lists" },
          { href: "/docs/localisation", label: "Localisation" },
          { href: "/docs/tokens", label: "Design tokens" },
          { href: "/docs/upgrading", label: "Versions and upgrades" },
          { href: "/docs/migrating-from-local-components", label: "Migrating to the kit" },
          { href: "/docs/ai", label: "For AI agents" },
        ],
      },
      {
        title: "Foundations",
        links: foundations.map((f) => ({ href: `/docs/foundations/${f.slug}`, label: f.title })),
      },
      { title: "Choosing", links: choosing.map((c) => ({ href: `/docs/choosing/${c.slug}`, label: c.nav })) },
    ],
  },
  {
    key: "components",
    label: "Components",
    href: "/docs/components",
    match: ["/docs/components"],
    groups: [
      { title: "Browse", links: [{ href: "/docs/components", label: "All components" }] },
      ...itemGroups.map((g) => ({
      title: g,
      links: items
        .filter((i) => i.group === g)
        .map((i) => ({
          href: `/docs/components/${i.name}`,
          label: i.title,
          beta: (i as { meta?: { status?: string } }).meta?.status === "beta",
          // The page's examples, so you can jump to one; as ReUI lists them, without a second table of contents.
          // Then its pattern sets (Line chart, Heatmap…), so a chart is found under Chart, not under Blocks.
          sections: [
            ...(i.examples ? storyNames(i.examples).map((n) => ({ href: `#example-${n}`, label: storyTitle(n, i.name) })) : []),
            ...patternsOf(i.name)
              .filter((t) => blocksOfType(t.slug).length > 0)
              .map((t) => ({ href: `#${t.slug}`, label: t.title })),
          ],
        })),
      })),
    ],
  },
  {
    key: "blocks",
    label: "Blocks",
    href: "/blocks",
    match: ["/blocks"],
    groups: [
      { title: "Browse", links: [{ href: "/blocks", label: "All blocks" }] },
      // Like components: a group, its types, and under the open type the blocks it holds. A component's patterns are on
      // its page, so they are listed under Components.
      ...blockGroups
        .map((g) => ({
          title: g,
          links: blockTypes
            .filter((t) => t.group === g && !t.home && blocksOfType(t.slug).length > 0)
            .map((t) => ({
              href: `/blocks/${t.slug}`,
              label: t.title,
              beta: blocksOfType(t.slug).some((b) => b.status === "beta"),
              sections: blocksOfType(t.slug).map((b) => ({ href: `#${b.name}`, label: b.title })),
            })),
        }))
        .filter((g) => g.links.length > 0),
    ],
  },
  {
    key: "icons",
    label: "Icons",
    href: "/icons",
    match: ["/icons"],
    groups: [
      {
        title: "Browse",
        links: [
          {
            href: "/icons",
            label: "Kit icons",
            // The categories, as the page's sections: picking one filters the grid (the gallery reads ?category=).
            sections: [{ href: "/icons", label: "All icons", count: iconCount }, ...iconCategories.map((c) => ({ href: `/icons?category=${c.slug}`, label: c.title, count: c.count }))],
          },
          { href: "/icons/lucide", label: "All Lucide" },
        ],
      },
      { title: "Rules", links: [{ href: "/docs/foundations/iconography", label: "Iconography" }] },
    ],
  },
]

/** Header links: the three areas plus installation. */
export const headerLinks = scopes.map(({ key, label, href, match }) => ({ key, label, href, match }))
