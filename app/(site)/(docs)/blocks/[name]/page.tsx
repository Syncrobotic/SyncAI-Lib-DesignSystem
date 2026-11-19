import type { Metadata } from "next"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { aiPrompt, blockMarkdown } from "@/site/ai"
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { pageMeta } from "@/site/config"
import { BlockFrame } from "@/site/block-frame"
import { blocks, blocksOfType, getBlock } from "@/site/blocks"
import { blockHref, blockTypes, getBlockType } from "@/site/block-types"
import { getItem, readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { Dot, H2, PageTitle, Rules } from "@/site/prose"
import { AppearItem, Reveal } from "@/site/appear"

// One page per block type, like one page per component: every block of the type, each with its preview, code and install.
// A block's own name still works as a URL (old links, the markdown twins) and leads to its place on the type page.
export const dynamicParams = false
export const generateStaticParams = () => [
  ...blockTypes.filter((t) => blocksOfType(t.slug).length > 0).map((t) => ({ name: t.slug })),
  ...blocks.filter((b) => !getBlockType(b.name)).map((b) => ({ name: b.name })),
]

type Props = { params: Promise<{ name: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getBlockType((await params).name)
  if (!t) return {}
  return pageMeta({ title: `${t.title} blocks`, description: t.description, path: `/blocks/${t.slug}` })
}

export default async function BlockTypePage({ params }: Props) {
  const name = (await params).name
  const type = getBlockType(name)
  if (!type) {
    const b = getBlock(name)
    if (b) permanentRedirect(`/blocks/${b.type}#${b.name}`)
    notFound()
  }
  const list = blocksOfType(type.slug)
  if (list.length === 0) notFound()

  return (
    <article>
      <PageTitle title={type.title} lead={type.description} />

      <section aria-labelledby="overview" className="grid gap-6 sm:grid-cols-2">
        <h2 id="overview" className="sr-only">
          Overview
        </h2>
        <div>
          <h3 className="pb-2 text-sm font-bold">When to use</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {type.use.map((u) => (
              <li key={u} className="flex gap-3">
                <Dot />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </div>
        {type.instead && (
          <div>
            <h3 className="pb-2 text-sm font-bold">Use something else</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {type.instead.map((u) => (
                <li key={u} className="flex gap-3">
                  <Dot />
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <H2 id="blocks">Blocks</H2>
      <div className="flex flex-col gap-section-sm">
        {list.map((b) => {
          const uses = (b.registryDependencies ?? []).filter((d) => d !== "@syncrobotic/cn").map((d) => d.replace("@syncrobotic/", ""))
          return (
            <section key={b.name} id={b.name} aria-labelledby={`${b.name}-title`} className="flex scroll-mt-20 flex-col gap-3">
              {/* Title and tools share one row, always; the description sits under them, so its length never moves the tools. */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 id={`${b.name}-title`} className="min-w-0 text-lg font-bold">
                    {b.title}
                  </h3>
                  <div className="flex shrink-0 flex-wrap gap-2">
                  <CopyButton value={blockMarkdown(b.name) ?? ""} variant="outline" label={`Copy ${b.title} as Markdown`}>
                    Markdown
                  </CopyButton>
                  <CopyButton value={aiPrompt(b.title, `/blocks/${type.slug}#${b.name}`, b.name)} variant="outline" label={`Copy a prompt for ${b.title}`}>
                    Prompt
                  </CopyButton>
                  </div>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">{b.description}</p>
              </div>
              <CodeBlock code={`npx shadcn add @syncrobotic/${b.name}`} lang="bash" title="Install" />
              {uses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  Built from
                  {/* A dependency is a component (its page) or another block (its place on its type page). */}
                  {uses.map((u) => (
                    <Link
                      key={u}
                      href={getItem(u) ? `/docs/components/${u}` : blockHref(u)}
                      className="rounded-xs bg-muted px-2 py-1 font-mono text-xs hover:bg-accent"
                    >
                      {u}
                    </Link>
                  ))}
                </div>
              )}
              <BlockFrame
                name={b.name}
                height={b.height}
                fit={b.fit}
                initial={b.viewport}
                code={b.files.map((f) => (
                  <CodeBlock key={f.path} code={readSource(f.path)} title={f.path} />
                ))}
              />
            </section>
          )
        })}
      </div>

      {type.rules && (
        <>
          <H2 id="usage">Usage rules</H2>
          <Reveal>
            <AppearItem>
              <Rules rules={type.rules} />
            </AppearItem>
          </Reveal>
        </>
      )}
    </article>
  )
}
