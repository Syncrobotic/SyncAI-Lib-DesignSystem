import type { Metadata } from "next"
import Link from "next/link"
import { pageMeta } from "@/site/config"
import { DocHeader, Section, Pager } from "@/site/doc"
import { FoundationGrid } from "@/site/foundation-previews"
import { foundations, startNeighbours } from "@/site/foundations"

const description =
  "The SYNCROBOTIC design language: principles, colour, typography, spacing, radius, elevation, motion, iconography, accessibility, alarms and data visualisation, shared by every product team."

export const metadata: Metadata = pageMeta({ title: "Docs", description, path: "/docs" })

export default function FoundationsPage() {
  return (
    <article>
      <DocHeader
        title="One design language for every product"
        lead="Apps, dashboards, internal tools and marketing pages share these decisions. Designers use them to choose; engineers get them as CSS variables and Tailwind utilities from one theme file."
      />
      <Section id="all" title={`${foundations.length} foundations`}>
        <FoundationGrid />
      </Section>
      <Section id="how" title="How the tokens reach your product" lead="One source of truth, three ways to consume it.">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { k: "Theme file", v: "syncrobotic-theme.css", d: "Defines every value for light and dark. The only place a literal colour or size appears." },
            { k: "Tailwind utilities", v: "bg-info · rounded-md · h-(--h-md)", d: "What components and product code write. CI rejects anything outside the tokens." },
            { k: "This site", v: "Read at build time", d: "Every swatch, size and contrast ratio here is parsed from the theme file on each deploy." },
          ].map((x) => (
            <div key={x.k} className="flex flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border">
              <span className="text-xs text-muted-foreground">{x.k}</span>
              <span className="font-mono text-sm">{x.v}</span>
              <span className="text-sm text-muted-foreground">{x.d}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section id="decisions" title="Decisions that shape your product" lead="Settled once here, so a team does not argue them again.">
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            { href: "/docs/foundations/color#healthy-is-grey", k: "Healthy is grey", d: "Colour, with a shape and a word, marks only what is wrong." },
            { href: "/docs/tokens#brand", k: "Brand layer", d: "A product may swap primary, ring and the first chart colour; status and surfaces stay fixed." },
            { href: "/docs/upgrading#status", k: "Stable by evidence", d: "Stable items break only after a Deprecated release; at most one minor release a week." },
            { href: "/docs/choosing/messages", k: "Which one when", d: "The common choices (message, record, option, overlay) answered with the questions to ask in order." },
          ].map((x) => (
            <li key={x.k}>
              <Link href={x.href} className="press flex h-full flex-col gap-2 rounded-md bg-card p-4 ring-1 ring-border hover:bg-accent">
                <span className="text-sm font-medium">{x.k}</span>
                <span className="text-sm text-muted-foreground">{x.d}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <Pager {...startNeighbours("/docs")} />
    </article>
  )
}
