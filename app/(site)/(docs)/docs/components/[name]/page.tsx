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
import { WhenNear } from "@/site/when-near"
import { Dot, H2, Rules, Unbroken, textLink } from "@/site/prose"
import { storyListing, storyUrl } from "@/site/code-data"
import { LazyCode } from "@/site/lazy-code"
import { overviews } from "@/site/overview"
import { getItem as findItem } from "@/site/catalog"
import { BlockSection } from "@/site/block-section"
import { patternsOf } from "@/site/block-types"
import { blocksOfType } from "@/site/blocks"
import { apiOf } from "@/site/source-api"

/** `name` becomes a link to that component's page; other backticked words stay code. */
function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) => {
        if (!part.startsWith("`")) return part
        const word = part.slice(1, -1)
        const target = findItem(word)
        return target ? (
          <a key={i} href={`/docs/components/${word}`} className={`font-medium ${textLink}`}>
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
  const title = `${item.title} — React ${item.group === "Hooks & libraries" ? "hook" : "component"}`
  return pageMeta({ title, description: item.description ?? `${item.title} for the SYNCROBOTIC design system.`, path: `/docs/components/${item.name}`, image: `/og/components/${item.name}` })
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
  // A library with no examples (ros) shows what it exports here; its source, a thousand lines, is in the Source sheet.
  const api = item.examples ? [] : item.files.flatMap((f) => apiOf(readSource(f.path)))
  const functions = api.filter((e) => e.kind === "function" || e.kind === "const")
  const classes = api.filter((e) => e.kind === "class")
  const types = api.filter((e) => e.kind === "type")
  // The first example opens the page, under the title: what it looks like comes before how to install it.
  const example = (n: string, level?: 2 | 3) => (
    <ExampleCard
      level={level}
      id={`example-${n}`}
      title={storyTitle(n, item.name)}
      preview={
        // Every example after the first draws once it nears the screen (site/when-near.tsx).
        level === 2 ? (
          <Stage file={item.examples!.file} name={n} className="w-full" wide={item.wide} />
        ) : (
          <WhenNear>
            <Stage file={item.examples!.file} name={n} className="w-full" wide={item.wide} />
          </WhenNear>
        )
      }
      install={installBlock}
      // Fetched when the sheet opens (site/code-data.ts); only its address and height are in the page.
      code={<LazyCode {...storyListing(item.examples!.file, n, `${n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}.tsx`)} />}
      prefetch={storyUrl(item.examples!.file, n)}
    />
  )
  const [first, ...rest] = names

  return (
    <>
      {first && example(first, 2)}

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
                {/* Each block's tools, install line and preview draw as it nears the screen: a chart has some twenty. */}
                {blocksOfType(t.slug).map((b) => (
                  <BlockSection key={b.name} block={b} heading="h4" near />
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

      {api.length > 0 && (
        <>
          <H2 id="api">API</H2>
          <p className="max-w-2xl pb-4 text-sm text-pretty text-muted-foreground">
            What the file exports. The source is in the Source sheet above
            {item.name === "ros" && (
              <>
                ; how it fits together, with the safety notes, is on{" "}
                <a href="/docs/ros" className={textLink}>
                  Connect to ROS
                </a>
              </>
            )}
            .
          </p>
          <dl className="flex flex-col divide-y divide-border rounded-md bg-card ring-1 ring-border">
            {[...functions, ...classes].map((e) => (
              <div key={e.name} className="flex flex-col gap-1 p-4">
                <dt className="font-mono text-xs break-words">
                  <span className="font-medium text-foreground">{e.kind === "class" ? `class ${e.name}` : e.name}</span>
                  {e.signature && <span className="text-muted-foreground">{e.signature.slice(e.name.length)}</span>}
                </dt>
                {e.summary && <dd className="text-sm text-muted-foreground">{e.summary}</dd>}
              </div>
            ))}
          </dl>
          {types.length > 0 && (
            <>
              <h3 className="pt-6 pb-2 text-sm font-bold">Types</h3>
              <p className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <code key={t.name} title={t.summary} className="rounded-xs bg-muted px-1 font-mono text-xs">
                    {t.name}
                  </code>
                ))}
              </p>
            </>
          )}
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
            <a href="/docs/upgrading" className={`inline-flex min-h-(--h-sm) items-center ${textLink}`}>
              How to upgrade
            </a>
          </p>
        </>
      )}
    </>
  )
}
