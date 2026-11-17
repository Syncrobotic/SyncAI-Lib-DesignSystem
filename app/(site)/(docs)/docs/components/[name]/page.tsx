import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { pageMeta } from "@/site/config"
import { getItem, items, readSource, storyNames, storyTitle } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { ExampleCard } from "@/site/example-card"
import { Stage } from "@/site/examples"
import { H2, PageTitle, Rules } from "@/site/prose"
import { storySource } from "@/site/story-source"

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

  return (
    <article>
      <PageTitle eyebrow={item.group} title={item.title} lead={item.description} />

      {meta && (
        <p className="-mt-4 pb-4 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">v{meta.version}</span> ·{" "}
          <a href="#changelog" className="underline-offset-4 hover:underline">
            Changelog
          </a>
        </p>
      )}
      <CodeBlock code={`npx shadcn add @syncrobotic/${item.name}`} lang="bash" title="Install" />
      {deps.length > 0 && <p className="pt-2 text-sm text-muted-foreground">Also installs: {deps.join(", ")}</p>}

      {item.rules && (
        <>
          <H2 id="usage">Usage rules</H2>
          <Rules rules={item.rules} />
        </>
      )}

      {item.examples && (
        <>
          <H2 id="examples">Examples</H2>
          <p className="pb-4 text-sm text-muted-foreground">States and real uses. Switch to Code for the JSX. Each example is also a Storybook story and a visual regression test.</p>
          <div className="flex flex-col gap-6">
            {names.map((n) => (
              <ExampleCard
                key={n}
                id={`example-${n}`}
                title={storyTitle(n)}
                preview={<Stage file={item.examples!.file} name={n} className="w-full" />}
                code={<CodeBlock code={storySource(item.examples!.file, n)} title={`${storyTitle(n)}.tsx`} />}
              />
            ))}
          </div>
        </>
      )}

      {meta && (
        <>
          <H2 id="changelog">Changelog</H2>
          <ul className="flex flex-col gap-2 text-sm">
            {meta.changelog.map((c) => (
              <li key={c.version} className="flex gap-3">
                <span className="w-16 shrink-0 font-mono tabular-nums">{c.version}</span>
                <span className="w-24 shrink-0 text-muted-foreground tabular-nums">{c.date}</span>
                <span>{c.note}</span>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-sm text-muted-foreground">
            <a href="/docs/upgrading" className="underline-offset-4 hover:underline">
              How to upgrade
            </a>
          </p>
        </>
      )}

      <H2 id="source">Source</H2>
      <div className="flex flex-col gap-4">
        {item.files.map((f) => (
          <CodeBlock key={f.path} code={readSource(f.path)} lang={f.path.endsWith(".ts") ? "ts" : "tsx"} title={f.path} />
        ))}
      </div>
    </article>
  )
}
