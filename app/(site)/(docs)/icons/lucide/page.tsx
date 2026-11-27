import type { Metadata } from "next"
import { pageMeta } from "@/site/config"
import { DocHeader } from "@/site/doc"
import { iconGroups } from "@/site/icons"
import { LucideGallery } from "@/site/lucide-gallery"

export const metadata: Metadata = pageMeta({
  title: "All Lucide icons",
  description: "Every icon in the Lucide version the kit ships with, searchable, with the kit's own set marked. Copy the name, import, JSX or SVG.",
  path: "/icons/lucide",
})

export default function LucidePage() {
  // The kit's meanings, so the full list can mark which icons already have one. The list names each icon by its current
  // Lucide name (the component's displayName), which differs from the kit's import name for the icons lucide-react 1.x
  // renamed (TriangleAlert is listed as TriangleExclamationPoint).
  const meanings = Object.fromEntries(iconGroups.flatMap((g) => g.icons.filter((i) => !i.from).map((i) => [i.Icon.displayName ?? i.name, i.means])))
  return (
    <article className="flex flex-col gap-6">
      <DocHeader
        title="All Lucide icons"
        lead="Every icon in the Lucide version the kit ships with. A dot marks the ones the kit has given a meaning. Before you use one without a dot, add it to the set with what it means, unless an icon there already means that."
      />
      <LucideGallery meanings={meanings} />
    </article>
  )
}
