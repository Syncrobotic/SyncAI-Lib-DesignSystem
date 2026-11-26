import { site, snippet } from "@/site/config"

export type Crumb = { name: string; path: string }

/**
 * Structured data for a docs page: where it sits (BreadcrumbList, from the home page down) and, when it has a line of
 * its own, what it is (TechArticle). Search engines show the trail in place of the URL.
 */
export function DocJsonLd({ trail, description }: { trail: Crumb[]; description?: string }) {
  const crumbs = [{ name: "Home", path: "/" }, ...trail]
  const here = crumbs[crumbs.length - 1]
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${site.url}${c.path === "/" ? "" : c.path}` })),
    },
  ]
  if (description)
    graph.push({
      "@type": "TechArticle",
      headline: here.name,
      description: snippet(description),
      url: `${site.url}${here.path}`,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", "@id": `${site.url}/#site`, name: site.name, url: site.url },
      publisher: { "@type": "Organization", name: "SYNCROBOTIC", url: site.url, sameAs: [site.linkedin, "https://github.com/Syncrobotic"] },
    })
  // `<` escaped, so no text in the data can close the script element.
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
