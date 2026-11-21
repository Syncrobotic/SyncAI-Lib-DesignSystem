import { blocksOfType } from "./blocks"
import { blockGroups, blockTypes, patternsOf } from "./block-types"
import { groups as itemGroups, items, storyNames, storyTitle } from "./catalog"
import { foundations } from "./foundations"

// The site's three areas. The header links to each; the sidebar shows only the area you are in.
export type NavLink = {
  href: string
  label: string
  /** In-page anchors, listed under the link while its page is open. */ sections?: { href: string; label: string }[]
  /** A beta item: its API may still change in a minor release. */ beta?: boolean
}
export type NavGroup = { title: string; links: NavLink[] }
export type Scope = { key: string; label: string; href: string; match: string[]; groups: NavGroup[] }

export const scopes: Scope[] = [
  {
    key: "foundations",
    label: "Foundations",
    href: "/docs/foundations",
    match: ["/docs/foundations", "/docs/installation", "/docs/robotics", "/docs/nextjs", "/docs/localisation", "/docs/tokens", "/docs/upgrading", "/docs/ai"],
    groups: [
      {
        title: "Getting started",
        links: [
          { href: "/docs/foundations", label: "Overview" },
          { href: "/docs/installation", label: "Installation" },
          { href: "/docs/robotics", label: "Robotics UI kit" },
          { href: "/docs/nextjs", label: "Next.js" },
          { href: "/docs/localisation", label: "Localisation" },
          { href: "/docs/tokens", label: "Design tokens" },
          { href: "/docs/upgrading", label: "Versions and upgrades" },
          { href: "/docs/ai", label: "For AI agents" },
        ],
      },
      {
        title: "Foundations",
        links: foundations.map((f) => ({ href: `/docs/foundations/${f.slug}`, label: f.title })),
      },
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
            ...(i.examples ? storyNames(i.examples).map((n) => ({ href: `/docs/components/${i.name}#example-${n}`, label: storyTitle(n) })) : []),
            ...patternsOf(i.name)
              .filter((t) => blocksOfType(t.slug).length > 0)
              .map((t) => ({ href: `/docs/components/${i.name}#${t.slug}`, label: t.title })),
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
      // Like components: a group, its types, and under the open type the blocks it holds.
      ...blockGroups
        .map((g) => ({
          title: g,
          links: blockTypes
            .filter((t) => t.group === g && blocksOfType(t.slug).length > 0)
            .map((t) => ({
              href: `/blocks/${t.slug}`,
              label: t.title,
              sections: blocksOfType(t.slug).map((b) => ({ href: `/blocks/${t.slug}#${b.name}`, label: b.title })),
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
          { href: "/icons", label: "Kit icons" },
          { href: "/icons/lucide", label: "All Lucide" },
        ],
      },
      { title: "Rules", links: [{ href: "/docs/foundations/iconography", label: "Iconography" }] },
    ],
  },
]

/** Header links: the three areas plus installation. */
export const headerLinks = scopes.map(({ key, label, href, match }) => ({ key, label, href, match }))
