import type { Metadata } from "next"
import Link from "next/link"
import { pageMeta } from "@/site/config"
import { blockCards } from "@/site/blocks"
import { blockGroups } from "@/site/block-types"
import { BlockThumb } from "@/site/block-thumb"
import { AppearItem, Reveal } from "@/site/appear"

const description =
  "Ready-made screens and sections composed from SYNCROBOTIC components: Application blocks any tool is built from, and Solutions for robot operations. Variants of one component (charts, timelines, dialogs, sheets) are on that component's page, under Patterns. Install one and it lands as source."

export const metadata: Metadata = pageMeta({ title: "Blocks", description, path: "/blocks" })

const groupIntro: Record<(typeof blockGroups)[number], string> = {
  Application: "The screens and sections any tool is built from: shells, stats, cards, sign-in, settings, forms, wizards and states.",
  Solutions: "Whole working screens for one job in robot operations, built from components and Application blocks.",
}

export default function BlocksPage() {
  return (
    <article>
      <header className="flex flex-col gap-3 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sections and screens you can drop into a tool</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Components composed the way we use them: real copy, real states, responsive. Pick a type, compare its blocks, install one as source.
        </p>
      </header>

      {blockGroups.map((g) => {
        // One card per type, showing the block that best stands for it (site/blocks.tsx).
        const cards = blockCards().filter((c) => c.group === g)
        if (cards.length === 0) return null
        return (
          <section key={g} aria-labelledby={`group-${g}`} className="flex flex-col gap-4 pt-section-sm">
            <div className="flex flex-col gap-1">
              <h2 id={`group-${g}`} className="text-xl font-bold">
                {g}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">{groupIntro[g]}</p>
            </div>
            <Reveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((t) => {
                return (
                  <AppearItem key={t.type} className="flex">
                    {/* The screenshot is framed (it is a picture of a screen); the words under it are not boxed. */}
                    <Link
                      href={`/blocks/${t.type}`}
                      className="group flex w-full flex-col gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      <div className="overflow-hidden rounded-md ring-1 ring-border transition-shadow duration-(--motion-fast) ease-(--ease-standard) group-hover:ring-muted-foreground">
                        <BlockThumb name={t.name} />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-bold group-hover:underline">{t.title}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {t.count} {t.count === 1 ? "block" : "blocks"}
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
