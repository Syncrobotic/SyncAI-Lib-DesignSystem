import type { Metadata } from "next"
import Link from "next/link"
import { pageMeta } from "@/site/config"
import { blocksOfType } from "@/site/blocks"
import { blockGroups, blockTypes } from "@/site/block-types"
import { BlockThumb } from "@/site/block-thumb"
import { AppearItem, Reveal } from "@/site/appear"

const description =
  "Ready-made screens and sections built from SYNCROBOTIC components and tokens, grouped like the components: Application blocks any tool is built from, Charts, and Solutions for robot operations. Install one and it lands as source."

export const metadata: Metadata = pageMeta({ title: "Blocks", description, path: "/blocks" })

const groupIntro: Record<(typeof blockGroups)[number], string> = {
  Application: "The screens and sections any tool is built from: shells, stats, cards, forms, settings, sign-in and states.",
  Charts: "Data shown as charts, ready for a dashboard: trends, comparisons, run histories and gauges.",
  Solutions: "Whole working screens for one job in robot operations, built from Application blocks and Charts.",
}

export default function BlocksPage() {
  return (
    <article>
      <header className="flex flex-col gap-3 border-b border-border pb-8">
        <p className="text-sm font-medium text-muted-foreground">Blocks</p>
        <h1 className="text-3xl font-bold tracking-tight">Sections and screens you can drop into a tool</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Components composed the way we use them: real copy, real states, responsive. Pick a type, compare its blocks, install one as source.
        </p>
      </header>

      {blockGroups.map((g) => {
        const types = blockTypes.filter((t) => t.group === g && blocksOfType(t.slug).length > 0)
        if (types.length === 0) return null
        return (
          <section key={g} aria-labelledby={`group-${g}`} className="flex flex-col gap-4 pt-section-sm">
            <div className="flex flex-col gap-1">
              <h2 id={`group-${g}`} className="text-xl font-bold">
                {g}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">{groupIntro[g]}</p>
            </div>
            <Reveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {types.map((t) => {
                const list = blocksOfType(t.slug)
                const first = list[0]
                return (
                  <AppearItem key={t.slug} className="flex">
                    <Link
                      href={`/blocks/${t.slug}`}
                      className="press group flex w-full flex-col overflow-hidden rounded-md border border-border hover:border-muted-foreground"
                    >
                      <BlockThumb
                        name={first.name}
                        title={t.title}
                        width={first.viewport === "mobile" ? 390 : 1280}
                        height={first.height}
                        fit={first.fit}
                        ratio={16 / 10}
                      />
                      <div className="flex flex-1 flex-col gap-1 border-t border-border bg-card p-4">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-bold group-hover:underline">{t.title}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {list.length} {list.length === 1 ? "block" : "blocks"}
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
