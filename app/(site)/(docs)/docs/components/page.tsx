import type { Metadata } from "next"
import Link from "next/link"
import { groups, items } from "@/site/catalog"
import { pageMeta } from "@/site/config"
import { DocHeader } from "@/site/doc"
import { ComponentCards } from "@/site/component-cards"

const count = items.filter((i) => i.group !== "Hooks & libraries").length

export const metadata: Metadata = pageMeta({
  title: "Components",
  description: `All ${count} SYNCROBOTIC components by group, each with what it is for: actions and inputs, robotics with the robot shell, lists and tables, status and values, search and filters, data display, charts, media, feedback, navigation, overlays and layout.`,
  path: "/docs/components",
})

/** Every component on one page, by group: its name and what it is for, so you can find the right one before opening it. */
export default function ComponentsIndex() {
  return (
    <article className="flex flex-col gap-8">
      <DocHeader
        title="Components"
        lead={`${count} components built on the tokens, by group: actions and inputs every product needs, then the robotics components with the robot shell, then lists and tables, status and values, search and filters, data, charts, media, feedback, navigation, overlays and layout.`}
      />
      {groups.map((g) => {
        const list = items.filter((i) => i.group === g)
        if (!list.length) return null
        // Hooks are behaviour, with nothing to picture: they keep the plain list.
        // ("Hooks" or, after the regrouping, "Hooks & libraries".)
        const pictured = !g.startsWith("Hooks")
        return (
          <section key={g} aria-labelledby={`group-${g}`} className="flex flex-col gap-4">
            <h2 id={`group-${g}`} className="flex items-baseline gap-2 text-xl font-bold">
              {g}
              <span className="text-sm font-normal text-muted-foreground tabular-nums">{list.length}</span>
            </h2>
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
