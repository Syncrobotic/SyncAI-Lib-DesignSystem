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
    <article>
      <Link href="/blocks" className="text-sm text-muted-foreground hover:text-foreground">
        ← All blocks
      </Link>
      <header className="flex flex-col gap-2 pt-6 pb-8">
        <p className="text-sm font-medium text-muted-foreground">{b.product}</p>
        <h1 className="text-3xl font-bold">{b.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{b.description}</p>
      </header>

      <div className="flex flex-col gap-3 pb-8">
        <CodeBlock code={`npx shadcn add @syncrobotic/${b.name}`} lang="bash" title="Install" />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Built from
          {uses.map((u) => (
            <Link key={u} href={`/docs/components/${u}`} className="rounded-xs bg-muted px-2 py-1 font-mono text-xs hover:bg-accent">
              {u}
            </Link>
          ))}
        </div>
      </div>

      <BlockFrame
        name={b.name}
        height={b.height}
        fit={b.product === "App shells" ? "screen" : "content"}
        initial={b.viewport}
        code={b.files.map((f) => (
          <CodeBlock key={f.path} code={readSource(f.path)} title={f.path} />
        ))}
      />
    </article>
  )
}
