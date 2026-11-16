import type { Metadata } from "next"
import { pageMeta } from "@/site/config"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BlockFrame } from "@/site/block-frame"
import { blocks, getBlock } from "@/site/blocks"
import { readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"

export const dynamicParams = false
export const generateStaticParams = () => blocks.map((b) => ({ name: b.name }))

type Props = { params: Promise<{ name: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getBlock((await params).name)
  if (!b) return {}
  return pageMeta({ title: `${b.title} — block`, description: b.description ?? "", path: `/blocks/${b.name}` })
}

export default async function BlockPage({ params }: Props) {
  const b = getBlock((await params).name)
  if (!b) notFound()
  const uses = (b.registryDependencies ?? []).filter((d) => d !== "@syncrobotic/cn").map((d) => d.replace("@syncrobotic/", ""))
  return (
    <main id="content" className="mx-auto max-w-6xl px-4 pt-10 pb-24">
      <Link href="/blocks" className="text-sm text-muted-foreground hover:text-foreground">
        ← All blocks
      </Link>
      <header className="flex flex-col gap-2 pt-6 pb-8">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{b.product}</p>
        <h1 className="text-3xl font-bold">{b.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{b.description}</p>
      </header>

      <BlockFrame name={b.name} height={b.height} initial={b.viewport} />

      <div className="grid gap-8 pt-10 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-bold">Code</h2>
          {b.files.map((f) => (
            <CodeBlock key={f.path} code={readSource(f.path)} title={f.path} />
          ))}
        </div>
        <aside className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Install</h2>
          <CodeBlock code={`npx shadcn add @syncrobotic/${b.name}`} lang="bash" />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Built from</span>
            <div className="flex flex-wrap gap-2">
              {uses.map((u) => (
                <Link key={u} href={`/docs/components/${u}`} className="rounded-xs bg-muted px-2 py-1 font-mono text-xs hover:bg-accent">
                  {u}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
