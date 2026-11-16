// The design language, page by page. Drives the sidebar, the overview, the home page and the sitemap.
export const foundations = [
  { slug: "principles", title: "Principles", lead: "Five decisions every screen inherits." },
  { slug: "color", title: "Color", lead: "Semantic tokens, one meaning per colour, paired foreground and tint." },
  { slug: "typography", title: "Typography", lead: "Six sizes on a 4 px rhythm, three weights, tabular numbers." },
  { slug: "spacing", title: "Spacing", lead: "A 4 px base and six steps. Nothing in between." },
  { slug: "radius", title: "Radius", lead: "Five steps that keep nested corners concentric." },
  { slug: "elevation", title: "Elevation", lead: "Three layers: surface, float, overlay." },
  { slug: "motion", title: "Motion", lead: "Movement only marks a change of state." },
  { slug: "iconography", title: "Iconography", lead: "Lucide at three sizes, always with a name." },
  { slug: "accessibility", title: "Accessibility", lead: "Contrast, target size, focus and motion, checked at build time." },
] as const

export type FoundationSlug = (typeof foundations)[number]["slug"]

export const foundation = (slug: FoundationSlug) => foundations.find((f) => f.slug === slug)!

export function neighbours(slug: FoundationSlug) {
  const i = foundations.findIndex((f) => f.slug === slug)
  const link = (f?: (typeof foundations)[number]) => (f ? { href: `/docs/foundations/${f.slug}`, title: f.title } : undefined)
  return {
    prev: i === 0 ? { href: "/docs/foundations", title: "Foundations overview" } : link(foundations[i - 1]),
    next: i === foundations.length - 1 ? { href: "/docs/components/button", title: "Components" } : link(foundations[i + 1]),
  }
}

export const metaFor = (slug: FoundationSlug) => {
  const f = foundation(slug)
  const path = `/docs/foundations/${slug}`
  return { title: `${f.title} — design tokens`, description: f.lead, alternates: { canonical: path }, openGraph: { title: f.title, description: f.lead, url: path } }
}
