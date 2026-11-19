import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { pageMeta } from "@/site/config"
import { blocks, blocksOfType, getBlock } from "@/site/blocks"
import { blockHref, blockTypes, getBlockType, typeHref } from "@/site/block-types"
import { BlockSection } from "@/site/block-section"
import { Dot, H2, PageTitle, Rules } from "@/site/prose"
import { AppearItem, Reveal } from "@/site/appear"

// One page per block type, like one page per component: every block of the type, each with its preview, code and install.
// A block's own name still works as a URL (old links, the markdown twins) and leads to its place on the type page.
export const dynamicParams = false
export const generateStaticParams = () => [
  // Pattern sets too: their old URLs lead to the component page that now shows them.
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
    if (b) permanentRedirect(blockHref(b.name))
    notFound()
  }
  if (type.home) permanentRedirect(typeHref(type))
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
        {list.map((b) => (
          <BlockSection key={b.name} block={b} />
        ))}
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
