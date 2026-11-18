import type { Metadata } from "next"
import Link from "next/link"
import { pageMeta } from "@/site/config"
import { DocHeader } from "@/site/doc"
import { IconGallery } from "@/site/icon-gallery"
import { IconTabs } from "@/site/icon-tabs"
import { iconCount, iconGroups } from "@/site/icons"

export const metadata: Metadata = pageMeta({
  title: "Icons",
  description: `The ${iconCount} icons the kit uses, each with the one thing it means, plus robot icons drawn to match Lucide. Search by name or meaning, copy the name, import, JSX or SVG.`,
  path: "/icons",
})

export default function IconsPage() {
  // Rendered here, so the browser gets markup and the client never loads the icon components.
  const groups = iconGroups.map((g) => ({
    title: g.title,
    note: g.from ? (
      <>
        Not in Lucide. Install <code className="font-mono text-xs">npx shadcn add @syncrobotic/robot-icons</code>; they take Lucide&apos;s props.
      </>
    ) : undefined,
    icons: g.icons.map(({ name, Icon, means }) => ({
      name,
      means,
      glyph: <Icon />,
      from: g.from ? ("@/components/ui/robot-icons" as const) : ("lucide-react" as const),
    })),
  }))
  return (
    <article className="flex flex-col gap-6">
      <DocHeader
        title="Icons"
        lead="Every icon the kit uses and the one thing each means. Pick by meaning, not by look: if the meaning is here, use its icon; if it is not, add it to the set first."
      />
      <p className="max-w-2xl text-sm text-muted-foreground">
        Sizes and naming are in{" "}
        <Link href="/docs/foundations/iconography" className="text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
          Iconography
        </Link>
        . Lint rejects a Lucide import that is not in this set.
      </p>
      <IconTabs current="kit" />
      <IconGallery groups={groups} total={iconCount} placeholder="Search by name or meaning" />
    </article>
  )
}
