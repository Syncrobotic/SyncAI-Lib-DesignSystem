import type { Metadata } from "next"
import Link from "next/link"
import { pageMeta } from "@/site/config"
import { DocHeader, Pager } from "@/site/doc"
import { IconBrowser } from "@/site/icon-browser"
import { iconCount, iconGroups } from "@/site/icons"

export const metadata: Metadata = pageMeta({
  title: "Icon set",
  description: `The ${iconCount} Lucide icons the kit uses, each with the one thing it means. Search by name or meaning and copy the name.`,
  path: "/docs/icons",
})

export default function IconsPage() {
  // Rendered here, so the browser gets markup and the client never loads the icon components.
  const groups = iconGroups.map((g) => ({
    title: g.title,
    note: g.from ? (
      <>
        Not in Lucide. Install <code className="font-mono text-xs">npx shadcn add @syncrobotic/robot-icons</code> and import from{" "}
        <code className="font-mono text-xs">robot-icons</code>; they take Lucide&apos;s props.
      </>
    ) : undefined,
    icons: g.icons.map(({ name, Icon, means }) => ({ name, means, glyph: <Icon /> })),
  }))
  return (
    <article>
      <DocHeader
        title="Icon set"
        lead="Every icon the kit uses and the one thing each means. Pick by meaning, not by look: if the meaning is here, use its icon; if it is not, add it to the set before you use a new one."
      />
      <p className="max-w-2xl pt-6 pb-6 text-sm text-muted-foreground">
        Sizes and naming are in{" "}
        <Link href="/docs/foundations/iconography" className="text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
          Iconography
        </Link>
        . Lint rejects a Lucide import that is not in this set.
      </p>
      <IconBrowser groups={groups} total={iconCount} />
      <Pager prev={{ href: "/docs/foundations/iconography", title: "Iconography" }} next={{ href: "/docs/foundations/accessibility", title: "Accessibility" }} />
    </article>
  )
}
