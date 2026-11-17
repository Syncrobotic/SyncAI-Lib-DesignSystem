import type { Metadata } from "next"
import * as React from "react"
import { notFound } from "next/navigation"
import { pageMeta, site } from "@/site/config"
import { ChangelogList } from "@/site/changelog-list"
import { CodeSheet } from "@/site/code-sheet"
import { getItem, items, readSource, storyNames, storyTitle } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { Reveal, AppearItem } from "@/site/appear"
import { ExampleCard } from "@/site/example-card"
import { Stage } from "@/site/examples"
import { Dot, H2, PageTitle, Rules } from "@/site/prose"
import { storySource } from "@/site/story-source"
import { overviews } from "@/site/overview"
import { aiPrompt, componentMarkdown } from "@/site/ai"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { getItem as findItem } from "@/site/catalog"

/** `name` becomes a link to that component's page; other backticked words stay code. */
function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) => {
        if (!part.startsWith("`")) return part
        const word = part.slice(1, -1)
        const target = findItem(word)
        return target ? (
          <a key={i} href={`/docs/components/${word}`} className="font-medium text-foreground underline underline-offset-4 hover:text-info">
            {target.title}
          </a>
        ) : (
          <code key={i} className="rounded-xs bg-muted px-1 font-mono text-sm">
            {word}
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

export default async function ComponentPage({ params }: Props) {
  const item = getItem((await params).name)
  if (!item) notFound()

  const names = item.examples ? storyNames(item.examples) : []
  const meta = (item as { meta?: { version: string; changelog: { version: string; date: string; note: string }[] } }).meta
  const deps = [...(("dependencies" in item && item.dependencies) || []), ...(("registryDependencies" in item && item.registryDependencies) || [])]

  const overview = overviews[item.name]
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

  return (
    <article>
      <div className="flex flex-wrap items-start justify-between gap-x-6">
        <PageTitle eyebrow={item.group} title={item.title} lead={item.description} />
        <div className="flex flex-wrap items-center gap-2 pb-6 sm:pt-6">
          {meta && (
            <a href="#changelog" className="font-mono text-sm text-muted-foreground tabular-nums underline-offset-4 hover:underline">
              v{meta.version}
            </a>
          )}
          {/* For AI agents: the page as markdown, or a prompt that points an agent at it. */}
          <CopyButton value={componentMarkdown(item.name) ?? ""} variant="outline" label="Copy as Markdown">
            Markdown
          </CopyButton>
          <CopyButton value={aiPrompt(item.title, `/docs/components/${item.name}`, item.name)} variant="outline" label="Copy prompt for AI">
            Prompt
          </CopyButton>
          {!inlineSource && (
            <CodeSheet
              label="Source"
              variant="outline"
              title={`${item.name}${sourceFiles.length > 1 ? ` · ${sourceFiles.length} files` : ".tsx"}`}
              meta={meta ? `v${meta.version}` : undefined}
              install={installBlock}
              files={sourceFiles}
              href={`${site.repo}/blob/main/${item.files[0].path}`}
            />
          )}
        </div>
      </div>

      <CodeBlock code={install} lang="bash" title="Install" />
      {deps.length > 0 && <p className="pt-2 text-sm text-muted-foreground">Also installs: {deps.join(", ")}</p>}

      {overview && (
        <section aria-labelledby="overview" className="pt-8">
          <h2 id="overview" className="sr-only">
            Overview
          </h2>
          {/* Skip the line when it only repeats the description above. */}
          {overview.what.trim() !== (item.description ?? "").trim() && (
            <p className="max-w-3xl text-base">
              <Linked text={overview.what} />
            </p>
          )}
          <div className="grid gap-6 pt-6 sm:grid-cols-2">
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

      {item.examples && (
        <>
          <H2 id="examples">Examples</H2>
          <p className="pb-4 text-sm text-muted-foreground">States and real uses. Each example is also a Storybook story and a visual regression test.</p>
          <div className="flex flex-col gap-6">
            {/* Each example arrives as it scrolls in (site/appear.tsx); those already on screen render as they are. */}
            {names.map((n) => (
              <Reveal key={n}>
                <AppearItem>
                  <ExampleCard
                    id={`example-${n}`}
                    title={storyTitle(n)}
                    wide={item.wide}
                    preview={<Stage file={item.examples!.file} name={n} className="w-full" wide={item.wide} />}
                    install={installBlock}
                    code={<CodeBlock code={storySource(item.examples!.file, n)} title={`${storyTitle(n)}.tsx`} />}
                  />
                </AppearItem>
              </Reveal>
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

      {item.keyboard && (
        <>
          <H2 id="keyboard">Keyboard</H2>
          <Reveal>
            <AppearItem className="overflow-hidden rounded-md border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="sr-only">
                  <tr>
                    <th>Keys</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {item.keyboard.map(([keys, action]) => (
                    <tr key={keys} className="border-b border-border last:border-0">
                      <td className="w-56 py-2 pr-4 pl-4 align-top">
                        <span className="flex flex-wrap gap-1">
                          {keys.split(" / ").map((k) => (
                            <kbd key={k} className="rounded-xs bg-muted px-1 py-0.5 font-mono text-xs whitespace-nowrap">
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <a href="/docs/upgrading" className="underline-offset-4 hover:underline">
              How to upgrade
            </a>
          </p>
        </>
      )}
    </article>
  )
}
