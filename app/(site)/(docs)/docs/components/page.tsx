import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { groups, items } from "@/site/catalog"
import { pageMeta } from "@/site/config"
import { DocHeader } from "@/site/doc"
import { ComponentCards } from "@/site/component-cards"

const components = groups.filter((g) => g !== "Hooks and libraries")
const count = items.filter((i) => i.group !== "Hooks and libraries").length
// The groups in a sentence, from the list itself, so a new group is never missing from it. An acronym (AI) keeps its case.
const named = components.map((g) => (/^[A-Z]{2}/.test(g) ? g : g[0].toLowerCase() + g.slice(1)))
const groupList = `${named.slice(0, -1).join(", ")} and ${named.at(-1)}`
const slug = (g: string) => `group-${g.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

export const metadata: Metadata = pageMeta({
  title: "Components",
  description: `All ${count} SYNCROBOTIC components by group, each with what it is for: ${groupList}.`,
  path: "/docs/components",
})

/** A line under a group's heading, where a neighbour elsewhere on the site answers the same need. */
const groupNotes: Partial<Record<(typeof groups)[number], ReactNode>> = {
  Charts: (
    <>
      Sparklines, status strips, rings and heatmaps drawn without a chart library are blocks:{" "}
      <Link href="/blocks/data-visualisation" className="text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
        Small charts
      </Link>
      .
    </>
  ),
}

/** Every component on one page, by group: its name and what it is for, so you can find the right one before opening it. */
export default function ComponentsIndex() {
  return (
    <article className="flex flex-col gap-8">
      <DocHeader title="Components" lead={`${count} components built on the tokens, by group: ${groupList}.`} />
      {groups.map((g) => {
        const list = items.filter((i) => i.group === g)
        if (!list.length) return null
        // Hooks and libraries are behaviour, with nothing to picture: they keep the plain list.
        const pictured = g !== "Hooks and libraries"
        return (
          <section key={g} aria-labelledby={slug(g)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id={slug(g)} className="flex items-baseline gap-2 text-xl font-bold">
                {g}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">{list.length}</span>
              </h2>
              {groupNotes[g] && <p className="max-w-2xl text-sm text-muted-foreground">{groupNotes[g]}</p>}
            </div>
            {pictured ? (
              <ComponentCards cards={list.map((i) => [i.name, i.title, i.description ?? ""])} />
            ) : (
              <ul className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
                {list.map((i) => (
                  <li key={i.name} className="border-b border-border">
                    <Link
                      href={`/docs/components/${i.name}`}
                      className="group flex min-h-(--h-row) flex-col justify-center gap-1 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="font-medium group-hover:underline">{i.title}</span>
                      {i.description && <span className="text-sm text-muted-foreground">{i.description}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </article>
  )
}
