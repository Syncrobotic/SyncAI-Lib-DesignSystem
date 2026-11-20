import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { site } from "@/site/config"
import { BrandLogotype, BrandMark } from "@/site/logo"
import pkg from "../package.json"

type FooterLink = { label: string; href: string; external?: boolean }

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Design system",
    links: [
      { label: "Foundations", href: "/docs/foundations" },
      { label: "Components", href: "/docs/components" },
      { label: "Blocks", href: "/blocks" },
      { label: "Icons", href: "/icons" },
      { label: "Brand assets", href: "/brand" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Installation", href: "/docs/installation" },
      { label: "Next.js", href: "/docs/nextjs" },
      { label: "Tokens", href: "/docs/tokens" },
      { label: "Versions and upgrades", href: "/docs/upgrading" },
    ],
  },
  {
    title: "For agents",
    links: [
      { label: "llms.txt", href: "/llms.txt" },
      { label: "Using with AI", href: "/docs/ai" },
      { label: "MCP server", href: "/docs/ai#mcp" },
      { label: "Registry index", href: "/r/registry.json" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "GitHub", href: site.repo, external: true },
      { label: "Releases", href: `${site.repo}/releases`, external: true },
      { label: "Changelog", href: `${site.repo}/blob/main/CHANGELOG.md`, external: true },
      { label: "Roadmap", href: `${site.repo}/blob/main/ROADMAP.md`, external: true },
    ],
  },
]

const linkClass =
  "inline-flex min-h-(--h-sm) items-center gap-1 text-sm text-muted-foreground underline-offset-4 transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground hover:underline"

/**
 * The home page's footer: where to go next, in four columns, then the version and the licence, and the wordmark set
 * large at the very bottom, cut by the page's edge like a nameplate. The wordmark is decoration (the mark above names
 * the company), so it is hidden from screen readers and drawn in the quietest ink.
 */
export function SiteFooter() {
  return (
    <footer className="overflow-hidden border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-section-sm px-4 pt-section-sm lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-4">
          <BrandMark className="h-8 self-start" />
          <p className="max-w-xs text-sm text-muted-foreground">Interfaces for the people who run robots. Written down once, installed as source.</p>
          <a
            href={`${site.repo}/releases/tag/v${pkg.version}`}
            className="inline-flex w-fit items-center gap-2 rounded-sm border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors duration-(--motion-fast) ease-(--ease-standard) hover:text-foreground"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />v{pkg.version}
            <span className="sr-only">, release notes</span>
          </a>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {columns.map((c) => (
            <div key={c.title} className="flex flex-col gap-2">
              <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{c.title}</h2>
              <ul className="flex flex-col">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} className={linkClass}>
                        {l.label}
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                      </a>
                    ) : (
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-section-sm max-w-6xl px-4">
        <div className="flex flex-col gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SYNCROBOTIC. Source-available; all rights reserved.</p>
          <p className="font-mono">Taipei · Made for operators outdoors</p>
        </div>
      </div>
      {/* The nameplate: the official logotype as wide as the column, cut by the page's bottom edge. Decoration (the mark
          above names the company), so hidden from screen readers and drawn in the quietest ink. */}
      <div aria-hidden="true" className="pointer-events-none mx-auto max-w-6xl overflow-hidden px-4 pt-6 select-none">
        <BrandLogotype title="" className="-mb-[2%] h-auto w-full text-border" />
      </div>
    </footer>
  )
}
