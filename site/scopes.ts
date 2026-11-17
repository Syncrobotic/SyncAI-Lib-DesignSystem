import { blocks, products } from "./blocks"
import { groups as itemGroups, items } from "./catalog"
import { foundations } from "./foundations"

// The site's three areas. The header links to each; the sidebar shows only the area you are in.
export type NavGroup = { title: string; links: { href: string; label: string }[] }
export type Scope = { key: string; label: string; href: string; match: string[]; groups: NavGroup[] }

export const scopes: Scope[] = [
  {
    key: "foundations",
    label: "Foundations",
    href: "/docs/foundations",
    match: ["/docs/foundations", "/docs/installation", "/docs/tokens", "/docs/upgrading"],
    groups: [
      {
        title: "Getting started",
        links: [
          { href: "/docs/foundations", label: "Overview" },
          { href: "/docs/installation", label: "Installation" },
          { href: "/docs/tokens", label: "Design tokens" },
          { href: "/docs/upgrading", label: "Versions and upgrades" },
        ],
      },
      { title: "Foundations", links: foundations.map((f) => ({ href: `/docs/foundations/${f.slug}`, label: f.title })) },
    ],
  },
  {
    key: "components",
    label: "Components",
    href: "/docs/components/button",
    match: ["/docs/components"],
    groups: itemGroups.map((g) => ({
      title: g,
      links: items.filter((i) => i.group === g).map((i) => ({ href: `/docs/components/${i.name}`, label: i.title })),
    })),
  },
  {
    key: "blocks",
    label: "Blocks",
    href: "/blocks",
    match: ["/blocks"],
    groups: [
      { title: "Blocks", links: [{ href: "/blocks", label: "All blocks" }] },
      ...products.map((p) => ({
        title: p,
        links: blocks.filter((b) => b.product === p).map((b) => ({ href: `/blocks/${b.name}`, label: b.title })),
      })),
    ],
  },
]

/** Header links: the three areas plus installation. */
export const headerLinks = scopes.map(({ key, label, href, match }) => ({ key, label, href, match }))
