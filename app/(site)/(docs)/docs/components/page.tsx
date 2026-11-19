import type { Metadata } from "next"
import Link from "next/link"
import { groups, items } from "@/site/catalog"
import { pageMeta } from "@/site/config"
import { DocHeader } from "@/site/doc"

const count = items.filter((i) => i.group !== "Hooks").length

export const metadata: Metadata = pageMeta({
  title: "Components",
  description: `All ${count} SYNCROBOTIC components by group, each with what it is for: general UI on Radix, charts, building blocks for data tools and the robot shell.`,
  path: "/docs/components",
})

/** Every component on one page, by group: its name and what it is for, so you can find the right one before opening it. */
export default function ComponentsIndex() {
  return (
    <article className="flex flex-col gap-8">
      <DocHeader
        title="Components"
        lead={`${count} components built on the tokens, by group: general UI for any product, charts, building blocks for data tools, and the robot shell for control apps.`}
      />
      {groups.map((g) => {
        const list = items.filter((i) => i.group === g)
        if (!list.length) return null
        return (
          <section key={g} aria-labelledby={`group-${g}`} className="flex flex-col gap-3">
            <h2 id={`group-${g}`} className="flex items-baseline gap-2 text-xl font-bold">
              {g}
              <span className="text-sm font-normal text-muted-foreground tabular-nums">{list.length}</span>
            </h2>
            <ul className="grid border-t border-border sm:grid-cols-2 sm:gap-x-8">
              {list.map((i) => (
                <li key={i.name} className="border-b border-border">
                  <Link
                    href={`/docs/components/${i.name}`}
                    className="group flex min-h-(--h-row) flex-col justify-center gap-1 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="font-medium group-hover:underline">{i.title}</span>
                    {i.description && <span className="line-clamp-3 text-sm text-muted-foreground">{i.description}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </article>
  )
}
