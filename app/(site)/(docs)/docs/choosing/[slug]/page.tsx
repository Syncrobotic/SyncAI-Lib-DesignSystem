import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getItem } from "@/site/catalog"
import { choosing } from "@/site/choosing"
import { pageMeta } from "@/site/config"
import { DocHeader, Pager, Section, TokenTable } from "@/site/doc"
import { Dot, Inline, textLink } from "@/site/prose"

export const dynamicParams = false
export const generateStaticParams = () => choosing.map((p) => ({ slug: p.slug }))

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = choosing.find((p) => p.slug === slug)
  return page ? pageMeta({ title: `${page.title}: which one`, description: page.lead, path: `/docs/choosing/${page.slug}` }) : {}
}

export default async function ChoosingPage({ params }: Props) {
  const { slug } = await params
  const i = choosing.findIndex((p) => p.slug === slug)
  const page = choosing[i]
  if (!page) notFound()
  const name = (item: string, label?: string) => (
    <Link href={`/docs/components/${item}`} className={`${textLink} font-medium whitespace-nowrap`}>
      {label ?? getItem(item)?.title ?? item}
    </Link>
  )
  const link = (p?: (typeof choosing)[number]) => (p ? { href: `/docs/choosing/${p.slug}`, title: p.title } : undefined)
  const path = `/docs/choosing/${page.slug}`

  return (
    <article>
      <DocHeader title={page.title} lead={page.lead} />

      <Section id="rule" title="The rule">
        <p className="max-w-3xl text-base">
          <Inline text={page.rule} />
        </p>
      </Section>

      <Section id="compare" title="Side by side">
        <TokenTable head={["Component", ...page.columns]} rows={page.choices.map((c) => [name(c.item, c.label), ...c.cells])} />
      </Section>

      <Section id="each" title="In one line each">
        <ul className="flex max-w-3xl flex-col gap-2 text-base">
          {page.choices.map((c) => (
            <li key={`${c.item}-${c.label ?? ""}`} className="flex gap-3">
              <Dot />
              <span>
                {name(c.item, c.label)}: <Inline text={c.rule} />
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Pager
        prev={link(choosing[i - 1]) ?? { href: "/docs/foundations/permissions-and-data-states", title: "Permissions and data states" }}
        next={link(choosing[i + 1]) ?? { href: "/docs/components", title: "Components" }}
        trail={[
          { name: "Docs", path: "/docs" },
          { name: page.title, path },
        ]}
        description={page.lead}
      />
    </article>
  )
}
