import type { Metadata } from "next"
import * as React from "react"
import { notFound } from "next/navigation"
import { pageMeta } from "@/site/config"
import { ChangelogList } from "@/site/changelog-list"
import { getItem, items, readSource, storyNames, storyTitle } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { Reveal, AppearItem } from "@/site/appear"
import { ExampleCard } from "@/site/example-card"
import { Stage } from "@/site/examples"
import { Dot, H2, Rules, Unbroken } from "@/site/prose"
import { storySource } from "@/site/story-source"
import { overviews } from "@/site/overview"
import { getItem as findItem } from "@/site/catalog"
import { BlockSection } from "@/site/block-section"
import { patternsOf } from "@/site/block-types"
import { blocksOfType } from "@/site/blocks"

/** `name` becomes a link to that component's page; other backticked words stay code. */
function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) => {
        if (!part.startsWith("`")) return part
        const word = part.slice(1, -1)
        const target = findItem(word)
        return target ? (
          <a key={i} href={`/docs/components/${word}`} className="font-medium text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
            {target.title}
          </a>
        ) : (
          <code key={i} className="rounded-xs bg-muted px-1 font-mono text-sm">
            <Unbroken text={word} />
          </code>
        )
      })}
    </>
  )
}

export const dynamicParams = false
export const generateStaticParams = () => items.map((i) => ({ name: i.name }))

type Props = { params: Promise<{ name: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getItem((await params).name)
  if (!item) return {}
  const title = `${item.title} — React ${item.group === "Hooks" ? "hook" : "component"}`
  return pageMeta({ title, description: item.description ?? `${item.title} for the SYNCROBOTIC design system.`, path: `/docs/components/${item.name}` })
}

/** Whether two lines say the same thing: one contains the other, or they share their first six words. */
function repeats(a: string, b: string) {
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()
  const x = norm(a)
  const y = norm(b)
  if (!x || !y) return false
  return x.includes(y) || y.includes(x) || x.split(" ").slice(0, 6).join(" ") === y.split(" ").slice(0, 6).join(" ")
}

export default async function ComponentPage({ params }: Props) {
  const item = getItem((await params).name)
  if (!item) notFound()

  const names = item.examples ? storyNames(item.examples) : []
  // Ready-made variants of this component (a line chart, an audit timeline), documented here rather than under Blocks.
  const patterns = patternsOf(item.name).filter((t) => blocksOfType(t.slug).length > 0)
  const meta = (item as { meta?: { version: string; status?: "beta" | "stable"; changelog: { version: string; date: string; note: string }[] } }).meta
  const deps = [...(("dependencies" in item && item.dependencies) || []), ...(("registryDependencies" in item && item.registryDependencies) || [])]

  const overview = overviews[item.name]
  // Skip the overview's line when it only repeats the description above, word for word or nearly.
  const what = overview && !repeats(overview.what, item.description ?? "")
  const install = `npx shadcn add @syncrobotic/${item.name}`
  const installBlock = <CodeBlock code={install} lang="bash" title="Terminal" />
  const sourceFiles = await Promise.all(
    item.files.map(async (f) => ({
      name: f.path.split("/").pop()!,
      code: <CodeBlock code={readSource(f.path)} lang={f.path.endsWith(".ts") ? "ts" : "tsx"} title={f.path} />,
    })),
  )
  // Hooks (and the tray) have no examples: their source is the page, so it stays inline.
  const inlineSource = !item.examples
  // The first example opens the page, under the title: what it looks like comes before how to install it.
  const example = (n: string) => (
    <ExampleCard
      id={`example-${n}`}
      title={storyTitle(n)}
      preview={<Stage file={item.examples!.file} name={n} className="w-full" wide={item.wide} />}
      install={installBlock}
      code={<CodeBlock code={storySource(item.examples!.file, n)} title={`${storyTitle(n).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.tsx`} />}
    />
  )
  const [first, ...rest] = names

  return (
    <>
      {first && example(first)}

      <div className={first ? "pt-8" : undefined}>
        <CodeBlock code={install} lang="bash" title="Install" />
      </div>
      {deps.length > 0 && (
        // Each package name stays whole; the list wraps between names.
        <p className="pt-2 text-sm text-muted-foreground">
          Also installs:{" "}
          {deps.map((d, i) => (
            <React.Fragment key={d}>
              <span className="whitespace-nowrap">
                {d}
                {i < deps.length - 1 && ","}
              </span>
              {i < deps.length - 1 && " "}
            </React.Fragment>
          ))}
        </p>
      )}

      {overview && (
        <section aria-labelledby="overview" className="pt-8">
          <h2 id="overview" className="sr-only">
            Overview
          </h2>
          {what && (
            <p className="max-w-3xl text-base">
              <Linked text={overview.what} />
            </p>
          )}
          <div className={`grid gap-6 sm:grid-cols-2 ${what ? "pt-6" : ""}`}>
            <div>
              <h3 className="pb-2 text-sm font-bold">When to use</h3>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {overview.use.map((u) => (
                  <li key={u} className="flex gap-3">
                    <Dot />
                    <span>
                      <Linked text={u} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {overview.instead && (
              <div>
                <h3 className="pb-2 text-sm font-bold">Use something else</h3>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {overview.instead.map((u) => (
                    <li key={u} className="flex gap-3">
                      <Dot />
                      <span>
                        <Linked text={u} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <>
          <H2 id="examples">More examples</H2>
          <p className="pb-4 text-sm text-muted-foreground">States and real uses. Each example is also a Storybook story and a visual regression test.</p>
          <div className="flex flex-col gap-6">
            {/* Each example arrives as it scrolls in (site/appear.tsx); those already on screen render as they are. */}
            {rest.map((n) => (
              <Reveal key={n}>
                <AppearItem>{example(n)}</AppearItem>
              </Reveal>
            ))}
          </div>
        </>
      )}

      {patterns.length > 0 && (
        <>
          <H2 id="patterns">Patterns</H2>
          <p className="pb-4 text-sm text-muted-foreground">
            Ready-made uses of {item.title.toLowerCase()} with real data and copy. Each installs as source under its own name.
          </p>
          <div className="flex flex-col gap-section-sm">
            {patterns.map((t) => (
              <section key={t.slug} id={t.slug} aria-labelledby={`${t.slug}-title`} className="flex scroll-mt-20 flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 id={`${t.slug}-title`} className="text-xl font-bold">
                    {t.title}
                  </h3>
                  <p className="max-w-2xl text-sm text-muted-foreground">{t.description}</p>
                  {t.rules && (
                    <ul className="flex flex-col gap-1 pt-1 text-sm text-muted-foreground">
                      {t.rules.map((r) => (
                        <li key={r} className="flex gap-3">
                          <Dot />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {blocksOfType(t.slug).map((b) => (
                  <BlockSection key={b.name} block={b} heading="h4" />
                ))}
              </section>
            ))}
          </div>
        </>
      )}

      {item.rules && (
        <>
          <H2 id="usage">Usage rules</H2>
          <Reveal>
            <AppearItem>
              <Rules rules={item.rules} />
            </AppearItem>
          </Reveal>
        </>
      )}

      {inlineSource && (
        <>
          <H2 id="source">Source</H2>
          <div className="flex flex-col gap-4">
            {sourceFiles.map((f) => (
              <React.Fragment key={f.name}>{f.code}</React.Fragment>
            ))}
          </div>
        </>
      )}

      {meta && (
        <>
          <H2 id="changelog">Changelog</H2>
          <Reveal>
            <AppearItem>
              <ChangelogList entries={meta.changelog} />
            </AppearItem>
          </Reveal>
          <p className="pt-3 text-sm text-muted-foreground">
            <a href="/docs/upgrading" className="inline-flex h-(--h-sm) items-center underline-offset-4 hover:underline">
              How to upgrade
            </a>
          </p>
        </>
      )}
    </>
  )
}
