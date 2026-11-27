import type { Metadata } from "next"
import Link from "next/link"
import { pageMeta } from "@/site/config"
import { blockCards } from "@/site/blocks"
import { blockGroupIntro, blockGroups } from "@/site/block-types"
import { BlockThumb } from "@/site/block-thumb"
import { AppearItem, Reveal } from "@/site/appear"

const description =
  "Ready-made screens and sections composed from SYNCROBOTIC components, by product area: shell and navigation, identity and account, tenancy and access, fleet operations, data and AI, and the patterns every area reuses. Variants of one component (charts, timelines, dialogs, sheets) are on that component's page. Install one and it lands as source."

export const metadata: Metadata = pageMeta({ title: "Blocks", description, path: "/blocks" })

/** A heading id without spaces: "Data and AI" is group-data-and-ai. */
const groupId = (g: string) => `group-${g.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

export default function BlocksPage() {
  return (
    <article>
      <header className="flex flex-col gap-3 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sections and screens you can drop into a tool</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Components composed the way we use them: real copy, real states, responsive. Pick a type, compare its blocks, install one as source. Most
          render sample data: a block marked Controlled renders only from its props.
        </p>
      </header>

      {blockGroups.map((g, gi) => {
        // One card per type, showing the block that best stands for it (site/blocks.tsx).
        const cards = blockCards().filter((c) => c.group === g)
        if (cards.length === 0) return null
        return (
          <section key={g} aria-labelledby={groupId(g)} className="flex flex-col gap-4 pt-section-sm">
            <div className="flex flex-col gap-1">
              <h2 id={groupId(g)} className="text-xl font-bold">
                {g}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">{blockGroupIntro[g]}</p>
            </div>
            <Reveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((t, i) => {
                return (
                  <AppearItem key={t.type} className="flex">
                    {/* The screenshot is framed (it is a picture of a screen); the words under it are not boxed. */}
                    <Link
                      href={`/blocks/${t.type}`}
                      className="group flex w-full flex-col gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      <div className="overflow-hidden rounded-md ring-1 ring-border transition-shadow duration-(--motion-fast) ease-(--ease-standard) group-hover:ring-muted-foreground">
                        {/* The first row (three across at lg) is the largest paint. */}
                        <BlockThumb name={t.name} priority={gi === 0 && i < 3} />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-bold group-hover:underline">{t.title}</span>
                          {/* Beta as the sidebar says it: small grey words after the count. */}
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {t.count} {t.count === 1 ? "block" : "blocks"}
                            {t.beta && " · Beta"}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">{t.description}</span>
                      </div>
                    </Link>
                  </AppearItem>
                )
              })}
            </Reveal>
          </section>
        )
      })}
    </article>
  )
}
