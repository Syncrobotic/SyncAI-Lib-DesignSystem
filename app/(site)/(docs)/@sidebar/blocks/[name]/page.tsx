import { SectionsOf } from "@/site/sidebar-slot"

// A block type's blocks. An old block address redirects (its page), so it has none.
export default async function BlockTypeSections({ params }: { params: Promise<{ name: string }> }) {
  return <SectionsOf href={`/blocks/${(await params).name}`} />
}
