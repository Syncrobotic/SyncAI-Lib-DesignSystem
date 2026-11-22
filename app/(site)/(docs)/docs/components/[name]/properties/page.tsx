import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { pageMeta } from "@/site/config"
import { getItem, items } from "@/site/catalog"
import { PropsTable } from "@/site/props-table"
import { hasProps } from "@/site/component-tabs-data"

export const dynamicParams = false
export const generateStaticParams = () => items.filter((i) => hasProps(i.name)).map((i) => ({ name: i.name }))

type Props = { params: Promise<{ name: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getItem((await params).name)
  if (!item) return {}
  return pageMeta({ title: `${item.title} properties`, description: `Every prop of ${item.title}: type, default and what it does, generated from the source.`, path: `/docs/components/${item.name}/properties`, image: `/og/components/${item.name}` })
}

export default async function PropertiesPage({ params }: Props) {
  const item = getItem((await params).name)
  if (!item || !hasProps(item.name)) notFound()
  return <PropsTable name={item.name} />
}
