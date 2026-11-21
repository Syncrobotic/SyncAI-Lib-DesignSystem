import { pageMeta } from "./config"

// The design language, page by page. Drives the sidebar, the overview, the home page and the sitemap.
export const foundations = [
  { slug: "principles", title: "Principles", lead: "Five decisions every screen inherits." },
  { slug: "color", title: "Colour", lead: "Semantic tokens, one meaning per colour, paired foreground and tint." },
  { slug: "typography", title: "Typography", lead: "Nine sizes on a 4 px rhythm, three weights, tabular numbers." },
  { slug: "spacing", title: "Spacing", lead: "A 4 px base and six steps. Nothing in between." },
  { slug: "radius", title: "Radius", lead: "Six steps that keep nested corners concentric." },
  { slug: "elevation", title: "Elevation", lead: "Three layers: surface, float, overlay." },
  { slug: "motion", title: "Motion", lead: "Movement only marks a change of state." },
  { slug: "iconography", title: "Iconography", lead: "Lucide at three sizes, always with a name." },
  { slug: "accessibility", title: "Accessibility", lead: "Contrast, target size, focus and motion, checked at build time." },
  { slug: "alarms", title: "Alarms", lead: "Three priorities, one lifecycle, and which surface each message belongs on." },
  { slug: "data-visualisation", title: "Data visualisation", lead: "The form first, colour by job, a palette checked for colour blindness." },
] as const

export type FoundationSlug = (typeof foundations)[number]["slug"]

export const foundation = (slug: FoundationSlug) => foundations.find((f) => f.slug === slug)!

/** Getting started, in sidebar order, then into the foundations: each page's previous and next. */
const start = [
  { href: "/docs/foundations", title: "Overview" },
  { href: "/docs/installation", title: "Installation" },
  { href: "/docs/robotics", title: "Robotics UI kit" },
  { href: "/docs/nextjs", title: "Next.js" },
  { href: "/docs/localisation", title: "Localisation" },
  { href: "/docs/tokens", title: "Design tokens" },
  { href: "/docs/upgrading", title: "Versions and upgrades" },
  { href: "/docs/ai", title: "For AI agents" },
]

export function startNeighbours(href: string) {
  const i = start.findIndex((p) => p.href === href)
  const first = { href: `/docs/foundations/${foundations[0].slug}`, title: foundations[0].title }
  return { prev: start[i - 1], next: start[i + 1] ?? first }
}

export function neighbours(slug: FoundationSlug) {
  const i = foundations.findIndex((f) => f.slug === slug)
  const link = (f?: (typeof foundations)[number]) => (f ? { href: `/docs/foundations/${f.slug}`, title: f.title } : undefined)
  return {
    prev: i === 0 ? start[start.length - 1] : link(foundations[i - 1]),
    next: i === foundations.length - 1 ? { href: "/docs/components", title: "Components" } : link(foundations[i + 1]),
  }
}

export const metaFor = (slug: FoundationSlug) => {
  const f = foundation(slug)
  return pageMeta({ title: `${f.title} — design tokens`, description: f.lead, path: `/docs/foundations/${slug}` })
}
