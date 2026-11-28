import { SectionsOf } from "@/site/sidebar-slot"

// A component's examples and pattern sets, the same on each of its tabs (the tabs' pages below draw nothing).
export default async function ComponentSections({ params }: { params: Promise<{ name: string }> }) {
  return <SectionsOf href={`/docs/components/${(await params).name}`} />
}
