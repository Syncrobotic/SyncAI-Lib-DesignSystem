import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getItem, items, readSource, storyNames, storyTitle } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { Stage } from "@/site/examples"
import { H2, PageTitle, Rules } from "@/site/prose"

export const dynamicParams = false
export const generateStaticParams = () => items.map((i) => ({ name: i.name }))

type Props = { params: Promise<{ name: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getItem((await params).name)
  if (!item) return {}
  const title = `${item.title} — React ${item.group === "Hooks" ? "hook" : "component"}`
  const path = `/docs/components/${item.name}`
  return {
    title,
    description: item.description,
    alternates: { canonical: path },
    openGraph: { title, description: item.description, url: path },
  }
}

export default async function ComponentPage({ params }: Props) {
  const item = getItem((await params).name)
  if (!item) notFound()

  const names = item.examples ? storyNames(item.examples) : []
  const deps = [...(("dependencies" in item && item.dependencies) || []), ...(("registryDependencies" in item && item.registryDependencies) || [])]

  return (
    <article>
      <PageTitle eyebrow={item.group} title={item.title} lead={item.description} />

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
          <H2 id="states">States</H2>
          <p className="pb-4 text-sm text-muted-foreground">Each state is the same story Storybook renders and the visual regression test captures.</p>
          <div className="flex flex-col gap-6">
            {names.map((n) => (
              <section key={n} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">{storyTitle(n)}</h3>
                <Stage file={item.examples!.file} name={n} />
              </section>
            ))}
          </div>
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
