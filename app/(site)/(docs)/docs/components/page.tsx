import type { Metadata } from "next"
import Link from "next/link"
import { groups, items } from "@/site/catalog"
import { pageMeta } from "@/site/config"
import { DocHeader } from "@/site/doc"
import type { Item } from "@/site/catalog"
import { AppearItem, Reveal } from "@/site/appear"

const count = items.filter((i) => i.group !== "Hooks & libraries").length

export const metadata: Metadata = pageMeta({
  title: "Components",
  description: `All ${count} SYNCROBOTIC components by group, each with what it is for: actions and inputs, robotics and the robot shell, data display, charts, media, feedback, navigation, overlays and layout.`,
  path: "/docs/components",
})

// The grid's card width: a third of the column on wide screens, half from md, the whole column on a phone.
const sizes = "(min-width: 1024px) 18rem, (min-width: 768px) 45vw, 100vw"

/**
 * A component's picture: its first story, cropped and framed, taken by scripts/thumbs.mjs (npm run thumbs). One file per
 * theme; the browser fetches only the one that shows. Decorative: the card's title and description are the link's name.
 */
function Thumb({ name }: { name: string }) {
  const src = (theme: "light" | "dark") => ({
    src: `/thumbs/components/${name}-${theme}-400.webp`,
    srcSet: `/thumbs/components/${name}-${theme}-400.webp 400w, /thumbs/components/${name}-${theme}-800.webp 800w`,
  })
  return (
    <>
      <img {...src("light")} sizes={sizes} alt="" width={400} height={250} loading="lazy" decoding="async" className="block h-auto w-full dark:hidden" />
      <img {...src("dark")} sizes={sizes} alt="" width={400} height={250} loading="lazy" decoding="async" className="hidden h-auto w-full dark:block" />
    </>
  )
}

/** As a block's card on /blocks: the picture is framed (it is a picture of the component); the words under it are not boxed. */
function Card({ item }: { item: Item }) {
  return (
    <Link
      href={`/docs/components/${item.name}`}
      className="group flex w-full flex-col gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <div className="specimen aspect-16/10 overflow-hidden rounded-md ring-1 ring-border transition-shadow duration-(--motion-fast) ease-(--ease-standard) group-hover:ring-muted-foreground">
        <Thumb name={item.name} />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="font-bold group-hover:underline">{item.title}</span>
        {/* The whole description: a clamp cut it mid-word, and none is longer than three sentences. */}
        {item.description && <span className="text-sm text-muted-foreground">{item.description}</span>}
      </div>
    </Link>
  )
}

/** Every component on one page, by group: its name and what it is for, so you can find the right one before opening it. */
export default function ComponentsIndex() {
  return (
    <article className="flex flex-col gap-8">
      <DocHeader
        title="Components"
        lead={`${count} components built on the tokens, by group: actions and inputs every product needs, then the robotics components and the robot shell, then data, charts, media, feedback, navigation, overlays and layout.`}
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
              <Reveal className="grid gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                {list.map((i) => (
                  <AppearItem key={i.name} className="flex">
                    <Card item={i} />
                  </AppearItem>
                ))}
              </Reveal>
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
